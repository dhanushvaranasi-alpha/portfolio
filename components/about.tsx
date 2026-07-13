import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { about } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading index="01" label="About" title="What I do" />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-muted max-w-3xl text-lg leading-relaxed">
            {about}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
