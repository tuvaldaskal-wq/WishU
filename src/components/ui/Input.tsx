import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
    return (
        <div className="mb-4 w-full">
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-2 ms-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-darkbg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all shadow-sm ${error ? 'border-red-500 focus:ring-red-200' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-red-500 text-sm mt-1 ms-1">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ label, error, className = '', ...props }, ref) => {
    return (
        <div className="mb-4 w-full">
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-2 ms-1">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-darkbg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all shadow-sm resize-none ${error ? 'border-red-500 focus:ring-red-200' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-red-500 text-sm mt-1 ms-1">{error}</p>}
        </div>
    );
});

TextArea.displayName = 'TextArea';
