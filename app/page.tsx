import About from "@/components/about";
import AuroraBackground from "@/components/aurora-background";
import GlassNav from "@/components/glass-nav";
import Hero from "@/components/hero";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <GlassNav />
      <main>
        <Hero />
        <About />
      </main>
    </>
  );
}
