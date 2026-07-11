import AuroraBackground from "@/components/aurora-background";
import About from "@/components/about";
import EducationCerts from "@/components/education-certs";
import Experience from "@/components/experience";
import FeaturedProject from "@/components/featured-project";
import Footer from "@/components/footer";
import GlassNav from "@/components/glass-nav";
import Hero from "@/components/hero";
import Skills from "@/components/skills";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <GlassNav />
      <main>
        <Hero />
        <About />
        <FeaturedProject />
        <Experience />
        <Skills />
        <EducationCerts />
      </main>
      <Footer />
    </>
  );
}
