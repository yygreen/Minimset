#!/usr/bin/env python3
"""Find every place the season dates surface, and verify a date change landed.

The season dates are authored in two files -- lib/data.ts (English, plus the
per-site pickup rows in SITES) and lib/he.ts (Hebrew) -- but they render into
dozens of places across the English and Hebrew pages. When a date changes, the
question is not whether the source edit compiled, it is whether any page still
shows the old one. Hebrew is the easy half to miss: /he carries its own wording,
not a translation.

Audit what a deployment currently shows:

    python3 tools/check-season-dates.py https://4minimset.com
    python3 tools/check-season-dates.py snapshot          # the captured baseline

Verify a change, after editing lib/data.ts and lib/he.ts:

    python3 tools/check-season-dates.py https://<preview>.vercel.app \
        --stale 'September 5' --stale '5 בספטמבר' \
        --expect 'September 12' --expect '12 בספטמבר'

`--stale` text must appear nowhere; `--expect` text must appear somewhere. Exit
status is 0 only when both hold, so it can gate a deploy.
"""

import argparse
import html
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT = ROOT / "recovery" / "snapshot" / "pages"

# What counts as a season date in the shipped copy, English and Hebrew.
PROBES = {
    "payment deadline": r"September\s*\d{1,2}\b|Motzaei Shabbos|\d{1,2}\s*בספטמבר|מוצאי שבת",
    "pickup day": r"Tuesday,\s*September\s*\d{1,2}\b|יום שלישי,\s*\d{1,2}\s*בספטמבר",
    "Yom Kippur": r"Yom Kippur|יום כיפור",
    "season label": r"Sukkos\s*5787|סוכות תשפ",
}


def stem_to_route(stem: str) -> str:
    return "/" if stem == "index" else "/" + stem.replace("__", "/")


def visible_text(doc: str) -> str:
    doc = re.sub(r"<(script|style|template|noscript)\b.*?</\1>", " ", doc, flags=re.S | re.I)
    doc = re.sub(r"<[^>]+>", " ", doc)
    return re.sub(r"\s+", " ", html.unescape(doc))


def fetch(url: str, timeout: int, attempts: int = 3) -> str:
    request = urllib.request.Request(
        url, headers={"User-Agent": "minimset-season-dates/1.0"}
    )
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except urllib.error.HTTPError:
            raise
        except (urllib.error.URLError, OSError):
            if attempt == attempts:
                raise
            time.sleep(2 * attempt)
    raise AssertionError("unreachable")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="deployment base URL, or 'snapshot'")
    parser.add_argument("--stale", action="append", default=[],
                        help="text that must appear nowhere (repeatable)")
    parser.add_argument("--expect", action="append", default=[],
                        help="text that must appear somewhere (repeatable)")
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()

    pages = sorted(SNAPSHOT.glob("*.html"))
    if not pages:
        print(f"no snapshot at {SNAPSHOT}", file=sys.stderr)
        return 2

    from_snapshot = args.source == "snapshot"
    base = args.source.rstrip("/")

    stale_hits: dict[str, list[str]] = {s: [] for s in args.stale}
    expect_hits: dict[str, list[str]] = {e: [] for e in args.expect}
    unreachable = []

    width = max(len(stem_to_route(p.stem)) for p in pages) + 2
    print(f"{'page':{width}}" + "".join(f"{label[:16]:>18}" for label in PROBES))

    totals = dict.fromkeys(PROBES, 0)
    for page in pages:
        route = stem_to_route(page.stem)
        if from_snapshot:
            text = visible_text(page.read_text(encoding="utf-8", errors="replace"))
        else:
            try:
                text = visible_text(fetch(base + route, args.timeout))
            except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                unreachable.append((route, str(exc)))
                print(f"{route:{width}}  unreachable: {exc}")
                continue

        counts = {label: len(re.findall(pat, text)) for label, pat in PROBES.items()}
        for label, n in counts.items():
            totals[label] += n
        if any(counts.values()):
            print(f"{route:{width}}" + "".join(f"{counts[l] or '':>18}" for l in PROBES))

        for needle in args.stale:
            if needle in text:
                stale_hits[needle].append(route)
        for needle in args.expect:
            if needle in text:
                expect_hits[needle].append(route)

    print(f"{'TOTAL':{width}}" + "".join(f"{totals[l]:>18}" for l in PROBES))

    ok = True
    for needle, routes in stale_hits.items():
        if routes:
            ok = False
            print(f"\nSTALE  {needle!r} still on {len(routes)} page(s): {', '.join(routes)}")
        else:
            print(f"\nclear  {needle!r} appears nowhere")
    for needle, routes in expect_hits.items():
        if routes:
            print(f"found  {needle!r} on {len(routes)} page(s): {', '.join(routes)}")
        else:
            ok = False
            print(f"MISSING  {needle!r} appears on no page")

    if unreachable:
        ok = False
        print(f"\n{len(unreachable)} page(s) unreachable")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
