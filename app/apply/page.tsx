import type { Metadata } from "next";
import { CoachingFunnel } from "../coaching/funnel";
import {
	coachingCalendlyUrl,
	coachingLeadApiUrl,
	coachingMetaPixelId,
} from "@/lib/coaching-env";

const SEO_TITLE = "Erstgespräch anfragen | Huntecom";
const SEO_DESCRIPTION =
	"Amazon-FBA-Coaching: ein paar Fragen zu deiner Situation, dann Kontaktdaten — danach buchst du dein Erstgespräch im Kalender.";

export const metadata: Metadata = {
	title: "Erstgespräch anfragen",
	description: SEO_DESCRIPTION,
	alternates: { canonical: "https://www.huntecom.com/apply" },
	robots: { index: true, follow: true },
	openGraph: {
		title: SEO_TITLE,
		description: SEO_DESCRIPTION,
		type: "website",
		url: "https://www.huntecom.com/apply",
		locale: "de_DE",
		siteName: "Huntecom",
	},
};

export default function ApplyPage() {
	return (
		<CoachingFunnel
			calendlyUrl={coachingCalendlyUrl()}
			leadApiUrl={coachingLeadApiUrl()}
			metaPixelId={coachingMetaPixelId()}
		/>
	);
}
