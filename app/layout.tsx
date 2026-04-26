import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	metadataBase: new URL("https://www.huntecom.com"),
	title: "Huntecom – Amazon FBA Kurs & Coaching",
	description:
		"Dein Weg zum Amazon FBA Erfolg – Kurs, 1:1 Coaching und deine eigene Marke.",
	openGraph: {
		title: "Huntecom – Amazon FBA Kurs & Coaching",
		description: "Starte mit Amazon FBA: Kurs, Coaching, Erfolgs-Masterplan.",
		type: "website",
		url: "https://www.huntecom.com",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de" className="huntecom-html">
			<body className="huntecom-body">{children}</body>
		</html>
	);
}
