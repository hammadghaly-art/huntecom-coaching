export default function ApplyLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<style>{`
				body.huntecom-body { overflow: auto !important; height: auto !important; min-height: 100dvh !important; background: #0a0a0a !important; }
				html.huntecom-html { height: auto !important; }
			`}</style>
			{children}
		</>
	);
}
