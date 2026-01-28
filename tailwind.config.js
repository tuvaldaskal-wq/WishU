/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary': '#0C0C4F', // Navy (Brand Core)
                'primary-foreground': '#FFFFFF',
                'primary-light': '#1E1E6F', // Lighter Navy
                'secondary': '#E79BE3', // Pink/Lilac (Brand Accent)
                'secondary-foreground': '#0C0C4F',
                'accent': '#DFE137', // Lime/Yellow (Brand Highlight)
                'lilac': '#C9BFF1', // Light Lilac (Backgrounds/Secondary)
                'lavender': '#C9BFF1', // Alias for backward compatibility
                'darkbg': '#0C0C4F', // Navy as dark bg
                'lightbg': '#F8F9FA', // Standard light bg
                'cardbg': '#FFFFFF',
                'muted-text': '#6B7280', // Gray 500
                'soft-text': '#374151', // Gray 700
                'success': '#10B981',
                'danger': '#EF4444',
            },
            borderRadius: {
                'pill': '9999px',
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            fontFamily: {
                sans: ['"Rubik"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
// Trigger rebuild
