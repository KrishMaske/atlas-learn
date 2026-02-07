import FeatureBento from '@/components/landing/FeatureBento';
import Footer from '@/components/landing/Footer';
import Hero from '@/components/landing/Hero';
import WorkbenchPreview from '@/components/landing/WorkbenchPreview';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      <Hero />
      <WorkbenchPreview />
      <FeatureBento />
      <Footer />
    </main>
  );
}

