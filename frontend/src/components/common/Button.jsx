export default function Button({ children, variant = 'gold', size = 'md', className = '', ...props }) {
    const variants = {
        // Champagne gold for fine dining
        gold: 'bg-gradient-to-r from-[#D9C6A5] to-[#EADBC8] hover:from-[#EADBC8] hover:to-[#FFF8E7] text-[#0b132b] font-extrabold shadow-md shadow-amber-900/10 active:scale-95',

        // Galaxy cyan for a modern accent
        cyan: 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-[#0b132b] font-extrabold shadow-md shadow-cyan-500/20 active:scale-95',

        // Translucent glass for secondary actions
        glass: 'bg-white/10 hover:bg-white/20 text-[#fff8e7] border border-white/30 backdrop-blur-md font-bold active:scale-95',

        // Minimal outline
        outlineGold: 'border border-[#D9C6A5] text-[#D9C6A5] hover:bg-[#D9C6A5]/10 font-bold active:scale-95',
    };

    const sizes = {
        sm: 'px-4 py-1.5 text-xs rounded-lg',
        md: 'px-5 py-2.5 text-sm rounded-xl',
        lg: 'px-7 py-3.5 text-base rounded-xl',
    };

    return (
        <button
            className={`transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}