/**
 * Läuft im Webflow-Dokument (auch im Iframe): Links mit …#apply öffnen die Parent-Seite mit #apply.
 */
(function () {
	"use strict";

	function applyHref(href) {
		if (!href) return false;
		var h = String(href).trim();
		if (h === "#apply" || h === "/#apply") return true;
		return h.length >= 6 && h.slice(-6) === "#apply";
	}

	function openParentApply() {
		try {
			if (window.top && window.top !== window) {
				window.top.location.hash = "apply";
				return;
			}
		} catch (_e) {
			/* top ggf. cross-origin */
		}
		try {
			if (window.parent && window.parent !== window) {
				window.parent.postMessage(
					{ t: "huntecom:apply" },
					window.location.origin,
				);
				return;
			}
		} catch (_e2) {
			/* ignore */
		}
		window.location.hash = "apply";
	}

	document.addEventListener(
		"click",
		function (e) {
			var n = e.target;
			if (!n || typeof n.closest !== "function") return;
			var a = n.closest("a[href]");
			if (!a || !a.getAttribute) return;
			if (!applyHref(a.getAttribute("href"))) return;
			e.preventDefault();
			if (e.stopPropagation) e.stopPropagation();
			openParentApply();
		},
		true,
	);
})();
