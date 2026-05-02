import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = "https://www.huntecom.com";

const SEO_TITLE = "Amazon FBA Kurs, Schulung & 1:1 Coaching | Huntecom";
const SEO_DESCRIPTION =
	"Amazon FBA Kurs, Schulung und 1:1 Coaching mit KI-Tools für deinen Markenaufbau. Vom ersten Produkt zur profitablen Marke – exklusive Begleitung statt Massencoaching.";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: { default: SEO_TITLE, template: "%s | Huntecom" },
	description: SEO_DESCRIPTION,
	applicationName: "Huntecom",
	authors: [{ name: "Hammad Ghaly", url: siteUrl }],
	creator: "Huntecom",
	publisher: "Huntecom",
	keywords: [
		"Amazon FBA Coaching",
		"Amazon FBA Kurs",
		"Amazon FBA Schulung",
		"1:1 Coaching Amazon",
		"Amazon Markenaufbau",
		"Private Label Amazon Coaching",
		"Amazon Verkäufer Mentoring",
		"Amazon FBA Deutsch",
		"KI Tools Amazon",
		"Amazon Beratung",
		"Huntecom",
	],
	category: "Education",
	alternates: {
		canonical: siteUrl,
		languages: { de: siteUrl, "x-default": siteUrl },
	},
	icons: {
		icon: [{ url: "/brand/huntecom-favicon.png", type: "image/png", sizes: "any" }],
		apple: "/brand/huntecom-favicon.png",
	},
	manifest: "/site.webmanifest",
	openGraph: {
		title: SEO_TITLE,
		description: SEO_DESCRIPTION,
		type: "website",
		url: siteUrl,
		locale: "de_DE",
		siteName: "Huntecom",
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
		title: SEO_TITLE,
		description: SEO_DESCRIPTION,
		images: ["/brand/huntecom-og.png"],
		creator: "@huntecom",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
	formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#000000" },
	],
};

const organizationSchema = {
	"@context": "https://schema.org",
	"@type": "EducationalOrganization",
	name: "Huntecom",
	url: siteUrl,
	logo: `${siteUrl}/brand/huntecom-favicon.png`,
	image: `${siteUrl}/brand/huntecom-og.png`,
	description: SEO_DESCRIPTION,
	founder: { "@type": "Person", name: "Hammad Ghaly" },
	sameAs: ["https://amz.huntecom.com", "https://ai.huntecom.com"],
};

const serviceSchema = {
	"@context": "https://schema.org",
	"@type": "Service",
	name: "Amazon FBA 1:1 Coaching",
	provider: { "@type": "Organization", name: "Huntecom", url: siteUrl },
	areaServed: { "@type": "Country", name: "DE" },
	serviceType: "Business Coaching",
	description:
		"Persönliches 1:1 Coaching und Schulungen für angehende und etablierte Amazon FBA Verkäufer. Von der Produktidee bis zur skalierten Marke.",
	offers: { "@type": "Offer", availability: "https://schema.org/InStock", url: siteUrl },
};

const breadcrumbSchema = {
	"@context": "https://schema.org",
	"@type": "BreadcrumbList",
	itemListElement: [
		{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
		{ "@type": "ListItem", position: 2, name: "Amazon FBA Kurs", item: "https://amz.huntecom.com" },
		{ "@type": "ListItem", position: 3, name: "AI Tools", item: "https://ai.huntecom.com" },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de" className="huntecom-html">
			<body className="huntecom-body">
				{children}
				<Script
					id="schema-organization"
					type="application/ld+json"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD
					dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
				/>
				<Script
					id="schema-service"
					type="application/ld+json"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD
					dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
				/>
				<Script
					id="schema-breadcrumb"
					type="application/ld+json"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD
					dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
				/>
			</body>
		</html>
	);
}
