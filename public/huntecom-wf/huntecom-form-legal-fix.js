/**
 * Ersetzt Webflow-Formular-Footer-Links (webflow.com/legal → Huntecom).
 */
(function () {
	if (window.__huntecomFormLegal) return;
	window.__huntecomFormLegal = 1;

	var URL_DS = "https://www.huntecom.com/datenschutz";
	var URL_IM = "https://www.huntecom.com/impressum";

	function patch() {
		document
			.querySelectorAll(
				'a[href*="webflow.com/legal"],a[href*="webflow.io/legal"]',
			)
			.forEach(function (a) {
				var h = (a.getAttribute("href") || "").toLowerCase();
				var txt = (a.textContent || "").toLowerCase();
				a.setAttribute("rel", "noopener noreferrer");
				a.setAttribute("target", "_blank");
				var isTerms =
					h.includes("terms") ||
					h.includes("/tos") ||
					txt.includes("terms") ||
					txt.includes("nutzungs");
				var isPrivacy =
					h.includes("privacy") ||
					txt.includes("privacy") ||
					txt.includes("datenschutz");
				if (isTerms && !isPrivacy) {
					a.setAttribute("href", URL_IM);
				} else if (isPrivacy && !isTerms) {
					a.setAttribute("href", URL_DS);
				} else if (isTerms) {
					a.setAttribute("href", URL_IM);
				} else {
					a.setAttribute("href", URL_DS);
				}
			});
	}

	var debounce;
	function schedule() {
		clearTimeout(debounce);
		debounce = setTimeout(patch, 80);
	}

	function boot() {
		patch();
		if (document.body) {
			new MutationObserver(schedule).observe(document.body, {
				childList: true,
				subtree: true,
			});
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
	window.addEventListener("load", function () {
		setTimeout(patch, 400);
	});
})();
