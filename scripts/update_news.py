"""Fetch latest hantavirus news from ProMED RSS and append to data/news.json."""

import json
import datetime
from pathlib import Path

try:
    import feedparser
except ImportError:
    feedparser = None

NEWS_FILE = Path(__file__).resolve().parent.parent / "data" / "news.json"
PROMED_RSS = "https://promedmail.org/feed/"


def load_news():
    with open(NEWS_FILE) as f:
        return json.load(f)


def save_news(data):
    data["last_updated"] = datetime.date.today().isoformat()
    with open(NEWS_FILE, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def fetch_promed():
    if feedparser is None:
        print("feedparser not installed, skipping ProMED fetch")
        return []

    feed = feedparser.parse(PROMED_RSS)
    articles = []
    for entry in feed.entries:
        title = entry.get("title", "")
        if "hanta" not in title.lower():
            continue
        pub = entry.get("published_parsed")
        date = datetime.date(*pub[:3]).isoformat() if pub else datetime.date.today().isoformat()
        articles.append({
            "date": date,
            "source": "ProMED",
            "title": title,
            "url": entry.get("link", "https://www.promedmail.org/"),
            "summary": entry.get("summary", "")[:300],
        })
    return articles


def deduplicate(articles):
    seen = set()
    unique = []
    for a in articles:
        key = a["title"].strip().lower()
        if key not in seen:
            seen.add(key)
            unique.append(a)
    return unique


def main():
    data = load_news()
    existing = data.get("articles", [])

    new_articles = fetch_promed()
    if not new_articles:
        print("No new hantavirus articles found")
        save_news(data)
        return

    combined = new_articles + existing
    data["articles"] = deduplicate(combined)
    data["articles"].sort(key=lambda a: a["date"], reverse=True)

    added = len(data["articles"]) - len(existing)
    print(f"Added {added} new article(s)")
    save_news(data)


if __name__ == "__main__":
    main()
