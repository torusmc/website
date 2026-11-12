/**
 * Central site configuration.
 *
 * Shared by metadata today; future integrations (Discord widget/invite,
 * X, YouTube, TikTok, …) should read their IDs and URLs from `links`
 * instead of hard-coding them in components.
 */
export const siteConfig = {
  name: "TorusMC",
  title: "TorusMC Under Construction",
  description: "The official TorusMC website is currently under construction.",
  url: "https://torusmc.com",
  /** Minecraft server address shown to players. */
  serverIp: "torusmc.net",
  /** Social / link-preview image, served from `public/torusmc.png`. */
  image: "/torusmc.png",
  /** Accent colour of the Discord component embed. */
  accentColor: "#5865f2",
  links: {
    discordInvite: "https://dc.torusmc.com/",
  } satisfies SocialLinks,
} as const;

export type SocialLinks = Partial<{
  discordInvite: string;
  discordServerId: string;
  x: string;
  youtube: string;
  tiktok: string;
}>;
