/**
 * Coaching-/Hero-Videos: Autoplay stumm (Browser-Policy), Ton nach Klick/Tap.
 * Nach Nutzer-Interaktion bleibt Audio an (kein erneutes Stummschalten).
 */
(function () {
	"use strict";

	function enableAudio(video) {
		if (!video || video.dataset.huntecomAudioOn === "1") {
			return;
		}
		video.dataset.huntecomAudioOn = "1";
		video.muted = false;
		video.defaultMuted = false;
		if (video.volume === 0) {
			video.volume = 1;
		}
		const playPromise = video.play();
		if (playPromise && typeof playPromise.catch === "function") {
			playPromise.catch(function () {});
		}
	}

	function bindTapForAudio(video) {
		if (!video || video.dataset.huntecomTapAudioInit === "1") {
			return;
		}
		video.dataset.huntecomTapAudioInit = "1";

		video.muted = true;
		video.setAttribute("muted", "");

		function onEngage() {
			enableAudio(video);
		}

		video.addEventListener("pointerdown", onEngage);
		video.addEventListener("click", onEngage);

		video.addEventListener("play", function () {
			if (video.dataset.huntecomAudioOn === "1") {
				video.muted = false;
			}
		});

		/* Play über native Controls (manchmal ohne pointerdown auf <video>) */
		video.addEventListener("volumechange", function () {
			if (!video.muted) {
				video.dataset.huntecomAudioOn = "1";
			}
		});
	}

	function boot() {
		const videos = document.querySelectorAll("[data-huntecom-tap-for-audio]");
		for (let i = 0; i < videos.length; i++) {
			const node = videos[i];
			if (node instanceof HTMLVideoElement) {
				bindTapForAudio(node);
			}
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
