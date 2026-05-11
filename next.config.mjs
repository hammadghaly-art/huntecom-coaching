import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Hero-Video: `public/videos/huntecom-coaching-hero.mp4` ist oft zu groß für Git.
 * Auf Vercel: `COACHING_HERO_VIDEO_URL` auf eine volle https-URL setzen (CDN, Blob, GCS …).
 * Rewrite läuft beforeFiles → greift auch wenn die lokale Datei im Deploy fehlt.
 */
function coachingHeroVideoRewrites() {
	const destination = process.env.COACHING_HERO_VIDEO_URL?.trim();
	if (!destination || !/^https?:\/\//i.test(destination)) {
		return [];
	}
	return [
		{
			source: "/videos/huntecom-coaching-hero.mp4",
			destination,
		},
	];
}

/** @type {import("next").NextConfig} */
const nextConfig = {
	// Mehrere Lockfiles im Elternordner (pnpm-workspace): Next würde sonst
	// C:\Dev\chatai-main als Root nehmen und lokale node_modules ignorieren.
	outputFileTracingRoot: __dirname,
	turbopack: {
		root: __dirname,
	},
	webpack: (config) => {
		config.resolve.modules = [
			path.join(__dirname, "node_modules"),
			...(config.resolve.modules ?? []),
		];
		return config;
	},
	async rewrites() {
		const beforeFiles = coachingHeroVideoRewrites();
		if (beforeFiles.length === 0) {
			return [];
		}
		return { beforeFiles };
	},
};

export default nextConfig;
