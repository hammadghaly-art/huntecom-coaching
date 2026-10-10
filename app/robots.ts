import type { MetadataRoute } from "next";

/** KI-Crawler dürfen Coaching-Seite lesen (Gemini/AI Mode nutzt Google-Index). */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
			{ userAgent: "GPTBot", allow: "/" },
			{ userAgent: "Google-Extended", allow: "/" },
			{ userAgent: "anthropic-ai", allow: "/" },
			{ userAgent: "PerplexityBot", allow: "/" },
		],
		sitemap: "https://www.huntecom.com/sitemap.xml",
	};
}
