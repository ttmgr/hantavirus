"""Fetch hantavirus news from ProMED RSS, WHO DON API, and PubMed. Update data/news.json."""

import json
import datetime
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

try:
    import feedparser
except ImportError:
    feedparser = None

NEWS_FILE = Path(__file__).resolve().parent.parent / "data" / "news.json"
PROMED_RSS = "https://promedmail.org/feed/"
WHO_DON_API = "https://www.who.int/api/news/diseaseoutbreaknews"
PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=hantavirus&retmax=5&sort=date&retmode=xml"
PUBMED_SUMMARY = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=xml&id="


def load_news():
    with open(NEWS_FILE) as f:
        return json.load(f)


def save_news(data):
    data["last_updated"] = datetime.date.today().isoformat()
    with open(NEWS_FILE, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def http_get(url, timeout=15):
    req = Request(url, headers={"User-Agent": "HantavirusTracker/1.0"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8")
    except (URLError, OSError) as e:
        print(f"HTTP error fetching {url}: {e}")
        return None


def fetch_promed():
    if feedparser is None:
        print("feedparser not installed, skipping ProMED")
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


def fetch_who_don():
    body = http_get(WHO_DON_API)
    if not body:
        return []

    articles = []
    try:
        data = json.loads(body)
        items = data.get("value", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            print("WHO DON: unexpected response format")
            return []
        for item in items[:20]:
            title = item.get("Title", item.get("title", ""))
            if "hanta" not in title.lower():
                continue
            date_str = item.get("PublicationDate", item.get("date", ""))[:10]
            if not date_str:
                date_str = datetime.date.today().isoformat()
            url = item.get("UrlName", item.get("url", ""))
            if url and not url.startswith("http"):
                url = "https://www.who.int/emergencies/disease-outbreak-news/item/" + url
            articles.append({
                "date": date_str,
                "source": "WHO",
                "title": title,
                "url": url or "https://www.who.int/emergencies/disease-outbreak-news",
                "summary": item.get("Summary", item.get("summary", ""))[:300],
            })
    except (json.JSONDecodeError, KeyError) as e:
        print(f"WHO DON parse error: {e}")
    return articles


def fetch_pubmed():
    search_xml = http_get(PUBMED_SEARCH)
    if not search_xml:
        return []

    articles = []
    try:
        root = ET.fromstring(search_xml)
        ids = [id_el.text for id_el in root.findall(".//Id")]
        if not ids:
            return []

        summary_xml = http_get(PUBMED_SUMMARY + ",".join(ids))
        if not summary_xml:
            return []

        sroot = ET.fromstring(summary_xml)
        for doc in sroot.findall(".//DocSum"):
            pmid = doc.findtext("Id", "")
            title = ""
            date_str = ""
            for item in doc.findall("Item"):
                if item.get("Name") == "Title":
                    title = item.text or ""
                elif item.get("Name") == "PubDate":
                    raw = (item.text or "").strip()
                    parts = raw.split()
                    if len(parts) >= 2:
                        try:
                            dt = datetime.datetime.strptime(parts[0] + " " + parts[1], "%Y %b")
                            date_str = dt.strftime("%Y-%m-01")
                        except ValueError:
                            date_str = parts[0] + "-01-01" if parts[0].isdigit() else ""
            if title:
                articles.append({
                    "date": date_str or datetime.date.today().isoformat(),
                    "source": "PubMed",
                    "title": title,
                    "url": "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/",
                    "summary": "",
                })
    except ET.ParseError as e:
        print(f"PubMed XML parse error: {e}")
    return articles


def deduplicate(articles):
    seen = set()
    unique = []
    for a in articles:
        key = a["title"].strip().lower()[:80]
        if key not in seen:
            seen.add(key)
            unique.append(a)
    return unique


def main():
    data = load_news()
    existing = data.get("articles", [])

    new_articles = []
    for fetcher, name in [(fetch_promed, "ProMED"), (fetch_who_don, "WHO DON"), (fetch_pubmed, "PubMed")]:
        try:
            results = fetcher()
            print(f"{name}: {len(results)} article(s)")
            new_articles.extend(results)
        except Exception as e:
            print(f"{name} error: {e}")

    if not new_articles:
        print("No new articles found from any source")
        save_news(data)
        return

    combined = new_articles + existing
    data["articles"] = deduplicate(combined)
    data["articles"].sort(key=lambda a: a["date"], reverse=True)

    added = len(data["articles"]) - len(existing)
    print(f"Total: {added} new article(s) added")
    save_news(data)


if __name__ == "__main__":
    main()
