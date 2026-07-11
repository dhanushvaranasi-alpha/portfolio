import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { certifications, education } from "@/lib/content";

export default function EducationCerts() {
  return (
    <section id="education" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            index="05"
            label="Education"
            title="Education and certifications"
          />
        </Reveal>
        <div
          data-game-collectible="education"
          className="grid gap-5 md:grid-cols-2"
        >
          <Reveal>
            <div className="glass h-full rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-medium">Education</h3>
              <ul className="mt-5 space-y-6">
                {education.map((entry) => (
                  <li key={entry.degree}>
                    <p className="font-medium">{entry.degree}</p>
                    <p className="text-muted mt-1 text-sm">
                      {entry.school} | {entry.year}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass h-full rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-medium">
                Certifications
              </h3>
              <ul className="mt-5 space-y-3">
                {certifications.map((cert) => (
                  <li key={cert} className="text-muted flex gap-3 text-sm">
                    <span
                      aria-hidden="true"
                      className="text-accent mt-0.5 font-mono"
                    >
                      /
                    </span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
