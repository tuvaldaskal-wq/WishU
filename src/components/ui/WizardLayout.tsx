import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface WizardLayoutProps {
    currentStep: number;
    totalSteps: number;
    onNext?: () => void;
    onBack?: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    nextLabel?: string;
    backLabel?: string;
    showNext?: boolean;
    showBack?: boolean;
}

export const WizardLayout = ({
    currentStep,
    totalSteps,
    onNext,
    onBack,
    title,
    description,
    children,
    nextLabel = "Next",
    backLabel = "Back",
    showNext = true,
    showBack = true
}: WizardLayoutProps) => {
    return (
        <div className="min-h-screen bg-lightbg flex flex-col font-sans">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-100">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <main className="flex-1 container mx-auto px-6 py-12 flex flex-col max-w-lg w-full">
                <header className="mb-8">
                    <motion.h1
                        key={title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-darkbg mb-2"
                    >
                        {title}
                    </motion.h1>
                    {description && (
                        <motion.p
                            key={description}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500"
                        >
                            {description}
                        </motion.p>
                    )}
                </header>

                <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex gap-4 pt-4 border-t border-slate-100">
                    {showBack && (
                        <button
                            onClick={onBack}
                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {document.dir === 'rtl' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                            {backLabel}
                        </button>
                    )}
                    {showNext && (
                        <button
                            onClick={onNext}
                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {nextLabel}
                            {document.dir === 'rtl' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                        </button>
                    )}
                </div>
            </main>
        </div>
    )
}
