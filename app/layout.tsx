import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://energycircle-build-week.ace0048.chatgpt.site"),
  title: "EnergyCircle | Interactive Property Energy Model",
  description:
    "Explore governed property-scale solar, battery, water, gravity storage, and critical-load tradeoffs in one interactive planning environment.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "EnergyCircle",
    description: "Property energy systems, made legible.",
    siteName: "EnergyCircle",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "An illustrated hillside energy system connecting water storage, solar generation, a turbine, and a home.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EnergyCircle",
    description: "Property energy systems, made legible.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
