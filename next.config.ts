import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
				],
			},
		];
	},
	async rewrites() {
		return [
			{ source: "/impressum", destination: "/huntecom-wf/impressum.html" },
			{ source: "/datenschutz", destination: "/huntecom-wf/datenschutz.html" },
			{ source: "/agb", destination: "/huntecom-wf/agb.html" },
			{ source: "/vision", destination: "/huntecom-wf/vision.html" },
		];
	},
};

export default nextConfig;
