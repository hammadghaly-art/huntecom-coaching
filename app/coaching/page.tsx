import type { Metadata } from "next";
import { CoachingFunnel } from "./funnel";

const SEO_TITLE = "Bewirb dich um dein 1:1 Coaching | Huntecom";
const SEO_DESCRIPTION =
	"Persönliches Amazon-FBA-Coaching mit Hammad Ghaly. Beantworte 5 kurze Fragen, damit wir prüfen ob wir zu dir passen — danach buchst du dein Erstgespräch.";

export const metadata: Metadata = {
	title: SEO_TITLE,
	description: SEO_DESCRIPTION,
	alternates: { canonical: "https://www.huntecom.com/coaching" },
	robots: { index: true, follow: true },
	openGraph: {
		title: SEO_TITLE,
		description: SEO_DESCRIPTION,
		type: "website",
		url: "https://www.huntecom.com/coaching",
		locale: "de_DE",
		siteName: "Huntecom",
	},
};

// Calendly URL is read from env so we can swap the booking provider later
// (cal.com, savvycal, …) without redeploying the whole site.
const CALENDLY_URL =
	process.env.NEXT_PUBLIC_CALENDLY_URL ??
	"https://calendly.com/huntecom/coaching-erstgespraech";

const LEAD_API =
	process.env.NEXT_PUBLIC_LEAD_API ?? "https://ai.huntecom.com/api/crm/lead";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export default function CoachingApplyPage() {
	return (
		<CoachingFunnel
			calendlyUrl={CALENDLY_URL}
			leadApiUrl={LEAD_API}
			metaPixelId={META_PIXEL_ID}
		/>
	);
}
