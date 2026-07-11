import About from "@/components/about";
import AuroraBackground from "@/components/aurora-background";
import Experience from "@/components/experience";
import FeaturedProject from "@/components/featured-project";
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
      </main>
    </>
  );
}
