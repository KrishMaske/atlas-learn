"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Skull } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme("light")}
                className={`p-2 rounded-full transition-colors ${theme === "light" ? "bg-white text-black" : "text-gray-400 hover:text-white"
                    }`}
                aria-label="Light Mode"
            >
                <Sun size={18} />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-full transition-colors ${theme === "dark" ? "bg-neutral-800 text-white" : "text-gray-400 hover:text-white"
                    }`}
                aria-label="Dark Mode"
            >
                <Moon size={18} />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme("stranger")}
                className={`p-2 rounded-full transition-colors relative group ${theme === "stranger" ? "bg-red-900 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "text-red-900/50 hover:text-red-500"
                    }`}
                aria-label="Stranger Things Mode"
            >
                <Skull size={18} />
                {theme !== "stranger" && (
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">
                        ENTER THE UPSIDE DOWN
                    </span>
                )}
            </motion.button>
        </div>
    );
}
