import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [request, setRequest] = useState(null);
    const requestRef = useRef(null);

    const confirm = useCallback((options) => new Promise((resolve) => {
        requestRef.current?.resolve(false);
        const nextRequest = { ...options, resolve };
        requestRef.current = nextRequest;
        setRequest(nextRequest);
    }), []);

    const answer = useCallback((accepted) => {
        const activeRequest = requestRef.current;
        requestRef.current = null;
        setRequest(null);
        activeRequest?.resolve(accepted);
    }, []);

    useEffect(() => {
        if (!request) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') answer(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [answer, request]);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {request && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) answer(false);
                    }}
                >
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        aria-describedby="confirm-dialog-description"
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        <div className="p-6 sm:p-7">
                            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                                request.tone === 'warning'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-600'
                            }`}>
                                {request.icon === 'logout'
                                    ? <LogOut size={21} aria-hidden="true" />
                                    : <AlertTriangle size={21} aria-hidden="true" />}
                            </div>
                            <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900">
                                {request.title || 'Are you sure?'}
                            </h2>
                            <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">
                                {request.message}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7">
                            <button
                                type="button"
                                onClick={() => answer(false)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                {request.cancelText || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={() => answer(true)}
                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                                    request.tone === 'warning'
                                        ? 'bg-amber-700 hover:bg-amber-800'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {request.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) throw new Error('useConfirm must be used within a ConfirmProvider');
    return confirm;
}
