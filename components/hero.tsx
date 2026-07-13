"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Magnetic from "@/components/magnetic";
import { site } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-item]", {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.12,
        });
        gsap.to("[data-hero-inner]", {
          scale: 0.94,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-svh items-center px-6"
    >
      <div data-hero-inner className="mx-auto w-full max-w-5xl">
        <p
          data-hero-item
          className="text-accent font-mono text-sm tracking-[0.25em] uppercase"
        >
          {site.location}
        </p>
        <h1
          data-hero-item
          className="font-heading mt-6 text-6xl font-medium tracking-tight md:text-8xl"
        >
          {site.name}
        </h1>
        <p
          data-hero-item
          className="text-muted mt-6 font-mono text-sm md:text-base"
        >
          {site.title}
        </p>
        <p data-hero-item className="text-muted mt-8 max-w-2xl text-lg">
          {site.heroLine}
        </p>
        <div data-hero-item className="mt-10 flex flex-wrap gap-4">
          {site.links.map((link) => (
            <Magnetic key={link.label}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="glass hover:text-accent inline-block rounded-full px-5 py-2.5 text-sm transition-colors"
              >
                {link.label}
              </a>
            </Magnetic>
          ))}
        </div>
      </div>
    </section>
  );
}
