import type { MetadataRoute } from "next";

const base = (
	process.env.NEXT_PUBLIC_APP_URL || "https://www.huntecom.com"
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();
	return [
		{ url: base, lastModified, changeFrequency: "weekly", priority: 1.0 },
	];
}
