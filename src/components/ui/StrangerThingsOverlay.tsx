"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function StrangerThingsOverlay() {
    const { theme } = useTheme();
    const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, duration: number, delay: number}>>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Generate random particles only on client mount
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: 10 + Math.random() * 20,
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    if (!mounted || theme !== "stranger") return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,0,0,0.4)_50%,rgba(0,0,0,0.8)_100%)] mix-blend-multiply" />

            {/* Film Grain (CSS simulated) */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-50 contrast-200" />

            {/* Floating Particles (Spores) */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute w-1 h-1 bg-white/40 rounded-full blur-[1px]"
                    initial={{
                        x: `${p.x}vw`,
                        y: "110vh",
                        opacity: 0
                    }}
                    animate={{
                        y: "-10vh",
                        x: `${p.x + (Math.sin(p.id) * 5)}vw`, // Drift slightly (deterministic)
                        opacity: [0, 0.8, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}
