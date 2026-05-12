"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CoachingFunnel } from "./coaching/funnel";

const APPLY_HASH = "apply";
const APPLY_MSG_TYPE = "huntecom:apply";

type HomeClientProps = {
	calendlyUrl: string;
	leadApiUrl: string;
	metaPixelId: string;
};

export default function HomeClient({ calendlyUrl, leadApiUrl, metaPixelId }: HomeClientProps) {
	const [open, setOpen] = useState(false);
	const [funnelKey, setFunnelKey] = useState("");
	const titleId = useId();
	const iframeRef = useRef<HTMLIFrameElement>(null);

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

	/** Fallback: Iframe-Skript `huntecom-iframe-apply-bridge.js` sendet postMessage, wenn top nicht setzbar ist */
	useEffect(() => {
		const onMsg = (e: MessageEvent) => {
			if (e.origin !== window.location.origin) return;
			const win = iframeRef.current?.contentWindow;
			if (!win || e.source !== win) return;
			const d = e.data;
			if (!d || typeof d !== "object") return;
			if ((d as { t?: string }).t !== APPLY_MSG_TYPE) return;
			if (window.location.hash === `#${APPLY_HASH}`) {
				setFunnelKey(`f-${Date.now()}`);
				setOpen(true);
				return;
			}
			window.location.hash = APPLY_HASH;
		};
		window.addEventListener("message", onMsg);
		return () => window.removeEventListener("message", onMsg);
	}, []);

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
				ref={iframeRef}
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
