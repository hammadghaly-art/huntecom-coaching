"use client";

import { useEffect } from "react";

/**
 * Webflow-Homepage im Iframe. Buttons zeigen auf `/apply` (eigene Formularseite).
 * Alte Links mit `#apply` leiten dorthin um — kein Overlay mehr hinter dem Cookie-Banner.
 */
export default function HomeClient() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.location.hash !== "#apply") return;
		const { search } = window.location;
		window.location.replace(`/apply${search}`);
	}, []);

	return (
		<div className="huntecom-iframe-root">
			<iframe
				className="huntecom-iframe"
				src="/huntecom-wf/index.html"
				title="Huntecom – Amazon FBA Kurs & Coaching"
			/>
		</div>
	);
}
