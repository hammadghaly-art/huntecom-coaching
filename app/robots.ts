import type { MetadataRoute } from "next";

const base = (
	process.env.NEXT_PUBLIC_APP_URL || "https://www.huntecom.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/api/", "/_next/", "/admin/"],
			},
		],
		sitemap: `${base}/sitemap.xml`,
		host: base,
	};
}
