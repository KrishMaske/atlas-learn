import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative bg-background pt-24 pb-12 px-4 overflow-hidden">
            {/* Gradient Top Border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start gap-4">
                    <span className="text-xl font-bold tracking-tighter text-white">Atlas</span>
                    <p className="text-muted-foreground text-sm">
                        © 2026 Atlas Labs Inc.
                    </p>
                </div>

                <div className="flex items-center gap-8 text-sm text-muted-foreground">
                    <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
                    <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
                    <Link href="#" className="hover:text-white transition-colors">Blog</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="#" className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white">
                        <Twitter size={20} />
                    </Link>
                    <Link href="#" className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white">
                        <Github size={20} />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
