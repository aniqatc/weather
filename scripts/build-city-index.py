"""Build the search-suggestion index from OpenWeather's city list.

Usage:
    python3 scripts/build-city-index.py path/to/city.list.json

The source file is OpenWeather's bulk city list
(https://bulk.openweathermap.org/sample/city.list.json.gz, about 42 MB).
It is NOT shipped with the site. This script turns it into small shards in
json/cities/, keyed by the first two letters of a city's name, so the browser
only downloads the shard for what the user is typing (a few KB, up to ~330 KB for the most common prefixes).

Each entry is [name, state, country, lat, lon].
"""
import json
import os
import sys
import unicodedata
from collections import defaultdict

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "json", "cities")


def normalize(text):
    """Lowercase and strip accents so "sao" matches "São"."""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").lower()


def shard_key(name):
    key = ""
    for ch in normalize(name):
        if ch.isascii() and ch.isalnum():
            key += ch
        else:
            key += "_"
        if len(key) == 2:
            break
    return key.ljust(2, "_")


def main(src):
    with open(src, encoding="utf-8") as f:
        cities = json.load(f)

    shards = defaultdict(list)
    seen = set()
    for c in cities:
        name = c["name"].strip()
        if not name:
            continue
        entry = [
            name,
            c.get("state", "") or "",
            c.get("country", "") or "",
            round(c["coord"]["lat"], 4),
            round(c["coord"]["lon"], 4),
        ]
        # The list has near-duplicates (same name/state/country); keep one.
        dedupe = (normalize(name), entry[1], entry[2])
        if dedupe in seen:
            continue
        seen.add(dedupe)
        shards[shard_key(name)].append(entry)

    os.makedirs(OUT_DIR, exist_ok=True)
    for old in os.listdir(OUT_DIR):
        if old.endswith(".json"):
            os.remove(os.path.join(OUT_DIR, old))

    total = 0
    for key, entries in shards.items():
        entries.sort(key=lambda e: (normalize(e[0]), e[2], e[1]))
        with open(os.path.join(OUT_DIR, key + ".json"), "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))
        total += len(entries)

    print(f"Wrote {total} cities into {len(shards)} shards in {os.path.normpath(OUT_DIR)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
