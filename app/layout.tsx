import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: { url: siteConfig.image, type: "image/png" },
    apple: siteConfig.image,
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    locale: "en_US",
    images: [{ url: siteConfig.image, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.image],
  },
};

const imageUrl = new URL(siteConfig.image, siteConfig.url).href;

/**
 * Discord component embed (Components V2), unfurled when the site URL is
 * pasted in Discord. Types: 17 container, 9 section, 10 text display,
 * 11 thumbnail, 14 separator, 1 action row, 2 button (style 5 = link).
 */
const discordEmbed = {
  component: {
    type: 17,
    accent_color: parseInt(siteConfig.accentColor.slice(1), 16),
    spoiler: false,
    components: [
      {
        type: 9,
        components: [
          {
            type: 10,
            content: `# ${siteConfig.name}\n${siteConfig.description}`,
          },
        ],
        accessory: {
          type: 11,
          media: { url: imageUrl },
          description: `${siteConfig.name} logo`,
          spoiler: false,
        },
      },
      { type: 14, divider: true, spacing: 1 },
      {
        type: 10,
        content: [
          "## About",
          "A peaceful, beginner-friendly survival SMP with a welcoming community.",
          "- Economy, shop & auction house",
          "- Homes, warps, TPA & RTP",
          "- Java 26.1 – 26.3 · Hosted in Germany",
        ].join("\n"),
      },
      { type: 14, divider: true, spacing: 1 },
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: siteConfig.serverIp,
            url: siteConfig.url,
            disabled: true,
          },
          {
            type: 2,
            style: 5,
            label: "Website",
            url: siteConfig.url,
          },
          {
            type: 2,
            style: 5,
            label: "Discord",
            url: siteConfig.links.discordInvite,
          },
        ],
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link
          rel="discord:component-embed"
          type="application/json"
          href={siteConfig.url}
        />
        <script
          id="discord:component-embed"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(discordEmbed).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
