#!/usr/bin/env python3
"""Proposal Data Extraction using Scrapling - Gather personalization data for proposals"""

import sys
import json
import re

sys.path.insert(0, "C:/Users/jquin/Music/Scrapling-0.4.7")

try:
    from scrapling import Fetcher
except ImportError as e:
    print(json.dumps({"error": f"Scrapling import error: {str(e)}"}))
    sys.exit(1)


def extract_proposal_data(domain: str) -> dict:
    """Extract data from a business website to personalize proposals"""
    try:
        url = f"https://{domain}" if not domain.startswith("http") else domain
        response = Fetcher.get(url)
        html = response.body.decode("utf-8", errors="ignore")
        html_lower = html.lower()

        title = response.css("title::text").get(default="")
        description = response.css('meta[name="description"]::attr(content)').get(default="")
        company_name = title.split("|")[0].split("-")[0].split("–")[0].strip() if title else domain

        # Headlines
        headlines = response.css("h1::text, h2::text").getall()
        headlines = [h.strip() for h in headlines if h.strip() and len(h.strip()) > 3][:10]

        # Brand tone
        brand_tone = "Professional"
        if sum(1 for w in ["awesome", "cool", "hey", "fun", "love", "amazing"] if w in html_lower) > 2:
            brand_tone = "Casual & Friendly"
        elif sum(1 for w in ["excellence", "premium", "distinguished", "sophisticated", "refined", "luxury"] if w in html_lower) > 2:
            brand_tone = "Luxury & Premium"

        # Value propositions from hero section
        hero_text = response.css('[class*="hero"] h1::text, [class*="hero"] h2::text, [class*="hero"] p::text, [class*="banner"] h1::text, [class*="banner"] p::text').getall()
        value_props = [t.strip() for t in hero_text if t.strip() and len(t.strip()) > 10][:5]

        # Feature detection
        has_chat = any(w in html_lower for w in ["chat", "intercom", "drift", "zendesk", "crisp", "tawk"])
        has_reviews = any(w in html_lower for w in ["review", "testimonial", "rating"])
        has_blog = bool(response.css('a[href*="blog"], [class*="blog"]').getall())
        has_newsletter = bool(response.css('input[type="email"], [class*="newsletter"], [class*="subscribe"]').getall())
        has_mobile_meta = bool(response.css('meta[name="viewport"]').getall())
        has_ssl = url.startswith("https")
        has_social_proof = has_reviews

        # Pain points based on missing features
        pain_points = []
        if not has_chat:
            pain_points.append("No live chat - missing real-time customer engagement")
        if not has_reviews:
            pain_points.append("No visible reviews/testimonials - lacking social proof")
        if not has_blog:
            pain_points.append("No blog - missing organic SEO opportunities")
        if not has_newsletter:
            pain_points.append("No email capture - losing lead generation potential")
        if not has_mobile_meta:
            pain_points.append("Missing mobile viewport - poor mobile experience likely")

        # Marketing maturity
        tech_count = sum(1 for w in ["analytics", "pixel", "tag manager", "hubspot", "salesforce", "mailchimp", "klaviyo", "hotjar", "gtag", "fbevents"] if w in html_lower)
        if tech_count >= 5:
            marketing_maturity = "Advanced"
        elif tech_count >= 3:
            marketing_maturity = "Intermediate"
        elif tech_count >= 1:
            marketing_maturity = "Basic"
        else:
            marketing_maturity = "Minimal"

        # Suggested services
        suggested_services = []
        if not has_chat:
            suggested_services.append({"service": "Live Chat Integration", "priority": "High", "impact": "Increase conversion by 20-30%"})
        if not has_reviews:
            suggested_services.append({"service": "Review Collection & Display", "priority": "High", "impact": "Build trust, increase conversions 15-20%"})
        if not has_blog:
            suggested_services.append({"service": "Content Marketing Strategy", "priority": "Medium", "impact": "Improve organic traffic 40-60% over 6 months"})
        if not has_newsletter:
            suggested_services.append({"service": "Email Marketing Setup", "priority": "High", "impact": "Build owned audience, reduce ad dependency"})
        if marketing_maturity in ["Minimal", "Basic"]:
            suggested_services.append({"service": "Marketing Analytics Setup", "priority": "Medium", "impact": "Data-driven decisions, optimize ad spend"})

        # Categories
        categories = response.css("nav a::text").getall()
        categories = list(set(c.strip() for c in categories if c.strip() and len(c.strip()) > 2 and len(c.strip()) < 40))[:15]

        # Pricing
        has_pricing = bool(response.css('[class*="price"], [class*="pricing"]').getall())
        prices = response.css('[class*="price"]::text').getall()
        price_range = [p.strip() for p in prices if "$" in p or "€" in p][:5]

        return {
            "success": True,
            "domain": domain,
            "proposalData": {
                "companyName": company_name,
                "description": description[:500],
                "brandTone": brand_tone,
                "valuePropositions": value_props,
                "headlines": headlines,
                "painPoints": pain_points,
                "marketingMaturity": marketing_maturity,
                "suggestedServices": suggested_services,
                "categories": categories,
                "hasPricing": has_pricing,
                "priceRange": price_range,
                "currentFeatures": {
                    "liveChat": has_chat,
                    "reviews": has_reviews,
                    "blog": has_blog,
                    "newsletter": has_newsletter,
                    "mobileOptimized": has_mobile_meta,
                    "ssl": has_ssl,
                    "socialProof": has_social_proof,
                },
                "personalizationPoints": [
                    f"Brand voice: {brand_tone.lower()}",
                    f"Marketing maturity: {marketing_maturity}",
                    f"{len(pain_points)} improvement opportunities identified",
                    f"{len(categories)} navigation categories detected" if categories else "Category structure unclear",
                ],
            },
        }
    except Exception as e:
        return {
            "success": False,
            "domain": domain,
            "error": str(e),
            "proposalData": {
                "companyName": domain.split(".")[0].title(),
                "description": "",
                "brandTone": "Unknown",
                "valuePropositions": [],
                "headlines": [],
                "painPoints": ["Unable to analyze website"],
                "marketingMaturity": "Unknown",
                "suggestedServices": [{"service": "Website Audit", "priority": "High", "impact": "Identify key areas"}],
                "categories": [],
                "hasPricing": False,
                "priceRange": [],
                "currentFeatures": {},
                "personalizationPoints": ["Limited data - manual review recommended"],
            },
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrapling-proposal-data.py <domain>"}))
        sys.exit(1)

    result = extract_proposal_data(sys.argv[1])
    print(json.dumps(result))
