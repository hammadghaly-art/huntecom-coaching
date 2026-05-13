import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
	const base = getSiteUrl();

	return {
		rules: [
			{ userAgent: "*", allow: "/", disallow: [] },
			{ userAgent: "Googlebot", allow: "/", disallow: [] },
		],
		sitemap: `${base}/sitemap.xml`,
	};
}
