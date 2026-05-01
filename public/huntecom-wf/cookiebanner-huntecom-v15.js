/**
 * Huntecom Cookie-Banner v15 — UI wie Gadstudio (helles Modal, schwarze Toggles).
 * localStorage "cookie-consent": { essential:1, analytics, marketing, preferences }
 * Passt zu gtag consent in index.html — aktualisiert Consent nach Speichern.
 */
(function () {
	if (window.__huntecomCB === 15) return;
	window.__huntecomCB = 15;

	var KEY = "cookie-consent";
	var d = document;
	var L = localStorage;
	var URL_PRIVACY = "datenschutz.html";
	var URL_COOKIES = "datenschutz.html#cookies";

	var TXT = {
		banTitle: "Cookie-Einstellungen",
		banLead:
			"Wir setzen Cookies und ähnliche Technologien ein, um die Website bereitzustellen, Nutzung zu messen und Inhalte zu personalisieren. Nicht notwendige Cookies verwenden wir nur mit deiner Einwilligung. Weitere Informationen in der ",
		banMid: " und den ",
		privacy: "Datenschutzerklärung",
		cookieInfo: "Cookie-Hinweisen",
		customize: "Anpassen",
		reject: "Ablehnen",
		accept: "Akzeptieren",
		setTitle: "Cookie-Einstellungen",
		setDesc: "Verwalte deine Cookie-Präferenzen.",
		nec: "Notwendig",
		necD: "Grundfunktionen der Website.",
		ana: "Analyse",
		anaD: "Website-Verbesserung.",
		mkt: "Marketing",
		mktD: "Relevante Werbung.",
		pref: "Präferenzen",
		prefD: "Deine Einstellungen.",
		cancel: "Zurück",
		save: "Speichern",
		close: "Schließen",
	};

	var SVG = {
		cookie:
			'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><circle cx="8.5" cy="8.5" r=".5" fill="currentColor"/><circle cx="16" cy="15.5" r=".5" fill="currentColor"/><circle cx="12" cy="12" r=".5" fill="currentColor"/></svg>',
	};

	function injectCss() {
		if (d.getElementById("huntecom-cc-css")) return;
		var s = d.createElement("style");
		s.id = "huntecom-cc-css";
		s.textContent =
			"#hc-cc-ban,#hc-cc-dlg{position:fixed!important;z-index:2147483647!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;box-sizing:border-box}" +
			"#hc-cc-ban *,#hc-cc-dlg *{box-sizing:border-box}" +
			"#hc-cc-ban{bottom:20px!important;right:20px!important;max-width:400px;pointer-events:none}" +
			"@media(max-width:520px){#hc-cc-ban{bottom:0!important;right:0!important;left:0!important;max-width:none;padding:0 12px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom));pointer-events:none}}" +
			".hc-cc-card{background:#fff;color:#1a1a1a;border-radius:20px;box-shadow:0 12px 40px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);padding:22px 22px 20px;pointer-events:auto;border:1px solid rgba(0,0,0,.06)}" +
			"@media(max-width:520px){.hc-cc-card{border-radius:20px 20px 0 0}}" +
			".hc-cc-card h3{margin:0 0 10px;font-size:16px;font-weight:600;letter-spacing:-.02em;color:#171717}" +
			".hc-cc-ban-p{margin:0 0 18px;font-size:13px;line-height:1.55;color:#525252}" +
			".hc-cc-ban-p a{color:#171717;text-decoration:underline;text-underline-offset:2px;font-weight:500}" +
			".hc-cc-ban-p a:hover{color:#404040}" +
			".hc-cc-btns{display:flex;flex-wrap:wrap;gap:8px}" +
			".hc-cc-btns .hc-cc-btn{flex:1;min-width:calc(33.333% - 6px)}" +
			"@media(max-width:520px){.hc-cc-btns .hc-cc-btn{min-width:100%}}" +
			".hc-cc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:11px 14px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #e5e5e5;background:#fff;color:#171717;transition:background .15s,border-color .15s,box-shadow .15s}" +
			".hc-cc-btn:hover{background:#f5f5f5;border-color:#d4d4d4}" +
			".hc-cc-btn:disabled{opacity:.45;cursor:not-allowed}" +
			".hc-cc-btn-p{background:#0a0a0a;color:#fff;border-color:#0a0a0a}" +
			".hc-cc-btn-p:hover{background:#262626;border-color:#262626}" +
			"#hc-cc-dlg{inset:0!important;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.45);backdrop-filter:blur(6px)}" +
			"@media(max-width:520px){#hc-cc-dlg{align-items:flex-end;padding:12px}}" +
			".hc-cc-mod{width:100%;max-width:420px;background:#fff;border-radius:22px;overflow:hidden;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.18);border:1px solid rgba(0,0,0,.06)}" +
			"@media(max-width:520px){.hc-cc-mod{border-radius:22px 22px 0 0;align-self:flex-end;margin-top:auto}}" +
			".hc-cc-x{position:absolute;top:14px;right:14px;width:36px;height:36px;border:0;border-radius:10px;background:#f5f5f5;color:#525252;font-size:20px;line-height:1;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center}" +
			".hc-cc-x:hover{background:#ebebeb;color:#171717}" +
			".hc-cc-x:focus-visible{outline:2px solid #171717;outline-offset:2px}" +
			".hc-cc-hd{padding:24px 48px 18px 22px;border-bottom:1px solid #f0f0f0}" +
			".hc-cc-hd h3{margin:0;font-size:17px;font-weight:600;color:#262626;letter-spacing:-.02em}" +
			".hc-cc-hd p{margin:8px 0 0;font-size:13px;line-height:1.5;color:#737373}" +
			".hc-cc-bd{padding:8px 22px 18px;max-height:min(52vh,360px);overflow-y:auto}" +
			".hc-cc-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid #f0f0f0}" +
			".hc-cc-row:last-child{border-bottom:0}" +
			".hc-cc-row-t{min-width:0}" +
			".hc-cc-tit{font-size:14px;font-weight:600;color:#171717;display:block}" +
			".hc-cc-desc{font-size:12px;line-height:1.45;color:#737373;margin-top:4px;display:block}" +
			".hc-cc-sw{position:relative;width:44px;height:26px;flex-shrink:0;border-radius:999px;border:0;background:#e5e5e5;cursor:pointer;padding:0;transition:background .2s}" +
			".hc-cc-sw.on{background:#0a0a0a}" +
			".hc-cc-sw:disabled{opacity:.45;cursor:not-allowed}" +
			".hc-cc-sw::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);transition:transform .2s}" +
			".hc-cc-sw.on::after{transform:translateX(18px)}" +
			".hc-cc-sw:focus-visible{outline:2px solid #171717;outline-offset:2px}" +
			".hc-cc-ft{display:flex;gap:10px;padding:16px 22px 22px;border-top:1px solid #f0f0f0;background:#fafafa}" +
			".hc-cc-ft .hc-cc-btn{flex:1}" +
			".hc-cc-tg{position:fixed!important;z-index:2147483000!important;bottom:22px!important;right:22px!important;width:48px!important;height:48px!important;border-radius:14px!important;border:1px solid rgba(0,0,0,.08)!important;background:#0a0a0a!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-shadow:0 8px 28px rgba(0,0,0,.25)!important;pointer-events:auto!important}" +
			".hc-cc-tg:hover{background:#262626!important}" +
			".hc-cc-tg:focus-visible{outline:2px solid #fff;outline-offset:2px}";
		d.head.appendChild(s);
	}

	function clearUi() {
		d.querySelectorAll("#hc-cc-ban, #hc-cc-dlg, [data-hc-cc-tg]").forEach(function (el) {
			el.remove();
		});
	}

	function read() {
		try {
			var j = JSON.parse(L.getItem(KEY) || "null");
			if (!j || typeof j !== "object") return null;
			if (j.state && typeof j.state === "object") {
				var st = j.state;
				return {
					a: !!st.analytics,
					m: !!st.marketing,
					p: !!st.preferences,
				};
			}
			var a = !!j.analytics;
			var m = !!j.marketing;
			var p = j.preferences;
			if (p === undefined) p = 0;
			return { a: a, m: m, p: !!p };
		} catch (e) {
			return null;
		}
	}

	function write(o) {
		L.setItem(
			KEY,
			JSON.stringify({
				essential: 1,
				analytics: o.a ? 1 : 0,
				marketing: o.m ? 1 : 0,
				preferences: o.p ? 1 : 0,
			}),
		);
		if (typeof window.gtag === "function") {
			window.gtag("consent", "update", {
				analytics_storage: o.a ? "granted" : "denied",
				ad_storage: o.m ? "granted" : "denied",
				ad_user_data: o.m ? "granted" : "denied",
				ad_personalization: o.m ? "granted" : "denied",
			});
		}
	}

	function showBanner() {
		clearUi();
		injectCss();
		var wrap = d.createElement("div");
		wrap.id = "hc-cc-ban";
		wrap.innerHTML =
			'<div class="hc-cc-card">' +
			"<h3>" +
			TXT.banTitle +
			"</h3>" +
			'<p class="hc-cc-ban-p">' +
			TXT.banLead +
			'<a href="' +
			URL_PRIVACY +
			'">' +
			TXT.privacy +
			"</a>" +
			TXT.banMid +
			'<a href="' +
			URL_COOKIES +
			'">' +
			TXT.cookieInfo +
			"</a>." +
			"</p>" +
			'<div class="hc-cc-btns">' +
			'<button type="button" class="hc-cc-btn" id="hc-cc-rej">' +
			TXT.reject +
			"</button>" +
			'<button type="button" class="hc-cc-btn" id="hc-cc-cus">' +
			TXT.customize +
			"</button>" +
			'<button type="button" class="hc-cc-btn hc-cc-btn-p" id="hc-cc-acc">' +
			TXT.accept +
			"</button>" +
			"</div></div>";
		d.body.appendChild(wrap);
		wrap.querySelector("#hc-cc-cus").onclick = function () {
			showSettings(false);
		};
		wrap.querySelector("#hc-cc-acc").onclick = function () {
			write({ a: true, m: true, p: true });
			clearUi();
			gear();
		};
		wrap.querySelector("#hc-cc-rej").onclick = function () {
			write({ a: false, m: false, p: false });
			clearUi();
			gear();
		};
	}

	function bindSw(root, key) {
		var btn = root.querySelector('.hc-cc-sw[data-k="' + key + '"]');
		if (!btn || btn.disabled) return;
		btn.addEventListener("click", function () {
			var on = !btn.classList.contains("on");
			btn.classList.toggle("on", on);
			btn.setAttribute("aria-checked", on ? "true" : "false");
		});
	}

	function readSw(dlg) {
		return {
			a: dlg.querySelector('.hc-cc-sw[data-k="a"]').classList.contains("on"),
			m: dlg.querySelector('.hc-cc-sw[data-k="m"]').classList.contains("on"),
			p: dlg.querySelector('.hc-cc-sw[data-k="p"]').classList.contains("on"),
		};
	}

	function row(title, desc, key, on, dis) {
		var cl = "hc-cc-sw" + (on ? " on" : "");
		var ds = dis ? " disabled" : "";
		return (
			'<div class="hc-cc-row">' +
			'<div class="hc-cc-row-t"><span class="hc-cc-tit">' +
			title +
			'</span><span class="hc-cc-desc">' +
			desc +
			"</span></div>" +
			'<button type="button" class="' +
			cl +
			'" role="switch" aria-checked="' +
			(on ? "true" : "false") +
			'" data-k="' +
			key +
			'"' +
			ds +
			"></button></div>"
		);
	}

	function showSettings(hasSavedConsent) {
		clearUi();
		injectCss();
		var c = read();
		var a = c ? c.a : false;
		var m = c ? c.m : false;
		var p = c ? c.p : false;

		var dlg = d.createElement("div");
		dlg.id = "hc-cc-dlg";
		dlg.innerHTML =
			'<div class="hc-cc-mod" role="dialog" aria-modal="true" aria-labelledby="hc-cc-dlg-title">' +
			'<button type="button" class="hc-cc-x" id="hc-cc-x" aria-label="' +
			TXT.close +
			'">\u00d7</button>' +
			'<div class="hc-cc-hd"><h3 id="hc-cc-dlg-title">' +
			TXT.setTitle +
			"</h3><p>" +
			TXT.setDesc +
			"</p></div>" +
			'<div class="hc-cc-bd">' +
			row(TXT.nec, TXT.necD, "n", true, true) +
			row(TXT.ana, TXT.anaD, "a", a, false) +
			row(TXT.mkt, TXT.mktD, "m", m, false) +
			row(TXT.pref, TXT.prefD, "p", p, false) +
			"</div>" +
			'<div class="hc-cc-ft">' +
			'<button type="button" class="hc-cc-btn" id="hc-cc-back">' +
			TXT.cancel +
			"</button>" +
			'<button type="button" class="hc-cc-btn hc-cc-btn-p" id="hc-cc-sav">' +
			TXT.save +
			"</button>" +
			"</div></div>";

		d.body.appendChild(dlg);

		var body = dlg.querySelector(".hc-cc-bd");
		bindSw(body, "a");
		bindSw(body, "m");
		bindSw(body, "p");

		function back() {
			clearUi();
			if (hasSavedConsent || read()) gear();
			else showBanner();
		}

		dlg.querySelector("#hc-cc-x").onclick = back;
		dlg.querySelector("#hc-cc-back").onclick = back;
		dlg.onclick = function (ev) {
			if (ev.target === dlg) back();
		};
		dlg.querySelector("#hc-cc-sav").onclick = function () {
			var st = readSw(dlg);
			write({ a: st.a, m: st.m, p: st.p });
			clearUi();
			gear();
		};
	}

	function gear() {
		var b = d.createElement("button");
		b.type = "button";
		b.className = "hc-cc-tg";
		b.setAttribute("data-hc-cc-tg", "1");
		b.setAttribute("aria-label", "Cookie-Einstellungen öffnen");
		b.title = "Cookies";
		b.innerHTML = SVG.cookie;
		b.onclick = function (e) {
			e.preventDefault();
			showSettings(true);
		};
		d.body.appendChild(b);
	}

	injectCss();
	if (read()) gear();
	else showBanner();
})();
