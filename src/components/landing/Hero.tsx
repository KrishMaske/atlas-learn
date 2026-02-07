import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden pt-20">
            {/* Background Layers */}
            <div className="absolute inset-0 bg-background z-0" />

            {/* Animated Grid */}
            <div className="absolute inset-0 z-0 opacity-20 transform-gpu">
                <div className="absolute inset-0 bg-grid-pattern animate-grid-move" />
                {/* Radial Fade */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/80 to-background" />
            </div>

            {/* Glow Effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto text-center space-y-8">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md shadow-[0_0_15px_-3px_var(--color-primary)]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-wide text-primary uppercase">
                        v2.0 Now Live
                    </span>
                </div>

                {/* Hero Composition */}
                <div className="relative">
                    {/* Background Graphic (Abstract Blueprint) */}
                    <div className="absolute -inset-10 opacity-30 blur-sm">
                        <svg className="w-full h-full text-indigo-500/30" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                            <circle cx="50" cy="50" r="40" strokeWidth="0.5" strokeDasharray="4 4" className="animate-spin-slow" />
                            <path d="M50 10 L50 90 M10 50 L90 50" strokeWidth="0.5" />
                            <rect x="30" y="30" width="40" height="40" strokeWidth="0.5" />
                        </svg>
                    </div>

                    <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 drop-shadow-2xl">
                        Atlas
                    </h1>
                </div>

                <p className="max-w-2xl text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-light">
                    The <span className="text-foreground font-medium">interactive system design laboratory</span>.
                    Visualize, simulate, and generate production-ready backend code in a single workflow.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                    <Link
                        href="/sandbox"
                        className="group relative px-8 py-3.5 bg-background text-foreground rounded-full font-medium transition-all duration-300 hover:scale-105"
                    >
                        {/* Gradient Border Hack */}
                        <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-to-r from-cyan-500 to-purple-500 -z-10 blur-[1px] group-hover:blur-[2px] transition-all" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <span className="relative flex items-center gap-2">
                            Open Sandbox <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>

                    <Link
                        href="/tutorial"
                        className="group px-8 py-3.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-300"
                    >
                        <span className="flex items-center gap-2">
                            <Play className="w-4 h-4 fill-current" /> Start Tutorial
                        </span>
                    </Link>
                </div>
            </div>

            {/* Decorative gradient fade at bottom */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>
    );
}
