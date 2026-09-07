#!/usr/bin/env python3
"""Compare a deployment against recovery/snapshot/pages/.

The snapshot in recovery/snapshot/pages/ is the production HTML of
4minimset.com as captured on 2026-09-07. Before promoting any build to the
production branch, run this against that build's preview URL: it answers the
only question that matters, which is whether visitors would see a different
site than they see today.

    python3 tools/compare-to-snapshot.py https://<preview>.vercel.app
    python3 tools/compare-to-snapshot.py https://4minimset.com --only index,faq

Exit status is 0 when every page matches, 1 when any page differs or fails to
fetch, so it can gate a promotion.

Comparison is on visible text, not markup. Build-to-build noise -- chunk
hashes, the deployment id stamped into every asset URL, script payloads --
would swamp a byte diff while telling us nothing. Copy, pricing and structure
are what we actually need to hold still.
"""

import argparse
import difflib
import html
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SNAPSHOT = ROOT / "recovery" / "snapshot" / "pages"

# snapshot filename stem -> route. "__" in a stem stands for a path separator.
def stem_to_route(stem: str) -> str:
    if stem == "index":
        return "/"
    return "/" + stem.replace("__", "/")


DROP_TAGS = re.compile(r"<(script|style|template|noscript)\b.*?</\1>", re.S | re.I)
TAGS = re.compile(r"<[^>]+>")
BLOCKS = re.compile(
    r"</?(br|p|div|li|ul|ol|h[1-6]|tr|td|th|section|header|footer|nav|main|article|figure|figcaption|button|label|option)\b[^>]*>",
    re.I,
)
# A live countdown and a server clock legitimately differ between two fetches
# of the same build; nothing else here should.
VOLATILE = [
    (re.compile(r"\b\d{1,2}:\d{2}:\d{2}\b"), "<time>"),
    (re.compile(r"\b\d{10,13}\b"), "<epoch>"),
]


def visible_text(doc: str) -> list[str]:
    doc = DROP_TAGS.sub(" ", doc)
    doc = BLOCKS.sub("\n", doc)
    doc = TAGS.sub(" ", doc)
    doc = html.unescape(doc)
    for pattern, placeholder in VOLATILE:
        doc = pattern.sub(placeholder, doc)
    lines = []
    for line in doc.splitlines():
        line = " ".join(line.split())
        if line:
            lines.append(line)
    return lines


def fetch(url: str, timeout: int, attempts: int = 3) -> str:
    """Fetch a page, retrying transient transport failures.

    Egress here goes through a proxy that intermittently drops TLS handshakes.
    A dropped connection says nothing about the deployment, so retry it rather
    than reporting a page as unreachable.
    """
    request = urllib.request.Request(
        url, headers={"User-Agent": "minimset-snapshot-compare/1.0"}
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
    parser.add_argument("base_url", help="root of the deployment to check")
    parser.add_argument(
        "--only",
        help="comma-separated snapshot names to check (default: all of them)",
    )
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument(
        "--context", type=int, default=2, help="diff context lines to print"
    )
    args = parser.parse_args()

    if not SNAPSHOT.is_dir():
        print(f"no snapshot at {SNAPSHOT}", file=sys.stderr)
        return 2

    wanted = set(args.only.split(",")) if args.only else None
    base = args.base_url.rstrip("/")
    pages = sorted(SNAPSHOT.glob("*.html"))
    if wanted:
        pages = [p for p in pages if p.stem in wanted]
        missing = wanted - {p.stem for p in pages}
        if missing:
            print(f"no such snapshot page: {', '.join(sorted(missing))}", file=sys.stderr)
            return 2

    same, changed, failed = [], [], []
    for page in pages:
        route = stem_to_route(page.stem)
        try:
            live = visible_text(fetch(base + route, args.timeout))
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
            failed.append((route, str(exc)))
            print(f"FAIL  {route}  {exc}")
            continue

        expected = visible_text(page.read_text(encoding="utf-8", errors="replace"))
        if live == expected:
            same.append(route)
            print(f"same  {route}")
            continue

        changed.append(route)
        print(f"DIFF  {route}")
        diff = difflib.unified_diff(
            expected, live, "snapshot", "deployment", n=args.context, lineterm=""
        )
        for line in diff:
            print("      " + line)

    print(
        f"\n{len(same)} unchanged, {len(changed)} changed, {len(failed)} unreachable"
        f"  ({len(pages)} pages checked against the 2026-09-07 snapshot)"
    )
    return 0 if not changed and not failed else 1


if __name__ == "__main__":
    sys.exit(main())
