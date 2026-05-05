"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { CoachingFunnel } from "./coaching/funnel";

const APPLY_HASH = "apply";

type HomeClientProps = {
	calendlyUrl: string;
	leadApiUrl: string;
	metaPixelId: string;
};

export default function HomeClient({ calendlyUrl, leadApiUrl, metaPixelId }: HomeClientProps) {
	const [open, setOpen] = useState(false);
	const [funnelKey, setFunnelKey] = useState("");
	const titleId = useId();

	const applyFromLocation = useCallback(() => {
		if (typeof window === "undefined") return;
		const should = window.location.hash === `#${APPLY_HASH}`;
		if (should) {
			setFunnelKey(`f-${Date.now()}`);
		}
		setOpen(should);
	}, []);

	useEffect(() => {
		applyFromLocation();
		window.addEventListener("hashchange", applyFromLocation);
		return () => window.removeEventListener("hashchange", applyFromLocation);
	}, [applyFromLocation]);

	const closeFunnel = useCallback(() => {
		setOpen(false);
		if (typeof window !== "undefined" && window.location.hash === `#${APPLY_HASH}`) {
			const { pathname, search } = window.location;
			window.history.replaceState(null, "", `${pathname}${search}`);
		}
	}, []);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeFunnel();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, closeFunnel]);

	return (
		<div className="huntecom-iframe-root">
			<iframe
				className="huntecom-iframe"
				src="/huntecom-wf/index.html"
				title="Huntecom – Amazon FBA Kurs & Coaching"
			/>
			{open ? (
				<div
					className="huntecom-funnel-overlay"
					role="dialog"
					aria-modal="true"
					aria-labelledby={titleId}
				>
					<button
						type="button"
						className="huntecom-funnel-overlay__close"
						onClick={closeFunnel}
						aria-label="Formular schließen"
					>
						<X aria-hidden />
					</button>
					<div className="huntecom-funnel-overlay__scroll">
						<span id={titleId} className="huntecom-funnel-sr-only">
							Coaching-Anfrage
						</span>
						<CoachingFunnel
							key={funnelKey}
							calendlyUrl={calendlyUrl}
							leadApiUrl={leadApiUrl}
							metaPixelId={metaPixelId}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
