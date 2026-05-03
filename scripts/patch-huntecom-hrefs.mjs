import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../public/huntecom-wf");

if (!fs.existsSync(dir)) {
	console.warn("patch-huntecom-hrefs: missing", dir, "(run pnpm run mirror first)");
	process.exit(0);
}

const htmlFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));

for (const f of htmlFiles) {
	const p = path.join(dir, f);
	let s = fs.readFileSync(p, "utf8");
	const before = s;
	// Kanon: Startseite lokal
	s = s.replaceAll('href="https://www.huntecom.com/"', 'href="index.html"');
	s = s.replaceAll("href='https://www.huntecom.com/'", "href='index.html'");
	s = s.replaceAll('href="https://huntecom.com/"', 'href="index.html"');
	// Häufig: Webflow-Staging, falls in Links vorkommt
	s = s.replaceAll('href="https://huntecom.webflow.io/"', 'href="index.html"');
	// Calendly → gleiche Seite, Hash öffnet Coaching-Funnel-Overlay (Next home-client)
	s = s.replace(
		/href="https:\/\/calendly\.com\/huntecom\/[^"]+"/gi,
		'href="/#apply" target="_top" rel="noopener noreferrer"',
	);
	s = s.replace(
		/href='https:\/\/calendly\.com\/huntecom\/[^']+'/gi,
		"href='/#apply' target='_top' rel='noopener noreferrer'",
	);
	if (s !== before) {
		fs.writeFileSync(p, s, "utf8");
		console.log("patched", f);
	}
}
