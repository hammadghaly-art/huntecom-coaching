import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
	const base = getSiteUrl();
	const lastMod = new Date();

	return [
		{
			url: base,
			lastModified: lastMod,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${base}/coaching`,
			lastModified: lastMod,
			changeFrequency: "weekly",
			priority: 0.95,
		},
	];
}
