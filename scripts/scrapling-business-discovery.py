#!/usr/bin/env python3
"""Business Discovery using Scrapling - Real web scraping from Yellow Pages"""

import sys
import json
import re

sys.path.insert(0, "C:/Users/jquin/Music/Scrapling-0.4.7")

try:
    from scrapling import Fetcher
except ImportError as e:
    print(json.dumps({"error": f"Scrapling import error: {str(e)}"}))
    sys.exit(1)


def discover_businesses(keyword: str, location: str, limit: int = 10) -> dict:
    """Discover real businesses by scraping Yellow Pages"""
    try:
        search_terms = keyword.replace(" ", "+")
        geo_terms = location.replace(" ", "+").replace(",", "%2C")
        url = f"https://www.yellowpages.com/search?search_terms={search_terms}&geo_location_terms={geo_terms}"

        response = Fetcher.get(url)
        html = response.body.decode("utf-8", errors="ignore")
        businesses = []

        results = response.css(".result")
        for result in results[:limit]:
            # Extract all text in this result to parse
            all_text = [t.strip() for t in result.css("*::text").getall() if t.strip()]

            # Business name is in the a.business-name link
            links = result.css("a")
            name = ""
            link = ""
            website = ""
            categories_list = []
            for a in links:
                cls = a.css("::attr(class)").get(default="")
                text = a.css("::text").get(default="").strip()
                href = a.css("::attr(href)").get(default="")
                if "business-name" in cls and text:
                    name = text
                    link = href
                elif "track-visit-website" in cls:
                    website = href

            phone = result.css(".phones::text").get(default="").strip()

            # Address from all_text: look for street pattern
            full_address = ""
            for i, t in enumerate(all_text):
                if any(c.isdigit() for c in t[:3]) and any(w in t.lower() for w in ["st", "ave", "blvd", "rd", "dr", "ln", "way", "plaza", "broadway"]):
                    full_address = t
                    if i + 1 < len(all_text) and "," in all_text[i + 1]:
                        full_address += ", " + all_text[i + 1]
                    break

            if name:
                businesses.append({
                    "name": name,
                    "address": full_address or "See listing",
                    "phone": phone or "N/A",
                    "website": website if website else f"https://www.yellowpages.com{link}" if link else "N/A",
                    "rating": "N/A",
                    "source": "yellowpages",
                })

        # Fallback: also try Yelp structured data
        if not businesses:
            try:
                yelp_url = f"https://www.yelp.com/search?find_desc={search_terms}&find_loc={geo_terms}"
                yelp_response = Fetcher.get(yelp_url)

                scripts = yelp_response.css('script[type="application/ld+json"]::text').getall()
                for script in scripts:
                    try:
                        data = json.loads(script)
                        if isinstance(data, dict) and data.get("@type") == "ItemList":
                            for item in data.get("itemListElement", [])[:limit]:
                                biz = item.get("item", {})
                                if biz.get("name"):
                                    businesses.append({
                                        "name": biz["name"],
                                        "address": biz.get("address", {}).get("streetAddress", "N/A"),
                                        "phone": biz.get("telephone", "N/A"),
                                        "website": biz.get("url", "N/A"),
                                        "rating": str(biz.get("aggregateRating", {}).get("ratingValue", "N/A")),
                                        "source": "yelp",
                                    })
                    except (json.JSONDecodeError, ValueError):
                        continue
            except Exception:
                pass

        return {
            "success": True,
            "discoveredBusinesses": businesses[:limit],
            "count": len(businesses[:limit]),
            "keyword": keyword,
            "location": location,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "discoveredBusinesses": [],
            "count": 0,
            "keyword": keyword,
            "location": location,
        }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: scrapling-business-discovery.py <keyword> <location> [limit]"}))
        sys.exit(1)

    keyword = sys.argv[1]
    location = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    result = discover_businesses(keyword, location, limit)
    print(json.dumps(result))
