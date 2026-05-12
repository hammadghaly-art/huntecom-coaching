"use client";

import Script from "next/script";
import PhoneInput, { isPossiblePhoneNumber } from "react-phone-number-input";
import deLabels from "react-phone-number-input/locale/de.json";
import "react-phone-number-input/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
	ChevronLeft,
	ChevronRight,
	LineChart,
	Mail,
	MessageSquare,
	UserRound,
	Wallet,
} from "lucide-react";
import "./funnel.css";

/** React Strict Mode (dev) mounts twice — verhindert doppelten CRM-POST */
let coachingLeadSubmitInFlight = false;

// ─────────────────────────────────────────────────────────────────────────────
// COACHING QUALIFICATION FUNNEL
//
// 5-step progressive form: Fragen → Motivation → Kontaktdaten → Submit → Calendly.
// Qualifikation zuerst, persönliche Daten erst am Ende. Score-Boost wie gehabt.
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
	revenueGoal: RevenueGoal | "";
	capital: Capital | "";
	experience: Experience | "";
	goal: string;
	/** Pflicht für Absenden: dokumentierte Einwilligung → `emailMarketingOptIn` im CRM */
	contactConsent: boolean;
};

const INITIAL: FormState = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	revenueGoal: "",
	capital: "",
	experience: "",
	goal: "",
	contactConsent: false,
};

type ChoiceOption<T extends string> = {
	value: T;
	label: string;
	hint?: string;
};

const REVENUE_OPTIONS: ChoiceOption<RevenueGoal>[] = [
	{ value: "lt5k", label: "Unter 5.000 € / Monat" },
	{ value: "5k_20k", label: "5.000 – 20.000 € / Monat" },
	{ value: "20k_50k", label: "20.000 – 50.000 € / Monat" },
	{ value: "50k_plus", label: "50.000+ € / Monat", hint: "Skalieren-Fokus" },
];

const CAPITAL_OPTIONS: ChoiceOption<Capital>[] = [
	{ value: "lt5k", label: "Unter 5.000 €" },
	{ value: "5k_15k", label: "5.000 – 15.000 €" },
	{ value: "15k_50k", label: "15.000 – 50.000 €" },
	{ value: "50k_plus", label: "50.000+ €", hint: "Premium-Bereich" },
];

function CoachingStepHead({
	id,
	title,
	lead,
	Icon,
	onBack,
	disabled,
}: {
	id: string;
	title: string;
	lead: string;
	Icon?: LucideIcon;
	onBack: () => void;
	disabled?: boolean;
}) {
	return (
		<div className="hc-step__headrow">
			<button
				type="button"
				className="hc-step__back"
				onClick={onBack}
				disabled={disabled}
				aria-label="Zurück"
				title="Zurück"
			>
				<ChevronLeft className="hc-step__back-icon" strokeWidth={2.25} aria-hidden />
			</button>
			<div className="hc-step__head-cluster">
				<div className="hc-step__title-icon-row">
					<h1 className="hc-step__title hc-step__title--caps" id={id}>
						{title}
					</h1>
					{Icon ? (
						<span className="hc-step__title-inline-icon" aria-hidden="true">
							<Icon className="hc-step__title-inline-svg" strokeWidth={1.75} />
						</span>
					) : null}
				</div>
				<p className="hc-step__lead">{lead}</p>
			</div>
		</div>
	);
}

