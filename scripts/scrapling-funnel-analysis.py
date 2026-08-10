#!/usr/bin/env python3
"""Funnel Analysis using Scrapling - Real landing page analysis"""

import sys
import json

sys.path.insert(0, "C:/Users/jquin/Music/Scrapling-0.4.7")

try:
    from scrapling import Fetcher
except ImportError as e:
    print(json.dumps({"error": f"Scrapling import error: {str(e)}"}))
    sys.exit(1)


def analyze_funnel(url: str) -> dict:
    """Analyze funnel using Scrapling with real data extraction"""
    try:
        response = Fetcher.get(url)
        html = response.body.decode("utf-8", errors="ignore")

        headlines = []
        for sel in ["h1::text", "h2::text", "h3::text"]:
            headlines.extend(response.css(sel).getall())
        headlines = list(set(h.strip() for h in headlines if h.strip() and len(h.strip()) > 2))[:15]

        ctas = response.css(
            'a[class*="btn"]::text, a[class*="cta"]::text, a[class*="button"]::text, '
            'button::text'
        ).getall()
        ctas = list(set(c.strip() for c in ctas if c.strip() and len(c.strip()) > 2))[:15]

        form_elements = response.css("form")
        forms = []
        for i, form in enumerate(form_elements[:10]):
            inputs = form.css("input::attr(name), input::attr(placeholder)").getall()
            forms.append({
                "type": form.css("::attr(id)").get(default=f"form-{i}"),
                "fields": [f.strip() for f in inputs if f.strip()][:8],
            })

        images = response.css("img::attr(alt)").getall()
        images = [i.strip() for i in images if i.strip() and len(i.strip()) > 2][:10]

        has_header = bool(response.css("header, nav").getall())
        has_footer = bool(response.css("footer").getall())
        has_hero = bool(response.css('[class*="hero"], [class*="banner"], [class*="slider"]').getall())

        score = min(100, len(headlines) * 5 + len(ctas) * 8 + len(forms) * 15 + (10 if has_hero else 0))

        html_lower = html.lower()
        funnel_type = "E-commerce" if any(w in html_lower for w in ["cart", "shop", "buy", "product", "price"]) else "SaaS"

        return {
            "success": True,
            "url": url,
            "analysis": {
                "headlines": headlines,
                "ctas": ctas,
                "forms": forms,
                "images": images,
                "layout": {"has_header": has_header, "has_footer": has_footer, "has_hero": has_hero},
                "performance": {"status": "success", "page_size": len(html)},
            },
            "score": score,
            "funnelType": funnel_type,
        }
    except Exception as e:
        return {
            "success": False,
            "url": url,
            "error": str(e),
            "analysis": {"headlines": [], "ctas": [], "forms": [], "images": [], "layout": {}, "performance": {}},
            "score": 0,
            "funnelType": "Unknown",
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrapling-funnel-analysis.py <url>"}))
        sys.exit(1)

    result = analyze_funnel(sys.argv[1])
    print(json.dumps(result))
