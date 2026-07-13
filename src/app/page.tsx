import { Navbar } from "@/features/marketing/components/Navbar";
import { Hero } from "@/features/marketing/components/Hero";
import { Trust } from "@/features/marketing/components/Trust";
import { Features } from "@/features/marketing/components/Features";
import { HowItWorks } from "@/features/marketing/components/HowItWorks";
import { InteractiveDemo } from "@/features/marketing/components/InteractiveDemo";
import { WhyVeldra } from "@/features/marketing/components/WhyVeldra";
import { Security } from "@/features/marketing/components/Security";
import { FAQ } from "@/features/marketing/components/FAQ";
import { CTA } from "@/features/marketing/components/CTA";
import { Footer } from "@/features/marketing/components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center">
        <Hero />
        <Trust />
        <Features />
        <HowItWorks />
        <InteractiveDemo />
        <WhyVeldra />
        <Security />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
