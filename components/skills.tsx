import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import TiltCard from "@/components/tilt-card";
import { skills } from "@/lib/content";

export default function Skills() {
  return (
    <section id="skills" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading index="04" label="Skills" title="What I work with" />
        </Reveal>
        <div
          data-game-collectible="skills"
          className="grid gap-5 md:grid-cols-2"
        >
          {skills.map((group, i) => (
            <Reveal key={group.category} delay={(i % 2) * 0.08}>
              <TiltCard className="h-full">
                <div className="glass h-full rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-medium">
                    {group.category}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="border-edge text-muted rounded-full border px-3 py-1 font-mono text-xs"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
