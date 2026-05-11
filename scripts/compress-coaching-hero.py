#!/usr/bin/env python3
"""
Komprimiert das Huntecom-Coaching-Hero-Video für Web + GitHub (<100 MB).

Voraussetzung: ffmpeg im PATH (https://ffmpeg.org/download.html).

Aufruf vom Repo-Root:
  python scripts/compress-coaching-hero.py
Windows ggf.:  py -3 scripts/compress-coaching-hero.py

Ablauf:
  1) Sucht Eingabe: public/videos/huntecom-coaching-hero.mp4, sonst Source-Backup, sonst größte mp4/mov.
  2) Bei großen Dateien (>85 MB): einmalig Backup als huntecom-coaching-hero-source.mp4 (gitignored).
  3) Schreibt huntecom-coaching-hero.mp4 neu (H.264, max Breite 1280, CRF, +faststart).
  4) Bricht ab, wenn Ausgabe >95 MB (CRF im Skript erhöhen: 30 … 32).
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIDEOS = ROOT / "public" / "videos"
HERO = VIDEOS / "huntecom-coaching-hero.mp4"
SOURCE = VIDEOS / "huntecom-coaching-hero-source.mp4"
TMP = VIDEOS / "huntecom-coaching-hero.tmp.mp4"

MAX_OUT_BYTES = 95 * 1024 * 1024
BACKUP_THRESHOLD = 85 * 1024 * 1024
CRF = "28"


def which_ffmpeg() -> str | None:
	return shutil.which("ffmpeg")


def pick_input() -> Path | None:
	VIDEOS.mkdir(parents=True, exist_ok=True)
	if HERO.exists() and HERO.stat().st_size > 0:
		return HERO
	if SOURCE.exists() and SOURCE.stat().st_size > 0:
		return SOURCE
	skip = {TMP.name, SOURCE.name}
	candidates: list[Path] = []
	for pat in ("*.mp4", "*.mov", "*.webm"):
		for p in VIDEOS.glob(pat):
			if p.name in skip or p.stat().st_size <= 0:
				continue
			candidates.append(p)
	if not candidates:
		return None
	return max(candidates, key=lambda p: p.stat().st_size)


def resolve_ffmpeg_input(inp: Path) -> Path:
	"""Großes Hero-File als SOURCE sichern (Umbenennen, kein 800MB-Kopieren); Encode von SOURCE."""
	if inp.stat().st_size < BACKUP_THRESHOLD:
		return inp
	if inp == HERO:
		if SOURCE.exists():
			print(
				"Nutze vorhandenes huntecom-coaching-hero-source.mp4 als Quelle "
				"(altes großes huntecom-coaching-hero.mp4 wird am Ende überschrieben).",
			)
			return SOURCE
		HERO.rename(SOURCE)
		print(
			f"Große Roh-Datei umbenannt -> {SOURCE.relative_to(ROOT)} "
			f"({SOURCE.stat().st_size // (1024 * 1024)} MB)",
		)
		return SOURCE
	return inp


def run_ffmpeg(inp: Path, out: Path) -> None:
	ff = which_ffmpeg()
	if not ff:
		print("FEHLER: ffmpeg nicht gefunden. Bitte installieren und PATH setzen.", file=sys.stderr)
		sys.exit(1)
	cmd = [
		ff,
		"-y",
		"-i",
		str(inp),
		"-vf",
		"scale='min(1280,iw)':-2",
		"-c:v",
		"libx264",
		"-preset",
		"medium",
		"-crf",
		CRF,
		"-pix_fmt",
		"yuv420p",
		"-c:a",
		"aac",
		"-b:a",
		"128k",
		"-movflags",
		"+faststart",
		str(out),
	]
	print(" ".join(cmd))
	subprocess.run(cmd, check=True)


def main() -> None:
	inp = pick_input()
	if inp is None:
		print(
			f"FEHLER: Keine Videodatei in {VIDEOS.relative_to(ROOT)}. "
			f"Lege dein Video als {HERO.name} ab und starte erneut.",
			file=sys.stderr,
		)
		sys.exit(1)

	print(f"Eingabe: {inp.relative_to(ROOT)} ({inp.stat().st_size // (1024 * 1024)} MB)")
	encode_from = resolve_ffmpeg_input(inp)

	if TMP.exists():
		TMP.unlink()

	print("Komprimiere … (kann einige Minuten dauern)")
	run_ffmpeg(encode_from, TMP)

	size = TMP.stat().st_size
	if size > MAX_OUT_BYTES:
		TMP.unlink(missing_ok=True)
		print(
			f"FEHLER: Ausgabe noch zu groß ({size // (1024 * 1024)} MB). "
			"In scripts/compress-coaching-hero.py CRF auf 30 oder 32 setzen und erneut ausführen.",
			file=sys.stderr,
		)
		sys.exit(1)

	shutil.move(str(TMP), str(HERO))
	print(
		f"Fertig: {HERO.relative_to(ROOT)} ({size // (1024 * 1024)} MB) — "
		"mit git add/commit/pushen, dann ist es auf Vercel sichtbar.",
	)


if __name__ == "__main__":
	main()
