import HomeClient from "./home-client";

const CALENDLY_URL =
	process.env.NEXT_PUBLIC_CALENDLY_URL ??
	"https://calendly.com/huntecom/coaching-erstgespraech";

const LEAD_API =
	process.env.NEXT_PUBLIC_LEAD_API ?? "https://ai.huntecom.com/api/crm/lead";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export default function Home() {
	return (
		<HomeClient
			calendlyUrl={CALENDLY_URL}
			leadApiUrl={LEAD_API}
			metaPixelId={META_PIXEL_ID}
		/>
	);
}
