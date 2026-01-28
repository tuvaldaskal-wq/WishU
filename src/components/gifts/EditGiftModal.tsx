import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Link as LinkIcon, Loader2, Image as ImageIcon, Save, Trash2, RefreshCw, Upload, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { fetchMetadata } from '../../lib/scraper';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Gift } from './GiftCard';

interface EditGiftModalProps {
    gift: Gift;
    onClose: () => void;
}

export const EditGiftModal = ({ gift, onClose }: EditGiftModalProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [link, setLink] = useState(gift.link || '');
    const [title, setTitle] = useState(gift.title || '');
    const [price, setPrice] = useState(gift.price || '');
    const [image, setImage] = useState(gift.imageUrl || '');
    const [visibility, setVisibility] = useState<string[]>(gift.visibility || ['Friends', 'Family', 'Partner', 'Work', 'Other']);

    const [loading, setLoading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [scrapeMessage, setScrapeMessage] = useState('');
    const [priceError, setPriceError] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);

    const validatePrice = (value: string): boolean => {
        return /\d/.test(value);
    };

    const handleResync = async () => {
        if (!link) return;
        setScraping(true);
        setScrapeMessage('🔍 Searching for price...');

        // Silent Fail: After 4 seconds, prompt manual input but keep scraping
        const silentFailTimer = setTimeout(() => {
            setScrapeMessage('⏳ Still searching... You can update details manually below.');
            priceInputRef.current?.focus();
        }, 4000);

        try {
            const data = await fetchMetadata(link);
            clearTimeout(silentFailTimer);

            if (data) {
                if (data.isBlocked) {
                    setScrapeMessage(data.message || 'Could not fetch details. Please add manually.');
                    setTimeout(() => priceInputRef.current?.focus(), 100);
                } else {
                    if (data.title) setTitle(data.title);
                    if (data.image) setImage(data.image);
                    if (data.price) {
                        setPrice(data.price);
                        setScrapeMessage(`✅ Price found: ${data.price}`);
                        setTimeout(() => setScrapeMessage(''), 3000);
                    } else {
                        setScrapeMessage('💰 Price not found. Please enter manually.');
                        setTimeout(() => priceInputRef.current?.focus(), 100);
                    }
                }
            } else {
                setScrapeMessage('Could not fetch details. Please add manually.');
                setTimeout(() => priceInputRef.current?.focus(), 100);
            }
        } catch (error) {
            clearTimeout(silentFailTimer);
            console.error("Resync failed", error);
            setScrapeMessage('Sync failed. Please update manually.');
            setTimeout(() => priceInputRef.current?.focus(), 100);
        } finally {
            setScraping(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setAttemptedSubmit(true);

        if (!validatePrice(price)) {
            setPriceError(true);
            return;
        }
        setPriceError(false);

        if (!user || !title) return;
        setLoading(true);

        try {
            await updateDoc(doc(db, 'gifts', gift.id), {
                title,
                price,
                link,
                imageUrl: image,
                visibility,
                updatedAt: new Date()
            });
            onClose();
        } catch (err) {
            console.error("Failed to update gift", err);
            alert("Error updating gift");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t('delete_confirm') || "Are you sure you want to delete this gift?")) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'gifts', gift.id));
            onClose();
        } catch (err) {
            console.error("Failed to delete gift", err);
            alert("Error deleting gift");
            setLoading(false);
        }
    };

    const toggleGroup = (group: string) => {
        if (visibility.includes(group)) {
            setVisibility(visibility.filter(g => g !== group));
        } else {
            setVisibility([...visibility, group]);
        }
    };

    const isPriceInvalid = attemptedSubmit && !validatePrice(price);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-lightbg w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold text-darkbg mb-6">Edit Gift</h2>

                <div className="space-y-5">
                    {/* Link Section */}
                    <div className="flex gap-2 items-end">
                        <div className="relative flex-1">
                            <Input
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder={t('paste_link')}
                                label="Link"
                                className="pl-10"
                            />
                            <div className="absolute left-3 top-[38px] text-slate-400">
                                <LinkIcon size={18} />
                            </div>
                        </div>
                        <button
                            onClick={handleResync}
                            disabled={scraping}
                            className="p-3 bg-secondary text-slate-600 rounded-xl hover:bg-slate-300 transition-colors mb-[2px]"
                            title="Re-sync data"
                        >
                            {scraping ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                        </button>
                    </div>

                    {/* Scrape Message */}
                    {scrapeMessage && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm animate-pulse">
                            <AlertCircle size={18} />
                            <span>{scrapeMessage}</span>
                        </div>
                    )}

                    {/* Preview with Upload */}
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
                            <h4 className="font-semibold text-sm text-darkbg truncate">{title}</h4>
                            <p className="text-xs text-slate-500 truncate">{link}</p>
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
                        placeholder="Gift Title"
                        label="Title"
                    />

                    {/* Price with Validation */}
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
                            placeholder="Price (e.g. 100₪)"
                            label="Price *"
                            className={isPriceInvalid ? 'border-red-500 focus:ring-red-500' : ''}
                        />
                        {isPriceInvalid && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Price is required
                            </p>
                        )}
                    </div>

                    {/* Visibility */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Who can see this?</label>
                        <div className="flex flex-wrap gap-2">
                            {['Friends', 'Family', 'Partner', 'Work', 'Other'].map(group => (
                                <button
                                    key={group}
                                    onClick={() => toggleGroup(group)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${visibility.includes(group)
                                        ? 'bg-darkbg text-white border-darkbg'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title || loading}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

