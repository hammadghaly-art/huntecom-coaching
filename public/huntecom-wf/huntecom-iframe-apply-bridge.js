/**
 * Läuft im Webflow-Dokument (auch im Iframe): Apply-Links öffnen die Parent-Seite /apply.
 */
(function () {
	"use strict";

	function applyHref(href) {
		if (!href) return false;
		var h = String(href).trim();
		if (h === "#apply" || h === "/#apply" || h === "/apply") return true;
		return h.length >= 6 && h.slice(-6) === "#apply";
	}

	function openParentApply() {
		var search = "";
		try {
			search = window.top && window.top.location ? window.top.location.search : "";
		} catch (_searchErr) {
			search = window.location.search || "";
		}
		var dest = "/apply" + search;
		try {
			if (window.top && window.top !== window) {
				window.top.location.href = dest;
				return;
			}
		} catch (_e) {
			/* top ggf. cross-origin */
		}
		try {
			if (window.parent && window.parent !== window) {
				window.parent.postMessage({ t: "huntecom:apply" }, window.location.origin);
				return;
			}
		} catch (_e2) {
			/* ignore */
		}
		window.location.href = dest;
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