const EXPERIENCE_OPTIONS: ChoiceOption<Experience>[] = [
	{
		value: "beginner",
		label: "Einsteiger",
		hint: "Noch kein Amazon-Umsatz",
	},
	{
		value: "selling",
		label: "Aktiver Verkäufer",
		hint: "Umsatz da, Optimierung nötig",
	},
	{
		value: "scaling",
		label: "Skalierung",
		hint: "Wachstum, Team, Prozesse",
	},
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
	const [submitUiProgress, setSubmitUiProgress] = useState(0);
	const [submitStatusLabel, setSubmitStatusLabel] = useState("");
	const handledStepRef = useRef<number | null>(null);
	const submitProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);
	const submitAnimPhaseRef = useRef(0);
	/** Wenn `/brand/…` fehlt oder nicht lädt: stabiles „H“-Fallback wie zuvor. */
	const [brandLogoOk, setBrandLogoOk] = useState(true);

	const utm = useMemo(() => readUtmFromUrl(), []);

	function clearSubmitProgressAnimation() {
		if (submitProgressIntervalRef.current) {
			clearInterval(submitProgressIntervalRef.current);
			submitProgressIntervalRef.current = null;
		}
	}

	useEffect(() => {
		return () => {
			clearSubmitProgressAnimation();
		};
	}, []);

	// Surface a friendly disqualification — we never hard-block, we just
	// route low-end into a different funnel (tools/free content) instead
	// of taking up a 1:1 slot. They can still book if they insist.
	const disqualified =
		data.revenueGoal === "lt5k" || data.capital === "lt5k";

	const TOTAL_STEPS = 5;

	const STEP_LABELS = useMemo(
		() => ["Ausgangslage", "Umsatz", "Budget", "Motivation", "Kontakt"],
		[],
	);

	const progress = useMemo(() => {
		if (step < TOTAL_STEPS) {
			return Math.round(((step + 1) / 5) * 70);
		}
		return Math.min(100, Math.round(70 + (submitUiProgress / 100) * 30));
	}, [step, submitUiProgress]);

	function update<K extends keyof FormState>(key: K, value: FormState[K]) {
		setData((d) => ({ ...d, [key]: value }));
	}

	function next() {
		setError(null);
		if (step === 3) {
			setStep(4);
			return;
		}
		if (step === 4) {
			if (!data.firstName.trim() || !data.email.trim()) {
				setError("Bitte Vorname und E-Mail-Adresse ausfüllen.");
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
				setError("Bitte gib eine gültige E-Mail-Adresse ein.");
				return;
			}
			if (data.phone.trim() && !isPossiblePhoneNumber(data.phone)) {
				setError(
					"Die Telefonnummer ist unvollständig. Bitte prüfen oder das Feld freilassen.",
				);
				return;
			}
			if (!data.contactConsent) {
				setError(
					"Bitte bestätige die Einwilligung zur Kontaktaufnahme und die Kenntnisnahme der Datenschutzerklärung.",
				);
				return;
			}
			setStep(TOTAL_STEPS);
			return;
		}
	}

	function back() {
		setError(null);
		setStep((s) => Math.max(s - 1, 0));
	}

	async function submit() {
		if (coachingLeadSubmitInFlight) return;
		coachingLeadSubmitInFlight = true;
		setError(null);
		setSubmitting(true);
		clearSubmitProgressAnimation();
		submitAnimPhaseRef.current = 0;
		setSubmitUiProgress(4);
		setSubmitStatusLabel(
			"Schritt 1 von 2: Deine Angaben werden sicher übertragen …",
		);
		submitProgressIntervalRef.current = setInterval(() => {
			setSubmitUiProgress((p) => {
				const next =
					p < 84 ? Math.min(84, p + 2 + Math.random() * 5) : p;
				if (next > 32 && submitAnimPhaseRef.current < 1) {
					submitAnimPhaseRef.current = 1;
					setSubmitStatusLabel(
						"Schritt 1 von 2: Antwort vom Server wird geprüft …",
					);
				} else if (next > 62 && submitAnimPhaseRef.current < 2) {
					submitAnimPhaseRef.current = 2;
					setSubmitStatusLabel(
						"Schritt 1 von 2: Terminkalender wird bereitgestellt …",
					);
				}
				return next;
			});
		}, 200);
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
					submissionChannel: "next",
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
					},
					emailMarketingOptIn: data.contactConsent,
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
				let detail = "";
				try {
					const j = (await res.json()) as { error?: string };
					if (j?.error) detail = ` (${j.error})`;
				} catch {
					// ignore
				}
				throw new Error(`HTTP ${res.status}${detail}`);
			}
		} catch (err) {
			console.error("Lead submit failed", err);
			coachingLeadSubmitInFlight = false;
			clearSubmitProgressAnimation();
			submitAnimPhaseRef.current = 0;
			setSubmitUiProgress(0);
			setSubmitStatusLabel("");
			const msg =
				err instanceof TypeError
					? "Netzwerkfehler: Bitte Verbindung prüfen oder später erneut versuchen. In manchen Browsern blockiert eine Erweiterung die Anfrage."
					: "Die Übertragung ist fehlgeschlagen. Bitte versuche es erneut.";
			setError(msg);
			setSubmitting(false);
			setStep(4);
			return;
		}

		clearSubmitProgressAnimation();
		setSubmitUiProgress(100);
		setSubmitStatusLabel("Schritt 2 von 2: Weiterleitung zum Kalender …");
		await new Promise((r) => setTimeout(r, 420));

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

	// Step 5: Auto-CRMPush + Weiterleitung Calendly nach gültigen Kontaktdaten.
	useEffect(() => {
		if (step !== TOTAL_STEPS) {
			handledStepRef.current = null;
			return;
		}
		if (handledStepRef.current === TOTAL_STEPS) return;
		handledStepRef.current = TOTAL_STEPS;
		submit();
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

			<div
				className="hc-funnel__shell"
				aria-busy={step === TOTAL_STEPS}
			>
				<div className="hc-funnel__brand">
					<div className="hc-funnel__brand-logo-wrap">
						{brandLogoOk ? (
							// Public-Asset wie in layout.tsx (bei Bedarf durch größeres Logo in /brand ersetzen)
							<img
								src="/brand/huntecom-favicon.png"
								width={48}
								height={48}
								alt="Huntecom"
								decoding="async"
								className="hc-funnel__brand-logo"
								onError={() => setBrandLogoOk(false)}
							/>
						) : (
							<span className="hc-funnel__brand-mark" aria-hidden="true">
								H
							</span>
						)}
					</div>
					<div className="hc-funnel__brand-text">
						<div className="hc-funnel__brand-row">
							<span className="hc-funnel__brand-name">Huntecom</span>
							<span className="hc-funnel__brand-sep" aria-hidden="true">
								·
							</span>
							<span className="hc-funnel__brand-tag">1:1 Amazon FBA Coaching</span>
						</div>
					</div>
				</div>

				{/* STEP 0 — Einstieg + Erfahrung (Titel unten: Brand trägt „Coaching“ oben) */}
				{step === 0 ? (
					<section
						className="hc-step hc-step--opening"
						aria-labelledby="hc-experience-q hc-step-0-context"
					>
						<div className="hc-question-block">
							<div className="hc-question-block__icon" aria-hidden="true">
								<UserRound className="hc-question-block__svg" strokeWidth={1.65} />
							</div>
							<h1 className="hc-step__subtitle" id="hc-experience-q">
								Wo stehst du heute?
							</h1>
						</div>
						<div className="hc-options" role="group" aria-labelledby="hc-experience-q">
							{EXPERIENCE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={`hc-option hc-option--text-only ${data.experience === opt.value ? "is-active" : ""}`}
									aria-pressed={data.experience === opt.value}
									onClick={() => {
										setError(null);
										update("experience", opt.value);
										setStep(1);
									}}
								>
									<span className="hc-option__text">
										<span className="hc-option__label">{opt.label}</span>
										<span className="hc-option__hint">
											{opt.hint ?? "\u00a0"}
										</span>
									</span>
								</button>
							))}
						</div>
						<p className="hc-step__contextline" id="hc-step-0-context">
							1:1-Coaching anfragen
						</p>
					</section>
				) : null}

				{/* STEP 1 — Umsatzziel */}
				{step === 1 ? (
					<section className="hc-step" aria-labelledby="hc-step-1-title">
						<CoachingStepHead
							id="hc-step-1-title"
							title="Geplanter Monatsumsatz"
							lead="Zeithorizont: 12 Monate · bitte realistisch einschätzen"
							Icon={LineChart}
							onBack={back}
							disabled={submitting}
						/>
						<div className="hc-options" role="group" aria-labelledby="hc-step-1-title">
							{REVENUE_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={`hc-option hc-option--text-only ${data.revenueGoal === opt.value ? "is-active" : ""}`}
									aria-pressed={data.revenueGoal === opt.value}
									onClick={() => {
										setError(null);
										update("revenueGoal", opt.value);
										setStep(2);
									}}
								>
									<span className="hc-option__text">
										<span className="hc-option__label">{opt.label}</span>
										<span className="hc-option__hint">
											{opt.hint ?? "\u00a0"}
										</span>
									</span>
								</button>
							))}
						</div>
					</section>
				) : null}

				{/* STEP 2 — Kapital */}
				{step === 2 ? (
					<section className="hc-step" aria-labelledby="hc-step-2-title">
						<CoachingStepHead
							id="hc-step-2-title"
							title="Investitionsrahmen"
							lead="Startkapital inkl. Lager, Marketing & Tools (grobe Orientierung)"
							Icon={Wallet}
							onBack={back}
							disabled={submitting}
						/>
						<div className="hc-options" role="group" aria-labelledby="hc-step-2-title">
							{CAPITAL_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									className={`hc-option hc-option--text-only ${data.capital === opt.value ? "is-active" : ""}`}
									aria-pressed={data.capital === opt.value}
									onClick={() => {
										setError(null);
										update("capital", opt.value);
										setStep(3);
									}}
								>
									<span className="hc-option__text">
										<span className="hc-option__label">{opt.label}</span>
										<span className="hc-option__hint">
											{opt.hint ?? "\u00a0"}
										</span>
									</span>
								</button>
							))}
						</div>
					</section>
				) : null}

				{/* STEP 3 — Motivation / Freitext */}
				{step === 3 ? (
					<section className="hc-step" aria-labelledby="hc-step-3-title">
						<CoachingStepHead
							id="hc-step-3-title"
							title="Dein Fokus"
							lead="Optional · 1–2 Sätze zu Priorität und Rahmen"
							Icon={MessageSquare}
							onBack={back}
							disabled={submitting}
						/>
						<label className="hc-textarea-label" htmlFor="hc-coaching-goal">
							Kurzbeschreibung <span className="hc-textarea-label__optional">(optional)</span>
						</label>
						<textarea
							id="hc-coaching-goal"
							className="hc-textarea"
							rows={4}
							value={data.goal}
							onChange={(e) => update("goal", e.target.value)}
							placeholder="z. B. Erstes Produkt live in 90 Tagen, klare PPC-Struktur, Unterstützung bei Lieferantenwahl …"
						/>
						{disqualified ? (
							<div className="hc-warn">
								Bei sehr niedrigem Ziel- und Budgetrahmen ist klassisches 1:1
								Coaching oft nicht der effizienteste Einstieg — unsere Tools
								auf{" "}
								<a
									href="https://ai.huntecom.com"
									target="_blank"
									rel="noopener noreferrer"
								>
									ai.huntecom.com
								</a>{" "}
								können der passendere erste Schritt sein. Du kannst dennoch
								terminieren; wir gehen transparent mit Erwartungen um.
							</div>
						) : null}
					</section>
				) : null}

				{/* STEP 4 — Kontaktdaten, dann automatisch CRM + Calendly */}
				{step === 4 ? (
					<section className="hc-step" aria-labelledby="hc-step-4-title">
						<CoachingStepHead
							id="hc-step-4-title"
							title="Kontakt für Rückmeldung"
							lead="Anschließend Kalender · keine Werbemails"
							Icon={Mail}
							onBack={back}
							disabled={submitting}
						/>
						<fieldset className="hc-fieldset">
							<legend className="hc-fieldset-legend">Deine Daten</legend>
							<div className="hc-grid">
							<label className="hc-field" htmlFor="hc-coaching-firstname">
								<span>Vorname (Pflichtfeld)</span>
								<input
									id="hc-coaching-firstname"
									type="text"
									autoComplete="given-name"
									value={data.firstName}
									onChange={(e) => update("firstName", e.target.value)}
									placeholder="Vorname"
								/>
							</label>
							<label className="hc-field" htmlFor="hc-coaching-lastname">
								<span>Nachname (optional)</span>
								<input
									id="hc-coaching-lastname"
									type="text"
									autoComplete="family-name"
									value={data.lastName}
									onChange={(e) => update("lastName", e.target.value)}
									placeholder="Nachname"
								/>
							</label>
							<label className="hc-field hc-field--full" htmlFor="hc-coaching-email">
								<span>E-Mail (Pflichtfeld)</span>
								<input
									id="hc-coaching-email"
									type="email"
									autoComplete="email"
									inputMode="email"
									value={data.email}
									onChange={(e) => update("email", e.target.value)}
									placeholder="du@beispiel.de"
								/>
							</label>
							<div className="hc-field hc-field--full hc-phone">
								<span id="hc-phone-label">Telefon (optional)</span>
								<span className="hc-field-hint" id="hc-phone-hint">
									Für Rückfragen — Land über die Flagge wählen, gültige
									internationale Nummer.
								</span>
								<PhoneInput
									international
									defaultCountry="DE"
									labels={deLabels}
									value={data.phone || undefined}
									onChange={(v) => update("phone", v ?? "")}
									placeholder="z. B. 170 1234567"
									className="hc-phone-input"
									autoComplete="tel"
									aria-labelledby="hc-phone-label"
									aria-describedby="hc-phone-hint"
								/>
							</div>
							<label className="hc-consent hc-field--full" htmlFor="hc-coaching-consent">
								<input
									id="hc-coaching-consent"
									type="checkbox"
									checked={data.contactConsent}
									onChange={(e) =>
										update("contactConsent", e.target.checked)
									}
									className="hc-consent__checkbox"
								/>
								<span className="hc-consent__text">
									Ich bestätige, die{" "}
									<a
										href="/datenschutz"
										target="_blank"
										rel="noopener noreferrer"
									>
										Datenschutzerklärung
									</a>{" "}
									von Huntecom zur Kenntnis genommen zu haben und bin damit
									einverstanden, im Zusammenhang mit dieser Anfrage per E-Mail
									und Telefon von Huntecom kontaktiert zu werden.{" "}
									<span className="hc-consent__required" aria-hidden="true">
										*
									</span>
								</span>
							</label>
							</div>
						</fieldset>
					</section>
				) : null}

				{/* STEP 5 — Übermitteln (useEffect → submit → Calendly) */}
				{step === TOTAL_STEPS ? (
					<section
						className="hc-step hc-step--center hc-step--submitting"
						aria-busy="true"
					>
						<p className="hc-sr-live" aria-live="polite">
							{submitStatusLabel} Fortschritt etwa{" "}
							{Math.round(Math.max(0, Math.min(100, submitUiProgress)))}{" "}
							Prozent.
						</p>
						<div className="hc-submit-visual" aria-hidden="true">
							<div className="hc-submit-ring" />
						</div>
						<h1 className="hc-step__title">Deine Anfrage wird bearbeitet</h1>
						<p className="hc-submit-status">{submitStatusLabel}</p>
						<div className="hc-submit-track" aria-hidden="true">
							<div
								className="hc-submit-track__fill"
								style={{
									width: `${Math.max(6, Math.min(100, submitUiProgress))}%`,
								}}
							/>
						</div>
						<p className="hc-step__lead hc-step__lead--hint">
							In der Regel dauert das wenige Sekunden. Bitte dieses Fenster
							nicht schließen.
						</p>
						<p className="hc-submit-pct" aria-hidden="true">
							{Math.round(
								Math.max(0, Math.min(100, submitUiProgress)),
							)}{" "}
							%
						</p>
					</section>
				) : null}

				{error ? (
					<div className="hc-error" role="alert">
						{error}
					</div>
				) : null}

				{step < TOTAL_STEPS ? (
					<footer className="hc-funnel__dock">
						<div
							className={`hc-funnel__progress${step === TOTAL_STEPS ? " hc-funnel__progress--active" : ""}`}
						>
							<div
								className="hc-funnel__progress-bar"
								style={{ width: `${progress}%` }}
								aria-valuenow={progress}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={`Formularfortschritt ${progress} Prozent`}
								role="progressbar"
							/>
						</div>
						<div className="hc-funnel__step-head">
							<p className="hc-funnel__step-meta" aria-live="polite">
								Schritt {step + 1} von {TOTAL_STEPS}
							</p>
							<ol className="hc-step-dots" aria-label="Fortschritt im Formular">
								{STEP_LABELS.map((label, i) => {
									const state =
										i < step ? "done" : i === step ? "current" : "upcoming";
									return (
										<li key={label} className={`hc-step-dots__item hc-step-dots__item--${state}`}>
											<span className="hc-step-dots__dot" title={label} />
											<span className="hc-step-dots__sr">{label}</span>
										</li>
									);
								})}
							</ol>
						</div>
						{step >= 3 ? (
							<div className="hc-actions hc-actions--primary-only">
								<button
									type="button"
									className="hc-btn hc-btn--primary"
									onClick={next}
									disabled={submitting}
								>
									{step === 4 ? (
										"Anfrage senden & Termin wählen"
									) : (
										<>
											Zum Kontakt
											<ChevronRight className="hc-btn__icon" strokeWidth={2.25} aria-hidden />
										</>
									)}
								</button>
							</div>
						) : null}
					</footer>
				) : null}

				<p className="hc-legal-foot">
					<a href="/datenschutz" target="_blank" rel="noopener noreferrer">
						Datenschutz
					</a>
					<span aria-hidden="true"> · </span>
					<a href="/impressum" target="_blank" rel="noopener noreferrer">
						Impressum
					</a>
				</p>
			</div>
		</div>
	);
}
