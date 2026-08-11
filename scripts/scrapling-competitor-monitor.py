#!/usr/bin/env python3
"""Competitor Monitoring using Scrapling - Real competitive intelligence"""

import sys
import json
import re

sys.path.insert(0, "C:/Users/jquin/Music/Scrapling-0.4.7")

try:
    from scrapling import Fetcher
except ImportError as e:
    print(json.dumps({"error": f"Scrapling import error: {str(e)}"}))
    sys.exit(1)


def monitor_competitors(competitors: list) -> dict:
    """Monitor competitors using Scrapling with real data extraction"""
    results = []

    for domain in competitors:
        try:
            url = f"https://{domain}" if not domain.startswith("http") else domain
            response = Fetcher.get(url)
            html = response.body.decode("utf-8", errors="ignore")
            html_lower = html.lower()

            # Extract pricing
            pricing = response.css('[class*="price"]::text, [class*="cost"]::text').getall()
            pricing = list(set(p.strip() for p in pricing if p.strip() and ("$" in p or "€" in p or p.strip().replace(".", "").isdigit())))[:8]

            # Extract features
            features = response.css('[class*="feature"]::text, [class*="benefit"]::text').getall()
            features = list(set(f.strip() for f in features if f.strip() and len(f.strip()) > 3))[:10]

            # Positioning
            description = response.css('meta[name="description"]::attr(content)').get(default="")
            headline = response.css("h1::text").getall()
            headline = next((h.strip() for h in headline if h.strip()), "")
            title = response.css("title::text").get(default="")

            # Detect tech stack
            tech_stack = []
            tech_map = {
                "Shopify": ["shopify", "cdn.shopify"],
                "WordPress": ["wp-content", "wp-includes"],
                "React": ["react", "__next"],
                "HubSpot": ["hubspot", "hs-scripts"],
                "Google Analytics": ["google-analytics", "gtag"],
                "Stripe": ["stripe.com", "js.stripe"],
                "Klaviyo": ["klaviyo"],
                "Mailchimp": ["mailchimp"],
            }
            for tech, signals in tech_map.items():
                if any(s in html_lower for s in signals):
                    tech_stack.append(tech)

            # Detect strengths and weaknesses
            strengths = []
            weaknesses = []

            if response.css("form").getall():
                strengths.append("Lead capture forms present")
            else:
                weaknesses.append("No lead capture forms detected")

            if any(w in html_lower for w in ["testimonial", "review", "customer"]):
                strengths.append("Social proof / testimonials present")
            else:
                weaknesses.append("No visible social proof")

            if response.css('[class*="blog"], a[href*="blog"]').getall():
                strengths.append("Active blog / content marketing")
            else:
                weaknesses.append("No blog or content marketing detected")

            if tech_stack:
                strengths.append(f"Tech stack: {', '.join(tech_stack[:5])}")

            if len(html) > 500000:
                weaknesses.append("Large page size may affect performance")

            score = min(100, len(pricing) * 8 + len(features) * 5 + len(strengths) * 12 + (15 if headline else 0))

            results.append({
                "domain": domain,
                "title": title.strip(),
                "pricing": pricing if pricing else ["Not publicly listed"],
                "features": features if features else ["See website for details"],
                "positioning": {
                    "tagline": description[:200],
                    "headline": headline,
                    "company_type": "E-commerce" if any(w in html_lower for w in ["shop", "cart", "buy"]) else "SaaS/Service",
                },
                "techStack": tech_stack,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "market_gaps": [],
                "score": score,
                "pageSize": len(html),
            })
        except Exception as e:
            results.append({
                "domain": domain,
                "error": str(e),
                "pricing": [],
                "features": [],
                "positioning": {},
                "techStack": [],
                "strengths": [],
                "weaknesses": [f"Could not analyze: {str(e)[:80]}"],
                "market_gaps": [],
                "score": 0,
            })

    return {
        "success": True,
        "competitors": results,
        "count": len(results),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrapling-competitor-monitor.py <domain1> [domain2]..."}))
        sys.exit(1)

    result = monitor_competitors(sys.argv[1:])
    print(json.dumps(result))
