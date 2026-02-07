"use client";

import { motion } from "framer-motion";
import { Move, Play, Terminal, Zap } from "lucide-react";
import React, { useState } from "react";

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-500 group ${className}`}>
        {/* Glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(800px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.06),transparent_40%)]" />
        {children}
    </div>
);

export default function FeatureBento() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <section className="py-24 px-4 bg-black/20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                {/* Header */}
                <div className="md:col-span-3 mb-8 text-center md:text-left">
                    <h2 className="text-3xl font-bold mb-4">Everything you need to build scalable systems.</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        From visual design to production code, Atlas handles the complexity so you can focus on architecture.
                    </p>
                </div>

                {/* Card 1: Visual Node Builder (Large) */}
                <Card className="md:col-span-2 md:row-span-2 flex flex-col">
                    <div className="p-8">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                            <Move size={20} />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 text-white">Visual Node Builder</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">Drag-and-drop 20+ specialized node types. Connect services, databases, and queues with intelligent linking.</p>
                    </div>

                    {/* Animation / Graphic */}
                    <div className="flex-1 relative bg-gradient-to-br from-black/20 to-transparent p-6 overflow-hidden">
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 100, top: 0, bottom: 50 }}
                            whileDrag={{ scale: 1.1, boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
                            className="absolute top-10 left-10 w-32 p-3 rounded-lg bg-slate-800 border border-blue-500/30 cursor-grab active:cursor-grabbing z-10"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-mono text-blue-200">Redis Cache</span>
                            </div>
                            <div className="h-1 w-full bg-slate-700 rounded overflow-hidden">
                                <div className="h-full w-[60%] bg-blue-500" />
                            </div>
                        </motion.div>

                        {/* Background Grid Lines as drop targets */}
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-4 opacity-10">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="border border-white/20 rounded-md border-dashed" />
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Card 2: Runtime Simulation */}
                <Card className="flex flex-col">
                    <div className="p-6">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                            <Play size={20} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-white">Runtime Sim</h3>
                        <p className="text-muted-foreground text-xs">Test traffic patterns before deployment.</p>
                    </div>

                    <div className="flex-1 bg-black/40 p-4 font-mono text-xs overflow-hidden">
                        <div className="space-y-2">
                            <div className="flex justify-between text-emerald-400">
                                <span>✓ GET /api/users</span>
                                <span>24ms</span>
                            </div>
                            <div className="flex justify-between text-emerald-400">
                                <span>✓ POST /auth/login</span>
                                <span>112ms</span>
                            </div>
                            <div className="flex justify-between text-amber-400">
                                <span>⚠ DB Connection Pool</span>
                                <span>85%</span>
                            </div>
                            <div className="flex justify-between text-emerald-400">
                                <span>✓ Queue Processor</span>
                                <span>Idle</span>
                            </div>
                            <div className="animate-pulse flex justify-between text-blue-400 mt-4 border-t border-white/10 pt-2">
                                <span>Active Users</span>
                                <span>842</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Card 3: Code Generation */}
                <Card className="flex flex-col">
                    <div className="p-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                            <Terminal size={20} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-white">Production Code</h3>
                        <p className="text-muted-foreground text-xs">Export Docker-ready TypeScript services.</p>
                    </div>

                    <div className="flex-1 bg-slate-950 p-4 font-mono text-[10px] overflow-hidden leading-relaxed text-slate-300">
                        <span className="text-purple-400">import</span> {"{"} Router {"}"} <span className="text-purple-400">from</span> <span className="text-green-400">'express'</span>;<br />
                        <span className="text-purple-400">const</span> app = Router();<br /><br />
                        app.<span className="text-blue-400">post</span>(<span className="text-green-400">'/data'</span>, <span className="text-purple-400">async</span> (req, res) ={`>`} {"{"}<br />
                        &nbsp;&nbsp;<span className="text-slate-500">// Auto-generated logic</span><br />
                        &nbsp;&nbsp;<span className="text-purple-400">await</span> queue.add(req.body);<br />
                        &nbsp;&nbsp;res.json({"{"} ok: <span className="text-orange-400">true</span> {"}"});<br />
                        {"}"});
                    </div>
                </Card>
            </div>
        </section>
    );
}
