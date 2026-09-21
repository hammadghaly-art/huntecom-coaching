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
	// Calendly / altes Overlay → eigene Erstgespräch-Seite
	s = s.replace(
		/href="https:\/\/calendly\.com\/huntecom\/[^"]+"/gi,
		'href="/apply" target="_top" rel="noopener noreferrer"',
	);
	s = s.replace(
		/href='https:\/\/calendly\.com\/huntecom\/[^']+'/gi,
		"href='/apply' target='_top' rel='noopener noreferrer'",
	);
	s = s.replaceAll('href="/#apply"', 'href="/apply"');
	s = s.replaceAll("href='/#apply'", "href='/apply'");
	s = s.replaceAll('href="#apply"', 'href="/apply"');
	// Story-Copy: frischer `pnpm run mirror` zieht ggf. wieder „24 Mon.“ von Webflow — hier nachziehend patchen
	const quoteFixes = [
		[/Doch nach&nbsp;24&nbsp;Monaten erreichte ich/gi, "Doch bereits nach wenigen Monaten erreichte ich"],
		[/Doch nach\s+24\s+Monaten erreichte ich/gi, "Doch bereits nach wenigen Monaten erreichte ich"],
		[/Doch nach\s+24\s+Monate erreichte ich/gi, "Doch bereits nach wenigen Monaten erreichte ich"],
	];
	for (const [re, to] of quoteFixes) {
		s = s.replace(re, to);
	}
	const headlineFixes = [
		[
			/Mark wurde in nur einem Jahr nach dem Start\s*<br\s*\/?>\s*seiner Marke finanziell unabhängig/gi,
			"Mark wurde bereits wenige Monate nach dem Start <br>seiner Marke finanziell unabhängig",
		],
		[
			/Mark wurde in nur einem Jahr nach dem Start <br>seiner Marke finanziell unabhängig/gi,
			"Mark wurde bereits wenige Monate nach dem Start <br>seiner Marke finanziell unabhängig",
		],
	];
	for (const [re, to] of headlineFixes) {
		s = s.replace(re, to);
	}
	if (s !== before) {
		fs.writeFileSync(p, s, "utf8");
		console.log("patched", f);
	}
}
