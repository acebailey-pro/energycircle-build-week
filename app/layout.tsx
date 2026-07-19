import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EnergyCircle | Interactive Property Energy Model",
  description:
    "Explore how property geometry, water routing, hydraulic losses, storage, and critical loads shape one connected energy system.",
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
        url: "/energycircle-social.png",
        width: 1774,
        height: 887,
        alt: "An illustrated hillside energy system connecting water storage, solar generation, a turbine, and a home.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EnergyCircle",
    description: "Property energy systems, made legible.",
    images: ["/energycircle-social.png"],
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
