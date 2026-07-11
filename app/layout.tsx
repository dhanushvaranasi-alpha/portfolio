import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SmoothScrolling from "@/components/smooth-scrolling";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dhanush Varanasi | Forward Deployed Engineer",
  description:
    "Senior backend engineer who takes production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains, now building applied AI and moving toward forward deployed engineering.",
  openGraph: {
    title: "Dhanush Varanasi | Forward Deployed Engineer",
    description:
      "Senior backend engineer building production-grade systems and applied AI in regulated domains.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base font-body text-ink antialiased">
        <SmoothScrolling>{children}</SmoothScrolling>
      </body>
    </html>
  );
}
