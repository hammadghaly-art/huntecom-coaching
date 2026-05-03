"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// COACHING QUALIFICATION FUNNEL
//
// 5-step progressive form. Each answer narrows the score; the very low-end
// gets filtered out (gentle reject) so we don't waste 1:1 calls on people
// who don't have the runway for FBA.
//
// On submit we POST to ai.huntecom.com/api/crm/lead which:
//   1. creates / updates CrmContact in workspace=huntecom
//   2. logs the form_submit activity
//   3. applies the qualification score boost
//   4. mirrors a Lead event into Meta CAPI (server-side, hashed email)
//
// We additionally fire fbq('track', 'Lead', …) client-side here so the
// browser-pixel side gets the same event with a shared eventID for
// dedupe — the standard "double-fire" pattern Meta recommends.
// ─────────────────────────────────────────────────────────────────────────────

type RevenueGoal = "lt5k" | "5k_20k" | "20k_50k" | "50k_plus";
type Capital = "lt5k" | "5k_15k" | "15k_50k" | "50k_plus";
type Experience = "beginner" | "selling" | "scaling";

type FormState = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	instagram: string;
	revenueGoal: RevenueGoal | "";
	capital: Capital | "";
	experience: Experience | "";
	goal: string;
};

const INITIAL: FormState = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	instagram: "",
	revenueGoal: "",
	capital: "",
	experience: "",
	goal: "",
};

const REVENUE_OPTIONS: { value: RevenueGoal; label: string; hint?: string }[] = [
	{ value: "lt5k", label: "Unter 5.000 € / Monat" },
	{ value: "5k_20k", label: "5.000 – 20.000 € / Monat" },
	{ value: "20k_50k", label: "20.000 – 50.000 € / Monat" },
	{ value: "50k_plus", label: "50.000+ € / Monat", hint: "Skalieren-Fokus" },
];

const CAPITAL_OPTIONS: { value: Capital; label: string; hint?: string }[] = [
	{ value: "lt5k", label: "Unter 5.000 €" },
	{ value: "5k_15k", label: "5.000 – 15.000 €" },
	{ value: "15k_50k", label: "15.000 – 50.000 €" },
	{ value: "50k_plus", label: "50.000+ €", hint: "Premium-Bereich" },
];

const EXPERIENCE_OPTIONS: { value: Experience; label: string; hint?: string }[] = [
	{ value: "beginner", label: "Kompletter Anfänger", hint: "Noch nichts verkauft" },
	{ value: "selling", label: "Habe schon verkauft", hint: "Läuft aber nicht rund" },
	{ value: "scaling", label: "Mache Umsatz, will skalieren" },
];

function readUtmFromUrl(): Record<string, string> {
	if (typeof window === "undefined") return {};
	const sp = new URLSearchParams(window.location.search);
	const obj: Record<string, string> = {};
	for (const k of [
		"utm_source",
		"utm_medium",
		"utm_campaign",
		"utm_content",
		"utm_term",
		"fbclid",
		"gclid",
	]) {
		const v = sp.get(k);
		if (v) obj[k.replace("utm_", "")] = v;
	}
	return obj;
}

function readCookie(name: string): string {
	if (typeof document === "undefined") return "";
	const m = document.cookie.match(new RegExp(`${name}=([^;]+)`));
	return m?.[1] ?? "";
}

