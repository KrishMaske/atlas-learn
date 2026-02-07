"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useTheme } from "next-themes";

export function CustomCursor() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 700 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        setMounted(true);

        const moveCursor = (e: MouseEvent) => {
            mouseX.set(e.clientX - 16);
            mouseY.set(e.clientY - 16);
        };

        window.addEventListener("mousemove", moveCursor);
        return () => {
            window.removeEventListener("mousemove", moveCursor);
        };
    }, [mouseX, mouseY]);

    if (!mounted) return null;

    // Don't show custom cursor on touch devices usually, but for this demo we'll keep it simple

    if (theme === "stranger") {
        return (
            <>
                {/* Ambient Flashlight beam (Behind everything mode in CSS if possible, but here z-index is tricky. 
               We reduce opacity and blend mode to ensure text is readable under it) */}
                <motion.div
                    className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none z-[60] mix-blend-screen"
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: "-50%",
                        translateY: "-50%",
                        background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(220,38,38,0.05) 30%, transparent 60%)", // Very subtle light
                        filter: "blur(40px)",
                    }}
                />
                {/* Retro Crosshair Cursor */}
                <motion.div
                    className="fixed top-0 left-0 z-[70] pointer-events-none"
                    style={{
                        x: cursorX,
                        y: cursorY,
                    }}
                >
                    <div className="relative -translate-x-1/2 -translate-y-1/2">
                        <div className="absolute w-[2px] h-4 bg-red-500/80 left-0 -top-2" />
                        <div className="absolute w-4 h-[2px] bg-red-500/80 -left-2 top-0" />
                    </div>
                </motion.div>
            </>
        )
    }

    return (
        <motion.div
            className="fixed top-0 left-0 w-6 h-6 rounded-full border border-black/50 dark:border-white/50 pointer-events-none z-50"
            style={{
                x: cursorX,
                y: cursorY,
            }}
        >
            <div className="w-1 h-1 bg-current rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
    );
}
