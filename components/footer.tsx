import Magnetic from "@/components/magnetic";
import Reveal from "@/components/reveal";
import { currentFocus, site } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="glass rounded-3xl p-8 md:p-12">
            <p className="text-muted max-w-3xl leading-relaxed">
              {currentFocus}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
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
        </Reveal>
        <p className="text-muted mt-10 text-center font-mono text-xs">
          {site.name} | {site.location}
        </p>
      </div>
    </footer>
  );
}
