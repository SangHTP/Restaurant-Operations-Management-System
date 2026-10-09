export default function Badge({ children, variant = 'default' }) {
    const styles = {
        default: 'bg-slate-100 text-slate-800',
        success: 'bg-emerald-100 text-emerald-700',
        danger: 'bg-red-100 text-red-700',
        warning: 'bg-amber-100 text-amber-800',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${styles[variant] || styles.default}`}>
            {children}
        </span>
    );
}