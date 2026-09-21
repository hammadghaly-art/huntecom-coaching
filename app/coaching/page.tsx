import type { Metadata } from "next";
import { CoachingFunnel } from "./funnel";
import {
	coachingCalendlyUrl,
	coachingLeadApiUrl,
	coachingMetaPixelId,
} from "@/lib/coaching-env";

const SEO_TITLE = "Bewirb dich um dein 1:1 Coaching | Huntecom";
const SEO_DESCRIPTION =
	"Amazon-FBA-Coaching: zuerst ein paar Fragen zu deiner Situation, dann deine Kontaktdaten — im Anschluss buchst du dein Erstgespräch im Kalender.";

export const metadata: Metadata = {
	title: SEO_TITLE,
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

export default function CoachingApplyPage() {
	return (
		<CoachingFunnel
			calendlyUrl={coachingCalendlyUrl()}
			leadApiUrl={coachingLeadApiUrl()}
			metaPixelId={coachingMetaPixelId()}
		/>
	);
}
