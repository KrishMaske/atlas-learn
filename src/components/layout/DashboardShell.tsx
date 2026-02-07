"use client";

import React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard,
    Grid,
    Settings,
    Zap,
    Layout,
    BookOpen
} from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StrangerThingsOverlay } from "@/components/ui/StrangerThingsOverlay";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <div className="flex h-screen w-full overflow-hidden transition-all duration-700">
            <Sidebar theme={theme} />
            <div className="flex-1 flex flex-col relative z-20">
                <Header theme={theme} />
                <main className="flex-1 overflow-hidden relative">
                    {children}
                    {/* Scanned Grid Overlay for Stranger Things */}
                    <AnimatePresence>
                        {theme === 'stranger' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="pointer-events-none absolute inset-0 z-10 mix-blend-overlay opacity-30 bg-[size:50px_50px] bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)]"
                            />
                        )}
                    </AnimatePresence>
                    <StrangerThingsOverlay />
                </main>
            </div>
        </div>
    );
}

function Sidebar({ theme }: { theme: string | undefined }) {
    const pathname = usePathname();

    const links = [
        { icon: Grid, label: "Sandbox", href: "/sandbox" },
        { icon: BookOpen, label: "Tutorial", href: "/tutorial" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    const isStranger = theme === 'stranger';

    return (
        <motion.aside
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="w-16 lg:w-64 h-full border-r flex flex-col pt-4 z-30 transition-all duration-500
            bg-card/80 backdrop-blur-md border-border shadow-2xl"
        >

            <div className="flex items-center justify-center lg:justify-start lg:px-6 mb-8">
                <div className="p-2 rounded-xl mr-0 lg:mr-3 transition-all bg-primary/20">
                    <Zap className="w-6 h-6 text-primary" />
                </div>
                <span className="hidden lg:block font-bold text-xl tracking-tight transition-colors text-foreground font-sans uppercase">
                    ATLAS
                </span>
            </div>

            <nav className="flex-1 px-3 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href}>
                            <div className={`
                            flex items-center px-3 py-3 rounded-lg cursor-pointer group transition-all duration-300
                            ${isActive
                                    ? 'bg-primary/20 text-primary border border-primary/20'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                }
                        `}>
                                <link.icon size={20} className={`
                                ${isActive ? 'animate-pulse text-primary' : ''}
                                ${!isActive ? 'group-hover:text-foreground' : ''}
                            `} />
                                <span className="hidden lg:block ml-3 font-medium text-sm">
                                    {link.label}
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-black/5 dark:border-white/5">
                <div className="p-4 rounded-xl backdrop-blur-md border border-white/10 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/90">
                            <CreditCard size={14} />
                        </div>
                        <div className="hidden lg:block">
                            <p className="text-xs font-medium">Pro Plan</p>
                            <p className="text-[10px] opacity-70">v1.2.0-beta</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
}

function Header({ theme }: { theme: string | undefined }) {
    const isStranger = theme === 'stranger';

    return (
        <motion.header
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="h-16 border-b flex items-center justify-between px-6 z-20 backdrop-blur-md bg-card/60 border-border"
        >
            <div className="flex items-center gap-4">
                {/* Context Badge */}
                <span className="text-xs font-mono text-primary/70 border border-primary/50 px-2 py-1 rounded bg-primary/10">
                    {theme === 'stranger' ? 'SECURITY LEVEL: OMEGA' : 'Atlas Console'}
                </span>
            </div>

            {/* Note: ThemeToggle is positioned absolutely in layout, so we leave space here or wrap it */}
            <ThemeToggle />
            <div className="w-4" />
        </motion.header>
    )
}
