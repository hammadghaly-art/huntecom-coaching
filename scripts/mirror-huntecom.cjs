/**
 * Statischer Spiegel von https://www.huntecom.com/ → public/huntecom-wf
 * Nur Host www/huntecom.com (kein Crawl externer Seiten)
 *
 * pnpm run mirror
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const scrape = require("website-scraper");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "huntecom-wf");
const startUrl = "https://www.huntecom.com/";

if (fs.existsSync(outDir)) {
	fs.rmSync(outDir, { recursive: true, force: true });
}

function onlyHuntecomHost(u) {
	try {
		const h = new URL(u).hostname;
		return h === "www.huntecom.com" || h === "huntecom.com";
	} catch {
		return false;
	}
}

scrape({
	urls: [startUrl],
	directory: outDir,
	recursive: true,
	maxDepth: 4,
	urlFilter: onlyHuntecomHost,
	request: {
		headers: {
			"user-agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		},
	},
})
	.then(() => {
		console.log("mirror done →", outDir);
		try {
			execFileSync(process.execPath, [path.join(root, "scripts", "patch-huntecom-hrefs.mjs")], {
				cwd: root,
				stdio: "inherit",
			});
		} catch (e) {
			console.warn("patch-huntecom-hrefs:", (e && e.message) || e);
		}
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
