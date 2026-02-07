"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Database, Globe, Server, Cpu, Activity } from "lucide-react";
import React, { useRef } from "react";

export default function WorkbenchPreview() {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 50 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 50 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xPct = (clientX - left) / width - 0.5;
        const yPct = (clientY - top) / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

    const brightness = useTransform(mouseY, [-0.5, 0.5], [1.2, 0.8]);

    return (
        <section className="py-24 px-4 perspective-1000 overflow-visible z-20 relative">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                        The Workbench
                    </h2>
                    <p className="text-muted-foreground/80 max-w-2xl text-lg">
                        A comprehensive environment for system design. Drag, drop, and connect.
                    </p>
                </div>

                <motion.div
                    ref={ref}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        rotateX,
                        rotateY,
                        transformStyle: "preserve-3d",
                    }}
                    className="relative w-full aspect-[16/9] rounded-xl bg-card border border-white/10 shadow-2xl overflow-hidden group"
                >
                    {/* Reflection / Shine */}
                    <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />

                    {/* Window Chrome */}
                    <div className="absolute top-0 inset-x-0 h-10 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center px-4 gap-2 z-10">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                        <div className="ml-4 px-3 py-1 rounded-md bg-white/5 text-xs text-muted-foreground font-mono">
                            atlas-workbench-v2.tsx
                        </div>
                    </div>

                    {/* Canvas Content */}
                    <div className="absolute inset-0 pt-10 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]">
                        {/* Mock Nodes */}
                        <div className="absolute top-1/4 left-1/4 w-48 p-4 rounded-lg bg-slate-900/80 border border-indigo-500/30 backdrop-blur-sm shadow-xl flex items-center gap-3">
                            <div className="p-2 rounded-md bg-indigo-500/20 text-indigo-400">
                                <Globe size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-indigo-100">API Gateway</div>
                                <div className="text-xs text-indigo-400/60">/api/v1/*.ts</div>
                            </div>
                            {/* Connection Line */}
                            <svg className="absolute left-full top-1/2 w-32 h-20 -translate-y-1/2 pointer-events-none overflow-visible">
                                <path d="M0 0 C 40 0, 40 80, 80 80" fill="none" stroke="currentColor" className="text-white/20" strokeWidth="2" strokeDasharray="4 4" />
                                <circle cx="80" cy="80" r="3" fill="currentColor" className="text-emerald-500 animate-pulse" />
                            </svg>
                        </div>

                        <div className="absolute top-1/2 left-[45%] w-48 p-4 rounded-lg bg-slate-900/80 border border-emerald-500/30 backdrop-blur-sm shadow-xl flex items-center gap-3">
                            <div className="p-2 rounded-md bg-emerald-500/20 text-emerald-400">
                                <Server size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-emerald-100">Load Balancer</div>
                                <div className="text-xs text-emerald-400/60">Round Robin</div>
                            </div>
                            <svg className="absolute left-full top-1/2 w-32 h-20 -translate-y-1/2 pointer-events-none overflow-visible">
                                <path d="M0 0 C 40 0, 40 -60, 80 -60" fill="none" stroke="currentColor" className="text-white/20" strokeWidth="2" strokeDasharray="4 4" />
                            </svg>
                        </div>

                        <div className="absolute top-1/4 right-1/4 w-48 p-4 rounded-lg bg-slate-900/80 border border-rose-500/30 backdrop-blur-sm shadow-xl flex items-center gap-3">
                            <div className="p-2 rounded-md bg-rose-500/20 text-rose-400">
                                <Database size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-rose-100">Primary DB</div>
                                <div className="text-xs text-rose-400/60">Postgres v15</div>
                            </div>
                        </div>

                        <div className="absolute bottom-1/4 right-[30%] w-48 p-4 rounded-lg bg-slate-900/80 border border-amber-500/30 backdrop-blur-sm shadow-xl flex items-center gap-3">
                            <div className="p-2 rounded-md bg-amber-500/20 text-amber-400">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-amber-100">Worker Node</div>
                                <div className="text-xs text-amber-400/60">Standard-2x</div>
                            </div>
                        </div>

                        {/* Metrics Overlay Mock */}
                        <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-black/60 border border-white/5 backdrop-blur-md text-xs font-mono">
                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <Activity size={12} /> System Healthy
                            </div>
                            <div className="text-muted-foreground">req/s: 1.2k | lat: 45ms</div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </section>
    );
}
