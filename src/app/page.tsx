import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import WhyBrujula from "@/components/landing/why-brujula";
import CTASection from "@/components/landing/cta";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <WhyBrujula />
        <HowItWorks />

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
