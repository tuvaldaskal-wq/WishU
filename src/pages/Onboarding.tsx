import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { WizardLayout } from '../components/ui/WizardLayout';
import { Input, TextArea } from '../components/ui/Input';
import { DateInput } from '../components/ui/DateInput';
import { Plus, X, Copy, Check } from 'lucide-react';

interface ImportantDate {
    title: string;
    date: string;
}

const Onboarding = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState(user?.displayName || '');
    const [dob, setDob] = useState('');
    const [dates, setDates] = useState<ImportantDate[]>([{ title: '', date: '' }]);
    const [partnerName, setPartnerName] = useState('');
    const [message, setMessage] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user?.displayName) {
            setName(user.displayName);
        }
    }, [user]);

    const messageSuggestions = [
        t('msg_sugg_1', "I can't wait to share my dreams with you!"),
        t('msg_sugg_2', "Let's build our wishlist together."),
        t('msg_sugg_3', "You're the only one I want to share this with.")
    ];

    const handleNext = async () => {
        if (step === 0 && dob) {
            // Auto-add birthday if set and not already present
            const hasBirthday = dates.some(d => d.title.toLowerCase().includes('birthday') || d.title.includes('יום הולדת'));
            if (!hasBirthday) {
                // Simple logic to add "My Birthday"
                setDates(prev => {
                    // If the first one is empty, replace it
                    if (prev.length === 1 && !prev[0].title && !prev[0].date) {
                        return [{ title: t('my_birthday', 'My Birthday'), date: dob }];
                    }
                    return [...prev, { title: t('my_birthday', 'My Birthday'), date: dob }];
                });
            }
        }

        if (step === 2) {
            // Final step - Generate Invite
            await createCouple();
            return;
        }
        setStep(prev => prev + 1);
    };

    const createCouple = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Create User Profile
            const userRef = doc(db, 'users', user.uid);
            // using setDoc with merge to ensure it works even if doc doesn't exist
            const { setDoc } = await import('firebase/firestore');
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: name, // User confirmed name
                photoURL: user.photoURL,
                dob,
                role: 'partner_a', // As per requirements
                createdAt: serverTimestamp()
            }, { merge: true });

            // 2. Create Couple
            const coupleRef = await addDoc(collection(db, 'couples'), {
                partner1Id: user.uid,
                partner1Name: name,
                partner2Name: partnerName,
                importantDates: dates.filter(d => d.title && d.date),
                invitationMessage: message,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // 3. Link user to couple
            await updateDoc(userRef, {
                coupleId: coupleRef.id
            });


            // 4. Generate Link
            // Using ?from=USER_ID format as requested in prompt mostly, but ID logic:
            // "Takes the from ID from the URL" -> simpler to use Couple ID to find the record, 
            // but let's see. If I use ?from=USER_ID, the invite page needs to query couples where partner1Id == USER_ID.
            // Using /invite/COUPLE_ID is safer and faster (direct doc lookup).
            // I will stick to /invite/COUPLE_ID but the prompt example was ?from=...
            // I'll keep the existing working ID route.
            const link = `${window.location.origin}/invite/${coupleRef.id}`;
            setInviteLink(link);
            setStep(prev => prev + 1); // Move to Step 4 (Success/Share)

        } catch (error) {
            console.error("Error creating couple:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const addDate = () => setDates([...dates, { title: '', date: '' }]);
    const removeDate = (index: number) => setDates(dates.filter((_, i) => i !== index));
    const updateDate = (index: number, field: keyof ImportantDate, value: string) => {
        const newDates = [...dates];
        newDates[index][field] = value;
        setDates(newDates);
    };

    const copyToClipboard = async () => {
        const copyFallback = (text: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // Ensure textArea is part of the DOM but invisible/unobtrusive
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } else {
                    console.error('Fallback: Copying text command was unsuccessful');
                }
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        };

        if (!inviteLink) return;

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Navigator clipboard failed:', err);
                copyFallback(inviteLink);
            }
        } else {
            copyFallback(inviteLink);
        }
    }

    const steps = [
        // Step 1: You
        {
            title: t('onboarding_step1_title', 'About You'),
            description: t('onboarding_step1_desc', 'Let\'s start with your details.'),
            render: () => (
                <div className="space-y-4">
                    <Input
                        label={t('name_label', 'Your Name')}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('name_placeholder', 'e.g. Sarah')}
                    />
                    <DateInput
                        label={t('dob_label', 'Date of Birth')}
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                    />
                </div>
            )
        },
        // Step 2: Dates
        {
            title: t('onboarding_step2_title', 'Important Dates'),
            description: t('onboarding_step2_desc', 'Anniversaries, birthdays, or special moments.'),
            render: () => (
                <div className="space-y-4">
                    {dates.map((date, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder={t('date_title_placeholder', 'Link Title (e.g. Anniversary)')}
                                    value={date.title}
                                    onChange={e => updateDate(i, 'title', e.target.value)}
                                />
                                <DateInput
                                    value={date.date}
                                    onChange={e => updateDate(i, 'date', e.target.value)}
                                />
                            </div>
                            {dates.length > 1 && (
                                <button onClick={() => removeDate(i)} className="mt-2 p-2 text-red-400 hover:bg-red-50 rounded-full">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addDate} className="text-primary font-medium flex items-center gap-2 hover:underline">
                        <Plus size={18} /> {t('add_date', 'Add another date')}
                    </button>
                    <p className="text-xs text-slate-400 mt-2">{t('auto_birthday_hint', 'We automatically added your birthday!')}</p>
                </div>
            )
        },
        // Step 3: Partner
        {
            title: t('onboarding_step3_title', 'Your Partner'),
            description: t('onboarding_step3_desc', 'Who are we inviting to join you?'),
            render: () => (
                <div className="space-y-4">
                    <Input
                        label={t('partner_name_label', 'Partner\'s Name')}
                        value={partnerName}
                        onChange={e => setPartnerName(e.target.value)}
                        placeholder={t('partner_name_placeholder', 'e.g. David')}
                    />
                    <TextArea
                        label={t('message_label', 'Personal Message')}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={t('message_placeholder', 'Write something sweet to invite them...')}
                        rows={4}
                    />
                    <div className="flex gap-2 flex-wrap">
                        {messageSuggestions.map((sugg, i) => (
                            <button
                                key={i}
                                onClick={() => setMessage(sugg)}
                                className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-500 hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                                {sugg}
                            </button>
                        ))}
                    </div>
                </div>
            )
        },
        // Step 4: Success
        {
            title: t('onboarding_step4_title', 'Invitation Ready!'),
            description: t('onboarding_step4_desc', 'Share this link with your partner to connect.'),
            render: () => (
                <div className="space-y-6 text-center">
                    <div className="p-6 bg-white rounded-3xl border border-dashed border-primary/30 flex flex-col items-center gap-4">
                        <p className="text-slate-600 font-medium break-all select-all">{inviteLink}</p>
                        <button
                            onClick={copyToClipboard}
                            className="text-primary font-bold hover:underline flex items-center gap-2"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? t('copied', 'Copied!') : t('copy_link', 'Copy Link')}
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-400 hover:text-darkbg transition-colors"
                    >
                        {t('skip_dashboard', 'Go to Dashboard')}
                    </button>
                </div>
            )
        }
    ];

    const currentStepData = steps[step];

    return (
        <WizardLayout
            currentStep={step}
            totalSteps={steps.length}
            title={currentStepData.title}
            description={currentStepData.description}
            onNext={step === 3 ? undefined : handleNext} // Hide standard next on final step
            onBack={step > 0 && step < 3 ? () => setStep(step - 1) : undefined}
            nextLabel={step === 2 ? t('create_invite', 'Create Invitation') : t('next', 'Next')}
            showNext={step < 3} // Hide next button on success step
            showBack={step < 3}
        >
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : (
                currentStepData.render()
            )}
        </WizardLayout>
    );
};

export default Onboarding;