function generateEventId(): string {
	return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

declare global {
	interface Window {
		fbq?: (...args: unknown[]) => void;
		_fbq?: unknown;
	}
}

export function CoachingFunnel({
	calendlyUrl,
	leadApiUrl,
	metaPixelId,
}: {
	calendlyUrl: string;
	leadApiUrl: string;
	metaPixelId: string;
}) {
	const [step, setStep] = useState(0);
	const [data, setData] = useState<FormState>(INITIAL);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const utm = useMemo(() => readUtmFromUrl(), []);

	// Surface a friendly disqualification — we never hard-block, we just
	// route low-end into a different funnel (tools/free content) instead
	// of taking up a 1:1 slot. They can still book if they insist.
	const disqualified =
		data.revenueGoal === "lt5k" || data.capital === "lt5k";

	const TOTAL_STEPS = 5;
	const progress = Math.round((step / TOTAL_STEPS) * 100);

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setData((d) => ({ ...d, [key]: value }));
	}

	function next() {
		setError(null);
		if (step === 0) {
			if (!data.firstName.trim() || !data.email.trim()) {
				setError("Bitte Name und E-Mail eintragen.");
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
				setError("E-Mail-Adresse sieht nicht richtig aus.");
				return;
			}
		}
		if (step === 1 && !data.experience) {
			setError("Bitte wähle einen Punkt.");
			return;
		}
		if (step === 2 && !data.revenueGoal) {
			setError("Bitte wähle dein Ziel.");
			return;
		}
		if (step === 3 && !data.capital) {
			setError("Bitte wähle einen Punkt.");
			return;
		}
		setStep((s) => Math.min(s + 1, TOTAL_STEPS));
	}

	function back() {
		setError(null);
		setStep((s) => Math.max(s - 1, 0));
	}

	async function submit() {
		setError(null);
		setSubmitting(true);
		const eventId = generateEventId();

		// Fire Meta-Pixel client-side (CAPI server-side fires from /api/crm/lead
		// indirectly via Stripe/Resend/etc; for a raw Lead we trigger CAPI
		// from the API route — see below).
		try {
			if (typeof window !== "undefined" && window.fbq) {
				window.fbq("track", "Lead", {
					content_name: "coaching_apply",
					content_category: "huntecom_coaching",
					value: 1,
					currency: "EUR",
				}, { eventID: eventId });
			}
		} catch {
			// non-blocking
		}

		try {
			const res = await fetch(leadApiUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: data.email.trim().toLowerCase(),
					firstName: data.firstName.trim(),
					lastName: data.lastName.trim(),
					phone: data.phone.trim(),
					workspace: "huntecom",
					formId: "coaching_apply",
					notes: data.goal.trim() || undefined,
					eventId,
					pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
					qualification: {
						revenueGoal: data.revenueGoal || undefined,
						capital: data.capital || undefined,
						experience: data.experience || undefined,
						goal: data.goal.trim() || undefined,
						instagram: data.instagram.trim() || undefined,
					},
					utm: {
						source: utm.source,
						medium: utm.medium,
						campaign: utm.campaign,
						content: utm.content,
						term: utm.term,
						fbclid: utm.fbclid || readCookie("_fbc"),
						gclid: utm.gclid,
					},
				}),
			});
			if (!res.ok) {
				throw new Error(`Server error ${res.status}`);
			}
		} catch (err) {
			console.error("Lead submit failed", err);
			setError("Übertragung fehlgeschlagen — bitte versuche es nochmal.");
			setSubmitting(false);
			return;
		}

		// Redirect to Calendly with prefilled name + email. Calendly accepts
		// `name`, `email`, `a1` (custom q1), … via query string.
		const url = new URL(calendlyUrl);
		url.searchParams.set("name", `${data.firstName} ${data.lastName}`.trim());
		url.searchParams.set("email", data.email);
		// utm passthrough so attribution survives the booking step
		if (utm.source) url.searchParams.set("utm_source", utm.source);
		if (utm.campaign) url.searchParams.set("utm_campaign", utm.campaign);

		window.location.href = url.toString();
	}

	// Step 5 of 5 → "Anfrage absenden". We auto-fire submit when entering
	// the success step so the user doesn't have to click an extra button.
	useEffect(() => {
		if (step === TOTAL_STEPS) {
			submit();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [step]);

	return (
		<div className="hc-funnel">
			{/* Meta Pixel — only loads in production where the ID is present. */}
			{metaPixelId ? (
				<>
					<Script
						id="meta-pixel"
						strategy="afterInteractive"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: official Meta snippet
						dangerouslySetInnerHTML={{
							__html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
fbq('track', 'ViewContent', { content_name: 'coaching_apply', content_category: 'huntecom_coaching' });
							`,
						}}
					/>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<noscript>
						<img
							height="1"
							width="1"
							style={{ display: "none" }}
							alt=""
							src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
						/>
					</noscript>
				</>
			) : null}

			<div className="hc-funnel__shell">
				<div className="hc-funnel__progress">
					<div
						className="hc-funnel__progress-bar"
						style={{ width: `${progress}%` }}
						aria-valuenow={progress}
						aria-valuemin={0}
						aria-valuemax={100}
						role="progressbar"
					/>
				</div>

				<div className="hc-funnel__brand">
					<span className="hc-funnel__brand-mark" aria-hidden="true">
						H
					</span>
					<div>
						<div className="hc-funnel__brand-name">Huntecom</div>
						<div className="hc-funnel__brand-tag">1:1 Amazon FBA Coaching</div>
					</div>
				</div>

				{/* STEP 0 — contact basics */}
				{step === 0 ? (
					<section className="hc-step">
						<h1 className="hc-step__title">
							Bewirb dich um dein 1:1 Coaching
						</h1>
						<p className="hc-step__lead">
							Beantworte 5 kurze Fragen — danach buchst du dein
							Erstgespräch direkt im Kalender. Kein Massen-Coaching, nur
							echte Plätze.
						</p>
						<div className="hc-grid">
							<label className="hc-field">
								<span>Vorname *</span>
								<input
									type="text"
									autoComplete="given-name"
									value={data.firstName}
									onChange={(e) => update("firstName", e.target.value)}
									placeholder="Max"
								/>
							</label>
							<label className="hc-field">
								<span>Nachname</span>
								<input
									type="text"
									autoComplete="family-name"
									value={data.lastName}
									onChange={(e) => update("lastName", e.target.value)}
									placeholder="Muster"
								/>
							</label>
							<label className="hc-field hc-field--full">
								<span>E-Mail *</span>
								<input
									type="email"
									autoComplete="email"
									value={data.email}
									onChange={(e) => update("email", e.target.value)}
									placeholder="max@firma.de"
								/>
							</label>
							<label className="hc-field">
								<span>Telefon</span>
								<input
									type="tel"
									autoComplete="tel"
									value={data.phone}
									onChange={(e) => update("phone", e.target.value)}
									placeholder="+49 …"
								/>
							</label>
							<label className="hc-field">
								<span>Instagram</span>
								<input
									type="text"
									value={data.instagram}
									onChange={(e) => update("instagram", e.target.value)}
									placeholder="@dein_handle"
								/>
							</label>
						</div>
					</section>
				) : null}

				{/* STEP 1 — current experience */}
				{step === 1 ? (
					<section className="hc-step">
						<h1 className="hc-step__title">Wo stehst du gerade?</h1>
						<p className="hc-step__lead">Damit wir wissen, womit wir starten.</p>
						<div className="hc-options">
							{EXPERIENCE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={`hc-option ${data.experience === opt.value ? "is-active" : ""}`}
									onClick={() => update("experience", opt.value)}
								>
									<span className="hc-option__label">{opt.label}</span>
									{opt.hint ? (
										<span className="hc-option__hint">{opt.hint}</span>
									) : null}
								</button>
							))}
						</div>
					</section>
				) : null}

				{/* STEP 2 — revenue goal */}
				{step === 2 ? (
					<section className="hc-step">
						<h1 className="hc-step__title">
							Was willst du monatlich verdienen?
						</h1>
						<p className="hc-step__lead">
							Realistisches Ziel auf 12-Monats-Sicht.
						</p>
						<div className="hc-options">
							{REVENUE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={`hc-option ${data.revenueGoal === opt.value ? "is-active" : ""}`}
									onClick={() => update("revenueGoal", opt.value)}
								>
									<span className="hc-option__label">{opt.label}</span>
									{opt.hint ? (
										<span className="hc-option__hint">{opt.hint}</span>
									) : null}
								</button>
							))}
						</div>
					</section>
				) : null}

				{/* STEP 3 — capital */}
				{step === 3 ? (
					<section className="hc-step">
						<h1 className="hc-step__title">
							Wie viel Kapital hast du verfügbar?
						</h1>
						<p className="hc-step__lead">
							Nur ehrliche Antworten — wir empfehlen kein Coaching, das
							sich nicht trägt.
						</p>
						<div className="hc-options">
							{CAPITAL_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={`hc-option ${data.capital === opt.value ? "is-active" : ""}`}
									onClick={() => update("capital", opt.value)}
								>
									<span className="hc-option__label">{opt.label}</span>
									{opt.hint ? (
										<span className="hc-option__hint">{opt.hint}</span>
									) : null}
								</button>
							))}
						</div>
					</section>
				) : null}

				{/* STEP 4 — open question */}
				{step === 4 ? (
					<section className="hc-step">
						<h1 className="hc-step__title">
							Was ist der wichtigste Grund warum du jetzt startest?
						</h1>
						<p className="hc-step__lead">
							2-3 Sätze reichen — hilft mir das Gespräch vorzubereiten.
						</p>
						<textarea
							className="hc-textarea"
							rows={6}
							value={data.goal}
							onChange={(e) => update("goal", e.target.value)}
							placeholder="z.B. Ich möchte in 12 Monaten Vollzeit auf Amazon umsteigen, habe aktuell ein Produkt im Visier aber Angst vor PPC …"
						/>
						{disqualified ? (
							<div className="hc-warn">
								Mit deinem aktuellen Ziel & Budget ist 1:1-Coaching meist
								nicht der schnellste Weg — schau dir lieber unsere
								KI-Tools auf{" "}
								<a href="https://ai.huntecom.com" rel="noopener">
									ai.huntecom.com
								</a>{" "}
								an. Du kannst trotzdem ein Gespräch buchen, aber wir wollen
								ehrlich sein.
							</div>
						) : null}
					</section>
				) : null}

				{/* STEP 5 — submitting */}
				{step === TOTAL_STEPS ? (
					<section className="hc-step hc-step--center">
						<div className="hc-spinner" aria-hidden="true" />
						<h1 className="hc-step__title">Deine Anfrage wird übermittelt …</h1>
						<p className="hc-step__lead">
							Gleich öffnet sich der Kalender, damit du dein Erstgespräch
							buchst.
						</p>
					</section>
				) : null}

				{error ? <div className="hc-error">{error}</div> : null}

				{step < TOTAL_STEPS ? (
					<div className="hc-actions">
						{step > 0 ? (
							<button
								type="button"
								className="hc-btn hc-btn--ghost"
								onClick={back}
								disabled={submitting}
							>
								← Zurück
							</button>
						) : null}
						<button
							type="button"
							className="hc-btn hc-btn--primary"
							onClick={step === 4 ? () => setStep(TOTAL_STEPS) : next}
							disabled={submitting}
						>
							{step === 4
								? "Anfrage absenden →"
								: step === 0
									? "Weiter →"
									: "Weiter →"}
						</button>
					</div>
				) : null}

				<div className="hc-trust">
					🔒 Deine Daten sind verschlüsselt. Keine Werbung, kein Newsletter
					ohne Opt-in.
				</div>
			</div>
		</div>
	);
}
