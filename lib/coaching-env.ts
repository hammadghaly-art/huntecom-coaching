/** Shared Coaching-/Apply-Env — ein Default, damit kein totes Calendly-Slug mehr leakt. */
export function coachingCalendlyUrl(): string {
	return (
		process.env.NEXT_PUBLIC_CALENDLY_URL?.trim() ||
		"https://calendly.com/huntecom/30min"
	);
}

export function coachingLeadApiUrl(): string {
	return (
		process.env.NEXT_PUBLIC_LEAD_API?.trim() ||
		"https://ai.huntecom.com/api/crm/lead"
	);
}

export function coachingMetaPixelId(): string {
	return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
}
