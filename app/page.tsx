import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-center text-[clamp(2rem,7vw,4.5rem)] font-medium tracking-tight">
        Under Construction
      </h1>
      <a
        href={siteConfig.links.discordInvite}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-[#5865f2] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#4752c4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Join our Discord
      </a>
    </main>
  );
}
