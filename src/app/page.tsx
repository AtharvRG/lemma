import { Footer } from "@/components/layout/Footer";
import { PreviewStrip } from "@/components/sections/PreviewStrip";
import { BenefitRow } from "@/components/sections/FeatureRow";
import { HeroSection } from "@/components/sections/HeroSection";
import Balatro from "@/components/landing/Balatro";

export default function HomePage() {
  return (
    <>
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <Balatro
          isRotate={false}
          mouseInteraction={true}
          pixelFilter={700}
        />
      </div>
      {/* Global tint overlay for text readability */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-[5] bg-black/10"></div>
      
      {/* The main container for the landing page content */}
      <div className="w-full flex flex-col items-center relative z-10">
        {/* Add vertical padding and increase gap for better section separation */}
        <main className="flex min-h-screen w-full max-w-7xl flex-col items-center gap-28 md:gap-40 px-4 py-24 md:py-32">
          <HeroSection />
          <PreviewStrip />
          <BenefitRow />
        </main>
        <Footer />
      </div>
    </>
  );
}