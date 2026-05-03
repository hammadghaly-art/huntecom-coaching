import "./funnel.css";

// Local layout override — globals.css locks the body to 100dvh / overflow:hidden
// so the iframe-mirrored homepage stays pixel-perfect. The coaching funnel
// needs a normal scrolling document, so we patch the body styles here.
export default function CoachingLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* eslint-disable-next-line @next/next/no-css-tags */}
			<style>{`
				body.huntecom-body { overflow: auto !important; height: auto !important; min-height: 100dvh !important; background: #0a0a0a !important; }
				html.huntecom-html { height: auto !important; }
			`}</style>
			{children}
		</>
	);
}
