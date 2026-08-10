#!/usr/bin/env python3
"""Data Enrichment using Scrapling - Enrich business data from their website"""

import sys
import json
import re

sys.path.insert(0, "C:/Users/jquin/Music/Scrapling-0.4.7")

try:
    from scrapling import Fetcher
except ImportError as e:
    print(json.dumps({"error": f"Scrapling import error: {str(e)}"}))
    sys.exit(1)


def enrich_business(domain: str) -> dict:
    """Enrich business data by scraping their website"""
    try:
        url = f"https://{domain}" if not domain.startswith("http") else domain
        response = Fetcher.get(url)
        html = response.body.decode("utf-8", errors="ignore")
        html_lower = html.lower()

        description = response.css('meta[name="description"]::attr(content)').get(default="")
        title = response.css("title::text").get(default="")

        # Detect technologies
        technologies = []
        tech_signals = {
            "Shopify": ["shopify", "cdn.shopify"],
            "WordPress": ["wp-content", "wp-includes"],
            "React": ["react", "__next", "reactDOM"],
            "Next.js": ["__next", "_next/static"],
            "Vue.js": ["vue.js", "__vue"],
            "Wix": ["wix.com", "parastorage"],
            "Squarespace": ["squarespace"],
            "HubSpot": ["hubspot", "hs-scripts"],
            "Salesforce": ["salesforce", "pardot"],
            "Google Analytics": ["google-analytics", "gtag", "ga.js"],
            "Google Tag Manager": ["googletagmanager", "gtm.js"],
            "Facebook Pixel": ["fbevents", "facebook.com/tr"],
            "TikTok Pixel": ["analytics.tiktok"],
            "Stripe": ["stripe.com", "js.stripe"],
            "PayPal": ["paypal.com", "paypalobjects"],
            "Mailchimp": ["mailchimp", "chimpstatic"],
            "Klaviyo": ["klaviyo"],
            "Intercom": ["intercom", "intercomcdn"],
            "Zendesk": ["zendesk", "zdassets"],
            "Hotjar": ["hotjar"],
            "Cloudflare": ["cloudflare", "cdnjs.cloudflare"],
        }
        for tech, signals in tech_signals.items():
            if any(sig in html_lower for sig in signals):
                technologies.append(tech)

        # Social profiles
        social_profiles = {}
        social_patterns = {
            "facebook": r'(?:facebook\.com|fb\.com)/([a-zA-Z0-9._-]+)',
            "twitter": r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)',
            "instagram": r'instagram\.com/([a-zA-Z0-9._]+)',
            "linkedin": r'linkedin\.com/(?:company|in)/([a-zA-Z0-9._-]+)',
            "youtube": r'youtube\.com/(?:c/|channel/|@)([a-zA-Z0-9._-]+)',
            "tiktok": r'tiktok\.com/@([a-zA-Z0-9._]+)',
            "pinterest": r'pinterest\.com/([a-zA-Z0-9._]+)',
        }
        for platform, pattern in social_patterns.items():
            match = re.search(pattern, html)
            if match:
                social_profiles[platform] = match.group(1)

        # Emails
        emails = list(set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)))
        emails = [e for e in emails if not any(x in e for x in ["example.com", "sentry", "wixpress", "shopify", "schema.org"])][:5]

        # Phones
        phones = list(set(re.findall(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{4,6}', html)))
        phones = [p.strip() for p in phones if len(p.strip()) >= 10][:3]

        # Company size
        company_size = "Unknown"
        if any(w in html_lower for w in ["enterprise", "fortune 500", "global team"]):
            company_size = "Enterprise (500+)"
        elif any(w in html_lower for w in ["growing team", "series", "funded"]):
            company_size = "Mid-Market (50-500)"
        elif any(w in html_lower for w in ["small team", "startup", "founded by"]):
            company_size = "Small Business (1-50)"

        # Industry detection
        industry = "General"
        industry_signals = {
            "E-commerce": ["shop", "cart", "buy now", "add to cart", "product"],
            "SaaS": ["software", "platform", "api", "dashboard", "subscription"],
            "Healthcare": ["health", "medical", "patient", "clinic"],
            "Finance": ["financial", "banking", "investment", "insurance"],
            "Education": ["education", "learning", "course", "student"],
            "Real Estate": ["property", "real estate", "listing", "mortgage"],
            "Beauty": ["beauty", "salon", "spa", "cosmetic", "skincare", "hair care"],
            "Restaurant": ["menu", "restaurant", "dine", "reservation"],
            "Fitness": ["fitness", "gym", "workout", "training"],
        }
        for ind, signals in industry_signals.items():
            if sum(1 for s in signals if s in html_lower) >= 2:
                industry = ind
                break

        # Reviews from structured data
        reviews = []
        ld_jsons = response.css('script[type="application/ld+json"]::text').getall()
        for ld in ld_jsons:
            try:
                data = json.loads(ld)
                if isinstance(data, dict) and "aggregateRating" in data:
                    reviews.append({
                        "source": "Website",
                        "rating": float(data["aggregateRating"].get("ratingValue", 0)),
                        "summary": f"{data['aggregateRating'].get('reviewCount', 0)} reviews",
                    })
            except (json.JSONDecodeError, ValueError):
                pass

        # Founded year from copyright
        founded_year = None
        copyright_match = re.search(r'(?:copyright|©)\s*(\d{4})', html_lower)
        if copyright_match:
            year = int(copyright_match.group(1))
            if 1980 <= year <= 2026:
                founded_year = year

        return {
            "success": True,
            "domain": domain,
            "enrichedData": {
                "companyName": title.split("|")[0].split("-")[0].split("–")[0].strip() if title else domain,
                "description": description[:300],
                "companySize": company_size,
                "foundedYear": founded_year,
                "industry": industry,
                "technologies": technologies,
                "socialProfiles": social_profiles,
                "emails": emails,
                "phones": phones,
                "reviews": reviews,
                "pageSize": len(html),
                "hasEcommerce": any(t in technologies for t in ["Shopify", "Stripe", "PayPal"]),
                "hasCRM": any(t in technologies for t in ["HubSpot", "Salesforce"]),
                "hasAnalytics": any(t in technologies for t in ["Google Analytics", "Google Tag Manager", "Hotjar"]),
            },
        }
    except Exception as e:
        return {
            "success": False,
            "domain": domain,
            "error": str(e),
            "enrichedData": {
                "companyName": domain.split(".")[0].title(),
                "description": "",
                "companySize": "Unknown",
                "foundedYear": None,
                "industry": "Unknown",
                "technologies": [],
                "socialProfiles": {},
                "emails": [],
                "phones": [],
                "reviews": [],
                "pageSize": 0,
                "hasEcommerce": False,
                "hasCRM": False,
                "hasAnalytics": False,
            },
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrapling-data-enrichment.py <domain>"}))
        sys.exit(1)

    result = enrich_business(sys.argv[1])
    print(json.dumps(result))
