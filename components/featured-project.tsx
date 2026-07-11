"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { project } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function FeaturedProject() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: pinRef.current,
              start: "top top",
              end: "+=1800",
              pin: true,
              scrub: 0.6,
            },
          });
          tl.from("[data-tracer-heading]", { y: 60, opacity: 0 })
            .from("[data-tracer-what]", { y: 60, opacity: 0 })
            .from("[data-tracer-stat]", {
              y: 80,
              opacity: 0,
              stagger: 0.35,
            });
        },
      );
    },
    { scope: sectionRef },
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }

  return (
    <section ref={sectionRef} id="project" className="px-6">
      <div ref={pinRef} className="flex min-h-svh items-center py-16">
        <div
          onMouseMove={onMouseMove}
          className="glass glow-panel mx-auto w-full max-w-5xl rounded-3xl p-8 md:p-14"
        >
          <div data-tracer-heading>
            <SectionHeading
              index="02"
              label="Featured Project"
              title={project.title}
            />
            <p className="text-muted -mt-6 mb-8">{project.subtitle}</p>
            <ul
              className="mb-10 flex flex-wrap gap-2"
              aria-label="Technologies"
            >
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="border-edge text-muted rounded-full border px-3 py-1 font-mono text-xs"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
          <p
            data-tracer-what
            data-game-collectible="project"
            className="max-w-3xl text-lg leading-relaxed"
          >
            {project.what}
          </p>
          <div
            data-game-collectible="project"
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {project.stats.map((stat) => (
              <div
                key={stat.label}
                data-tracer-stat
                className="border-edge bg-base/40 rounded-2xl border p-5"
              >
                <p className="text-accent font-mono text-2xl">{stat.value}</p>
                <p className="mt-2 text-sm font-medium">{stat.label}</p>
                <p className="text-muted mt-2 text-xs leading-relaxed">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl pt-8 pb-28 md:pb-40">
        <Reveal>
          <h3 className="font-heading text-2xl font-medium">
            Design intent, not demo claims
          </h3>
          <ul className="mt-6 max-w-3xl space-y-4">
            {project.designPoints.map((point) => (
              <li key={point} className="text-muted flex gap-3">
                <span aria-hidden="true" className="text-accent mt-1 font-mono">
                  /
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-muted mt-10 max-w-3xl leading-relaxed">
            {project.why}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
