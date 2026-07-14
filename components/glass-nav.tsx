"use client";

import { useEffect, useState } from "react";
import { navItems } from "@/lib/content";

export default function GlassNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio < 0.4),
      { threshold: [0.4] },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? "opacity-100"
          : "pointer-events-none opacity-0 motion-safe:-translate-y-3"
      }`}
    >
      <ul className="glass flex max-w-[calc(100vw-1.5rem)] [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-full px-1.5 py-1.5 sm:gap-1 sm:px-2 sm:py-2 [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`rounded-full px-2.5 py-1 text-xs whitespace-nowrap transition-colors sm:px-4 sm:py-1.5 sm:text-sm ${
                active === item.id
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
