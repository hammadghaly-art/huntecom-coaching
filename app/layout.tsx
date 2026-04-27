import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://www.huntecom.com";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: "Amazon FBA Kurs, Schulung & 1:1 Coaching - Huntecom",
	description:
		"Amazon FBA Kurs, Schulung und 1:1 Coaching mit KI-Tools für deinen Markenaufbau. Vom ersten Produkt zur profitablen Marke – exklusive Begleitung statt Massencoaching.",
	alternates: {
		canonical: siteUrl,
	},
	icons: {
		icon: [{ url: "/brand/huntecom-favicon.png", type: "image/png", sizes: "any" }],
		apple: "/brand/huntecom-favicon.png",
	},
	openGraph: {
		title: "Amazon FBA Kurs, Schulung & 1:1 Coaching - Huntecom",
		description:
			"Amazon FBA Kurs, Schulung und 1:1 Coaching für deinen Markenaufbau. Vom ersten Produkt zur profitablen Marke – exklusive Begleitung statt Massencoaching.",
		type: "website",
		url: siteUrl,
		locale: "de_DE",
		images: [
			{
				url: "/brand/huntecom-og.png",
				width: 1200,
				height: 630,
				alt: "Huntecom – Amazon FBA Coaching und Erfolgs-Masterplan",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Amazon FBA Kurs, Schulung & 1:1 Coaching - Huntecom",
		description:
			"Amazon FBA Kurs, Schulung und 1:1 Coaching für deinen Markenaufbau. Vom ersten Produkt zur profitablen Marke – exklusive Begleitung statt Massencoaching.",
		images: ["/brand/huntecom-og.png"],
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de" className="huntecom-html">
			<body className="huntecom-body">{children}</body>
		</html>
	);
}
