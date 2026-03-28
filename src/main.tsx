import './lib/safe-storage'
import React, { Component, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import './i18n'

// Global error boundary — catches any render crash and shows a recovery screen
// instead of a blank white page. Critical for mobile where crashes are silent.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('WishU app crashed:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', padding: '24px',
                    textAlign: 'center', fontFamily: 'sans-serif', background: '#fff'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💝</div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0C0C4F', marginBottom: '8px' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '300px' }}>
                        WishU ran into an issue. Please reload to try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#0C0C4F', color: 'white', border: 'none',
                            borderRadius: '12px', padding: '14px 28px',
                            fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
)
