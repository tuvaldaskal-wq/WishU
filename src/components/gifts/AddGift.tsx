import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, X, Link as LinkIcon, Loader2, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { fetchMetadata } from '../../lib/scraper';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

interface AddGiftProps {
    onClose: () => void;
    initialUrl?: string;
}

export const AddGift = ({ onClose, initialUrl }: AddGiftProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [link, setLink] = useState(initialUrl || '');
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [visibility, setVisibility] = useState<string[]>(['Friends', 'Family', 'Partner', 'Work', 'Other']);

    const [loading, setLoading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [scrapeMessage, setScrapeMessage] = useState('');
    const [priceError, setPriceError] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const lastScrapedUrl = useRef<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);

    // Debounced scraping with "Silent Fail" UI
    // After 8 seconds, show manual input while cloud function continues in background
    useEffect(() => {
        let isCancelled = false;
        let silentFailTimer: ReturnType<typeof setTimeout>;

        const timer = setTimeout(async () => {
            console.log("AddGift: Effect triggered with link:", link);
            // Only scrape if it's a valid URL and we haven't already scraped it
            if (link && link.startsWith('http') && link !== lastScrapedUrl.current) {
                console.log("AddGift: Starting scrape for:", link);
                setScraping(true);
                setScrapeMessage('🔍 Searching deeply for price... (this may take 15-20 seconds)');
                lastScrapedUrl.current = link;

                // Silent Fail: After 8 seconds, prompt manual input but keep scraping
                silentFailTimer = setTimeout(() => {
                    if (!isCancelled) {
                        console.log("AddGift: Still searching - prompting manual input");
                        setScrapeMessage('⏳ Deep search in progress... You can enter details manually below while we keep looking.');
                        priceInputRef.current?.focus();
                    }
                }, 8000);

                const data = await fetchMetadata(link);
                clearTimeout(silentFailTimer);

                if (isCancelled) return;

                console.log("AddGift: Scrape result:", data);
                if (data) {
                    if (data.isBlocked) {
                        setScrapeMessage(data.message || 'Could not fetch details. Please add manually.');
                        setTimeout(() => priceInputRef.current?.focus(), 100);
                    } else {
                        // Auto-fill any data we found (even if user started typing)
                        if (data.title && !title) setTitle(data.title);
                        if (data.image && !image) setImage(data.image);
                        if (data.price) {
                            // Only auto-fill price if user hasn't entered one
                            if (!price) {
                                setPrice(data.price);
                                setScrapeMessage(`✅ Price found: ${data.price}`);
                            } else {
                                setScrapeMessage(`✅ Found price: ${data.price} (keeping your entry)`);
                            }
                            setTimeout(() => setScrapeMessage(''), 3000);
                        } else {
                            setScrapeMessage('💰 Price not found. Please enter manually.');
                            if (!price) setTimeout(() => priceInputRef.current?.focus(), 100);
                        }
                    }
                } else {
                    console.warn("AddGift: Scraper returned no data");
                    setScrapeMessage('Could not fetch details. Please add manually.');
                    setTimeout(() => priceInputRef.current?.focus(), 100);
                }
                setScraping(false);
            } else if (!link || !link.startsWith('http')) {
                console.log("AddGift: Link ignored (empty or no http)");
            }
        }, 800);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
            clearTimeout(silentFailTimer);
        };
    }, [link]); // eslint-disable-line react-hooks/exhaustive-deps

    const validatePrice = (value: string): boolean => {
        // Price must have at least one digit
        return /\d/.test(value);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert to base64 for preview (in production, upload to Firebase Storage)
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleAdd = async () => {
        setAttemptedSubmit(true);

        // Validate price
        if (!validatePrice(price)) {
            setPriceError(true);
            return;
        }
        setPriceError(false);

        if (!title) {
            console.warn("Missing title");
            return;
        }
        if (!user) {
            console.warn("Missing user");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'gifts'), {
                ownerId: user.uid,
                title,
                price,
                link,
                imageUrl: image,
                status: 'available',
                visibility,
                createdAt: serverTimestamp()
            });
            onClose();
        } catch (err) {
            console.error("Failed to add gift", err);
            alert("Error adding gift");
        } finally {
            setLoading(false);
        }
    };

    const isPriceInvalid = attemptedSubmit && !validatePrice(price);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-lightbg w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-darkbg mb-6 text-center">{t('add_gift')}</h2>

                <div className="space-y-4">
                    {/* Link Input */}
                    <div className="relative">
                        <Input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder={t('paste_link')}
                            label="Link"
                            className="pl-10"
                        />
                        <div className="absolute left-3 top-[38px] text-slate-400">
                            {scraping ? <Loader2 size={18} className="animate-spin text-primary" /> : <LinkIcon size={18} />}
                        </div>
                    </div>

                    {/* Scrape Message */}
                    {scrapeMessage && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm animate-pulse">
                            <AlertCircle size={18} />
                            <span>{scrapeMessage}</span>
                        </div>
                    )}

                    {/* Preview Card with Upload Option */}
                    <div className="flex gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div
                            className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center relative cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {image ? (
                                <>
                                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload size={20} className="text-white" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-300">
                                    <ImageIcon size={24} />
                                    <span className="text-[10px]">Upload</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-semibold text-sm text-darkbg truncate">{title || 'Gift Title'}</h4>
                            <p className="text-xs text-slate-500 truncate">{link || 'Paste a link above'}</p>
                            {!image && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-1 text-xs text-primary font-medium flex items-center gap-1"
                                >
                                    <Upload size={12} />
                                    Upload image
                                </button>
                            )}
                        </div>
                    </div>

                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('gift_title')}
                        label={t('gift_title')}
                    />

                    {/* Price Input with Validation */}
                    <div>
                        <Input
                            ref={priceInputRef}
                            value={price}
                            onChange={(e) => {
                                setPrice(e.target.value);
                                if (priceError && validatePrice(e.target.value)) {
                                    setPriceError(false);
                                }
                            }}
                            placeholder={t('price') + ' (e.g. 100₪)'}
                            label={t('price') + ' *'}
                            className={isPriceInvalid ? 'border-red-500 focus:ring-red-500' : ''}
                        />
                        {isPriceInvalid && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Price is required
                            </p>
                        )}
                    </div>

                    {/* Visibility Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Who can see this?</label>
                        <div className="flex flex-wrap gap-2">
                            {['Friends', 'Family', 'Partner', 'Work', 'Other'].map(group => (
                                <button
                                    key={group}
                                    onClick={() => {
                                        if (visibility.includes(group)) {
                                            setVisibility(visibility.filter(g => g !== group));
                                        } else {
                                            setVisibility([...visibility, group]);
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${visibility.includes(group)
                                        ? 'bg-darkbg text-white border-darkbg'
                                        : 'bg-white text-slate-400 border-slate-200'
                                        }`}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                <button
                    onClick={handleAdd}
                    disabled={!title || loading}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-4 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                    {t('add_gift')}
                </button>
            </motion.div>
        </motion.div>
    );
};

