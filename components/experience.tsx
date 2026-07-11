"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import TiltCard from "@/components/tilt-card";
import { experience } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Experience() {
  const listRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(lineRef.current, {
          scaleY: 0,
          transformOrigin: "top",
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 70%",
            end: "bottom 60%",
            scrub: true,
          },
        });
      });
    },
    { scope: listRef },
  );

  return (
    <section id="experience" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            index="03"
            label="Experience"
            title="Where I have worked"
          />
        </Reveal>
        <div className="relative">
          <div
            ref={lineRef}
            aria-hidden="true"
            className="from-accent/70 via-accent/30 absolute top-0 bottom-0 left-[7px] w-px bg-gradient-to-b to-transparent"
          />
          <ol
            ref={listRef}
            data-game-collectible="experience"
            className="space-y-10"
          >
            {experience.map((role) => (
              <li
                key={`${role.company}-${role.dates}`}
                className="relative pl-10"
              >
                <span
                  aria-hidden="true"
                  className="border-accent/60 bg-base absolute top-2 left-0 h-[15px] w-[15px] rounded-full border"
                />
                <Reveal>
                  <TiltCard>
                    <article className="glass rounded-2xl p-6 md:p-8">
                      <header className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h3 className="font-heading text-xl font-medium">
                            {role.title}
                          </h3>
                          <p className="text-muted mt-1">{role.company}</p>
                        </div>
                        <p className="text-muted font-mono text-xs">
                          {role.dates} | {role.location}
                        </p>
                      </header>
                      <ul className="mt-5 space-y-3">
                        {role.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="text-muted flex gap-3 text-sm"
                          >
                            <span
                              aria-hidden="true"
                              className="text-accent mt-0.5 font-mono"
                            >
                              /
                            </span>
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </TiltCard>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
