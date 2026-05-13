/**
 * Canonical origin for www.huntecom.com (sitemap, robots, crawlable intro links).
 */
export function getSiteUrl(): string {
	const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.huntecom.com";
	return raw.replace(/\/+$/, "");
}
