import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Sichtbarer, crawlbarer Kontext unter dem Webflow-Iframe (Parent-URL ist sonst praktisch leer).
 * Keine versteckten Texte — nur Navigation + kurze inhaltliche Einordnung.
 */
export function HomeSeoSection() {
	const site = getSiteUrl();

	return (
		<section
			aria-labelledby="huntecom-home-seo-heading"
			className="huntecom-home-seo"
			lang="de"
		>
			<div className="huntecom-home-seo__inner">
				<h2 id="huntecom-home-seo-heading" className="huntecom-home-seo__title">
					Huntecom — Amazon FBA Coaching, Kurs &amp; KI-Tools
				</h2>
				<p className="huntecom-home-seo__p">
					Persönliches 1:1 Amazon-FBA-Coaching und Schulungen für Private Label — von der
					Produktidee bis zur Marke. Oben siehst du die Webflow-Oberfläche; hier die direkten
					Einstiege zu Coaching, Kurs, KI-Plattform, Community und Profil.
				</p>
				<ul className="huntecom-home-seo__list">
					<li>
						<Link href="/coaching">Coaching-Anfrage (Bewerbung &amp; Erstgespräch)</Link>
					</li>
					<li>
						<a href="https://amz.huntecom.com" rel="noopener noreferrer">
							AMZ Huntecom — Amazon-FBA-Masterclass (Kurs)
						</a>
					</li>
					<li>
						<a href="https://ai.huntecom.com/blog/de" rel="noopener noreferrer">
							AI Huntecom — Blog &amp; Workflows (Amazon FBA, FBM, Wholesale, Shopify)
						</a>
					</li>
					<li>
						<a href="https://ai.huntecom.com/community" rel="noopener noreferrer">
							Community — Austausch zu Amazon FBA &amp; E-Commerce
						</a>
					</li>
					<li>
						<a href="https://hammadghaly.huntecom.com" rel="noopener noreferrer">
							Hammad Ghaly — Profil &amp; Presse
						</a>
					</li>
				</ul>
				<p className="huntecom-home-seo__p huntecom-home-seo__p--muted">
					Startseite: <a href={site}>{site}</a>
				</p>
			</div>
		</section>
	);
}
