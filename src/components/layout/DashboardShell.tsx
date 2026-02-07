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
    BookOpen,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StrangerThingsOverlay } from "@/components/ui/StrangerThingsOverlay";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden transition-all duration-700">
            <Sidebar theme={theme} isCollapsed={isCollapsed}  toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
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

function Sidebar({ theme, isCollapsed, toggleSidebar }: { theme: string | undefined, isCollapsed: boolean, toggleSidebar: () => void }) {
    const pathname = usePathname();

    const links = [
        { icon: Grid, label: "Sandbox", href: "/sandbox" },
        { icon: BookOpen, label: "Tutorial", href: "/tutorial" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    const isStranger = theme === 'stranger';

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            className="h-full border-r flex flex-col pt-4 z-30 transition-all duration-500
            bg-card/80 backdrop-blur-md border-border shadow-2xl relative"
        >
            {/* Toggle Button */}
            <button 
                onClick={toggleSidebar}
                className="absolute -right-3 top-8 bg-background border border-border rounded-full p-1 shadow-md hover:bg-accent transition-colors z-50 text-foreground"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} mb-8 transition-all`}>
                <div className="p-2 rounded-xl transition-all bg-primary/20 shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                </div>
                {!isCollapsed && (
                    <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 font-bold text-xl tracking-normal transition-colors text-primary font-sans uppercase pr-1 truncate"
                    >
                        ATLAS
                    </motion.span>
                )}
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
                            ${isCollapsed ? 'justify-center' : ''}
                        `}>
                                <link.icon size={20} className={`
                                shrink-0
                                ${isActive ? 'animate-pulse text-primary' : ''}
                                ${!isActive ? 'group-hover:text-foreground' : ''}
                            `} />
                                {!isCollapsed && (
                                    <motion.span 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="ml-3 font-medium text-sm truncate"
                                    >
                                        {link.label}
                                    </motion.span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-black/5 dark:border-white/5">
                <div className={`p-4 rounded-xl backdrop-blur-md border border-white/10 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground ${isCollapsed ? 'flex justify-center p-2' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/90 shrink-0">
                            <CreditCard size={14} />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="text-xs font-medium truncate">Pro Plan</p>
                                <p className="text-[10px] opacity-70 truncate">v1.2.0-beta • Live</p>
                            </div>
                        )}
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

            <div className="w-4" />
        </motion.header>
    )
}
