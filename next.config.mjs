import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
	// Mehrere Lockfiles im Elternordner (pnpm-workspace): Next würde sonst
	// C:\Dev\chatai-main als Root nehmen und lokale node_modules ignorieren.
	outputFileTracingRoot: __dirname,
	turbopack: {
		root: __dirname,
	},
	webpack: (config) => {
		config.resolve.modules = [
			path.join(__dirname, "node_modules"),
			...(config.resolve.modules ?? []),
		];
		return config;
	},
};

export default nextConfig;
