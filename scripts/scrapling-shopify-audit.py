#!/usr/bin/env python3
"""Shopify Store Auditor - Deep analysis for Shopify stores using their public APIs"""

import sys
import json
import re
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser


class SimpleHTMLParser(HTMLParser):
    """Minimal HTML parser to extract tags, attributes, and text."""

    def __init__(self):
        super().__init__()
        self.tags = []
        self.current_tag = None
        self.current_text = []
        self.meta_tags = []
        self.link_tags = []
        self.scripts = []
        self.images = []
        self.h1_texts = []
        self._in_h1 = False
        self._in_title = False
        self.title_text = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "meta":
            self.meta_tags.append(attrs_dict)
        elif tag == "link":
            self.link_tags.append(attrs_dict)
        elif tag == "script" and attrs_dict.get("src"):
            self.scripts.append(attrs_dict["src"])
        elif tag == "img":
            self.images.append(attrs_dict)
        elif tag == "h1":
            self._in_h1 = True
            self.current_text = []
        elif tag == "title":
            self._in_title = True
            self.current_text = []

    def handle_endtag(self, tag):
        if tag == "h1" and self._in_h1:
            self._in_h1 = False
            self.h1_texts.append("".join(self.current_text).strip())
        elif tag == "title" and self._in_title:
            self._in_title = False
            self.title_text = "".join(self.current_text).strip()

    def handle_data(self, data):
        if self._in_h1 or self._in_title:
            self.current_text.append(data)


def fetch(url, timeout=15):
    """Simple HTTP GET with a browser-like User-Agent."""
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/json,*/*",
    })
    resp = urlopen(req, timeout=timeout)
    return resp.status, resp.read().decode("utf-8", errors="ignore")


def audit_shopify_store(domain: str) -> dict:
    """Deep audit of a Shopify store using public endpoints and HTML analysis"""
    try:
        base_url = f"https://{domain}" if not domain.startswith("http") else domain
        base_url = base_url.rstrip("/")

        # 1. Verify it's Shopify and get main page
        status, html = fetch(base_url)
        html_lower = html.lower()

        is_shopify = any(sig in html_lower for sig in ["shopify", "cdn.shopify", "myshopify"])
        if not is_shopify:
            return {
                "success": False,
                "domain": domain,
                "error": "This does not appear to be a Shopify store",
                "isShopify": False,
            }

        # Parse HTML
        parser = SimpleHTMLParser()
        parser.feed(html)

        # 2. Extract products from /products.json
        products = []
        product_stats = {"total": 0, "avgPrice": 0, "minPrice": 0, "maxPrice": 0, "outOfStock": 0, "withImages": 0}
        try:
            prod_status, prod_body = fetch(f"{base_url}/products.json?limit=250")
            if prod_status == 200:
                prod_data = json.loads(prod_body)
                raw_products = prod_data.get("products", [])

                all_prices = []
                for p in raw_products:
                    variants = p.get("variants", [])
                    price = float(variants[0].get("price", "0")) if variants else 0
                    compare_price = variants[0].get("compare_at_price") if variants else None
                    available = any(v.get("available", False) for v in variants) if variants else False
                    images = p.get("images", [])

                    if price > 0:
                        all_prices.append(price)

                    if not available:
                        product_stats["outOfStock"] += 1
                    if images:
                        product_stats["withImages"] += 1

                    products.append({
                        "title": p.get("title", ""),
                        "type": p.get("product_type", ""),
                        "vendor": p.get("vendor", ""),
                        "price": price,
                        "compareAtPrice": float(compare_price) if compare_price else None,
                        "available": available,
                        "variants": len(variants),
                        "images": len(images),
                        "tags": p.get("tags", [])[:5],
                        "createdAt": p.get("created_at", ""),
                    })

                product_stats["total"] = len(products)
                if all_prices:
                    product_stats["avgPrice"] = round(sum(all_prices) / len(all_prices), 2)
                    product_stats["minPrice"] = min(all_prices)
                    product_stats["maxPrice"] = max(all_prices)
        except Exception:
            pass

        # 3. Extract collections from /collections.json
        collections = []
        try:
            col_status, col_body = fetch(f"{base_url}/collections.json")
            if col_status == 200:
                col_data = json.loads(col_body)
                for c in col_data.get("collections", []):
                    collections.append({
                        "title": c.get("title", ""),
                        "handle": c.get("handle", ""),
                        "productsCount": c.get("products_count", 0),
                        "updatedAt": c.get("updated_at", ""),
                    })
        except Exception:
            pass

        # 4. Detect Shopify theme
        theme_name = "Unknown"
        theme_matches = re.findall(r'Shopify\.theme\s*=\s*\{[^}]*"name"\s*:\s*"([^"]+)"', html)
        if theme_matches:
            theme_name = theme_matches[0]
        else:
            theme_matches = re.findall(r'theme[_-]name["\s:]+([^",\}]+)', html_lower)
            if theme_matches:
                theme_name = theme_matches[0].strip().title()

        # 5. Detect installed Shopify apps from script tags and meta
        installed_apps = []
        app_signals = {
            "Klaviyo": ["klaviyo"],
            "Yotpo Reviews": ["yotpo"],
            "Judge.me": ["judge.me"],
            "Loox Reviews": ["loox"],
            "Stamped.io": ["stamped.io"],
            "ReCharge Subscriptions": ["rechargeapps", "recharge"],
            "Bold Subscriptions": ["boldapps", "bold.co"],
            "Privy": ["privy"],
            "Omnisend": ["omnisend"],
            "Shopify Email": ["shopify-email"],
            "Afterpay": ["afterpay"],
            "Klarna": ["klarna"],
            "ShopPay": ["shop-pay", "shoppay"],
            "Affirm": ["affirm"],
            "Sezzle": ["sezzle"],
            "Aftership": ["aftership"],
            "Route": ["routeapp"],
            "PageFly": ["pagefly"],
            "Shogun": ["shogun"],
            "GemPages": ["gempages"],
            "Rebuy": ["rebuy"],
            "Nosto": ["nosto"],
            "LimeSpot": ["limespot"],
            "Back in Stock": ["backinstock", "back-in-stock"],
            "Smile.io Loyalty": ["smile.io"],
            "LoyaltyLion": ["loyaltylion"],
            "Gorgias": ["gorgias"],
            "Tidio": ["tidio"],
            "Zendesk": ["zendesk"],
            "HubSpot": ["hubspot", "hs-scripts"],
            "Google Analytics": ["gtag", "google-analytics"],
            "Google Tag Manager": ["googletagmanager"],
            "Facebook Pixel": ["fbevents", "facebook.com/tr"],
            "TikTok Pixel": ["analytics.tiktok"],
            "Pinterest Tag": ["pintrk", "pinterest"],
            "Snapchat Pixel": ["snaptr"],
            "Hotjar": ["hotjar"],
            "Lucky Orange": ["luckyorange"],
            "Shopify Analytics": ["shopify-analytics"],
            "Wishlist Plus": ["swymrelay", "wishlist"],
            "Product Reviews (Shopify)": ["spr-badge", "shopify-product-reviews"],
        }
        for app_name, signals in app_signals.items():
            if any(sig in html_lower for sig in signals):
                installed_apps.append(app_name)

        # 6. Detect payment methods
        payment_methods = []
        payment_signals = {
            "Shopify Payments": ["shopify-payment", "shopifypay"],
            "PayPal": ["paypal"],
            "Apple Pay": ["apple-pay", "applepay"],
            "Google Pay": ["google-pay", "googlepay"],
            "ShopPay": ["shop-pay", "shoppay"],
            "Afterpay": ["afterpay"],
            "Klarna": ["klarna"],
            "Affirm": ["affirm"],
            "Sezzle": ["sezzle"],
            "Amazon Pay": ["amazonpay", "amazon-pay"],
            "Stripe": ["stripe"],
        }
        for method, signals in payment_signals.items():
            if any(sig in html_lower for sig in signals):
                payment_methods.append(method)

        # 7. SEO analysis
        seo_issues = []
        seo_score = 100

        title = parser.title_text
        description = ""
        canonical = ""
        og_image = ""
        for m in parser.meta_tags:
            if m.get("name", "").lower() == "description":
                description = m.get("content", "")
            if m.get("property", "").lower() == "og:image":
                og_image = m.get("content", "")
        for l in parser.link_tags:
            if l.get("rel", "").lower() == "canonical":
                canonical = l.get("href", "")

        if not title or len(title) < 10:
            seo_issues.append({"issue": "Missing or short page title", "impact": "High", "fix": "Add descriptive title (50-60 chars)"})
            seo_score -= 15
        elif len(title) > 60:
            seo_issues.append({"issue": "Title too long (>60 chars)", "impact": "Medium", "fix": "Shorten to under 60 characters"})
            seo_score -= 5

        if not description:
            seo_issues.append({"issue": "Missing meta description", "impact": "High", "fix": "Add compelling meta description (150-160 chars)"})
            seo_score -= 15
        elif len(description) > 160:
            seo_issues.append({"issue": "Meta description too long", "impact": "Low", "fix": "Trim to 150-160 characters"})
            seo_score -= 3

        if not canonical:
            seo_issues.append({"issue": "Missing canonical URL", "impact": "Medium", "fix": "Add canonical tag to prevent duplicate content"})
            seo_score -= 8

        if not og_image:
            seo_issues.append({"issue": "Missing Open Graph image", "impact": "Medium", "fix": "Add og:image for social sharing"})
            seo_score -= 5

        alt_missing = sum(1 for img in parser.images if not img.get("alt"))
        if alt_missing > 3:
            seo_issues.append({"issue": f"{alt_missing} images missing alt text", "impact": "Medium", "fix": "Add descriptive alt attributes to all product images"})
            seo_score -= 10

        if not parser.h1_texts:
            seo_issues.append({"issue": "No H1 heading found", "impact": "High", "fix": "Add a single H1 tag with main keyword"})
            seo_score -= 10

        # 8. Performance indicators
        page_size_kb = len(html) / 1024
        scripts_count = len(parser.scripts)
        stylesheets_count = sum(1 for l in parser.link_tags if l.get("rel", "").lower() == "stylesheet")
        images_count = len(parser.images)

        performance = {
            "pageSizeKB": round(page_size_kb, 1),
            "scriptsCount": scripts_count,
            "stylesheetsCount": stylesheets_count,
            "imagesCount": images_count,
            "hasLazyLoading": 'loading="lazy"' in html_lower or "lazyload" in html_lower,
            "hasMinifiedAssets": ".min.js" in html_lower or ".min.css" in html_lower,
        }

        perf_issues = []
        if page_size_kb > 500:
            perf_issues.append(f"Large page size ({round(page_size_kb)}KB) - consider optimizing")
        if scripts_count > 20:
            perf_issues.append(f"Too many scripts ({scripts_count}) - may slow page load")
        if images_count > 30 and not performance["hasLazyLoading"]:
            perf_issues.append("Many images without lazy loading detected")

        # 9. Missing app recommendations
        recommendations = []

        if not any(a in installed_apps for a in ["Klaviyo", "Omnisend", "Shopify Email", "Privy"]):
            recommendations.append({
                "category": "Email Marketing",
                "recommendation": "Install Klaviyo or Omnisend",
                "impact": "Recover 5-15% abandoned carts, build customer retention",
                "priority": "Critical",
            })

        if not any(a in installed_apps for a in ["Yotpo Reviews", "Judge.me", "Loox Reviews", "Stamped.io", "Product Reviews (Shopify)"]):
            recommendations.append({
                "category": "Social Proof",
                "recommendation": "Add a reviews app (Judge.me or Loox)",
                "impact": "Increase conversion rate 15-20% with product reviews",
                "priority": "High",
            })

        if not any(a in installed_apps for a in ["Afterpay", "Klarna", "Affirm", "Sezzle"]):
            recommendations.append({
                "category": "Buy Now Pay Later",
                "recommendation": "Add BNPL option (Afterpay/Klarna)",
                "impact": "Increase AOV 20-30%, reduce cart abandonment",
                "priority": "High",
            })

        if not any(a in installed_apps for a in ["Smile.io Loyalty", "LoyaltyLion"]):
            recommendations.append({
                "category": "Customer Retention",
                "recommendation": "Launch a loyalty/rewards program",
                "impact": "Increase repeat purchase rate 25-40%",
                "priority": "Medium",
            })

        if not any(a in installed_apps for a in ["ReCharge Subscriptions", "Bold Subscriptions"]):
            if product_stats["total"] > 5:
                recommendations.append({
                    "category": "Recurring Revenue",
                    "recommendation": "Add subscription option for repeat products",
                    "impact": "Build predictable MRR, increase LTV 2-3x",
                    "priority": "Medium",
                })

        if not any(a in installed_apps for a in ["Rebuy", "Nosto", "LimeSpot"]):
            recommendations.append({
                "category": "Personalization",
                "recommendation": "Add product recommendation engine (Rebuy/Nosto)",
                "impact": "Increase AOV 10-15% with smart upsells",
                "priority": "Medium",
            })

        if not any(a in installed_apps for a in ["Gorgias", "Tidio", "Zendesk"]):
            recommendations.append({
                "category": "Customer Support",
                "recommendation": "Add live chat / helpdesk (Gorgias or Tidio)",
                "impact": "Reduce support response time, increase satisfaction",
                "priority": "Medium",
            })

        if not any(a in installed_apps for a in ["Google Analytics", "Google Tag Manager"]):
            recommendations.append({
                "category": "Analytics",
                "recommendation": "Set up Google Analytics + GTM",
                "impact": "Data-driven decisions, track ROI on marketing spend",
                "priority": "Critical",
            })

        # 10. Shopify plan detection (heuristic)
        shopify_plan = "Unknown"
        if "shopify-plus" in html_lower or "checkout.shopify.com" not in html_lower:
            if len(products) > 100 or "plus" in html_lower:
                shopify_plan = "Shopify Plus (estimated)"
            else:
                shopify_plan = "Basic/Standard Shopify"

        # 11. Currency detection
        currency = "USD"
        currency_match = re.search(r'"currency"\s*:\s*"([A-Z]{3})"', html)
        if currency_match:
            currency = currency_match.group(1)
        elif "€" in html:
            currency = "EUR"
        elif "£" in html:
            currency = "GBP"

        # 12. Social links
        social_profiles = {}
        social_patterns = {
            "facebook": r'(?:facebook\.com|fb\.com)/([a-zA-Z0-9._-]+)',
            "instagram": r'instagram\.com/([a-zA-Z0-9._]+)',
            "twitter": r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)',
            "tiktok": r'tiktok\.com/@([a-zA-Z0-9._]+)',
            "youtube": r'youtube\.com/(?:c/|channel/|@)([a-zA-Z0-9._-]+)',
            "pinterest": r'pinterest\.com/([a-zA-Z0-9._]+)',
        }
        for platform, pattern in social_patterns.items():
            match = re.search(pattern, html)
            if match:
                social_profiles[platform] = match.group(1)

        # Product types breakdown
        product_types = {}
        for p in products:
            pt = p["type"] or "Uncategorized"
            product_types[pt] = product_types.get(pt, 0) + 1

        # Vendors breakdown
        vendors = {}
        for p in products:
            v = p["vendor"] or "Unknown"
            vendors[v] = vendors.get(v, 0) + 1

        # Price tiers
        price_tiers = {"under25": 0, "25to50": 0, "50to100": 0, "100to200": 0, "over200": 0}
        for p in products:
            pr = p["price"]
            if pr <= 0:
                continue
            elif pr < 25:
                price_tiers["under25"] += 1
            elif pr < 50:
                price_tiers["25to50"] += 1
            elif pr < 100:
                price_tiers["50to100"] += 1
            elif pr < 200:
                price_tiers["100to200"] += 1
            else:
                price_tiers["over200"] += 1

        # Calculate overall store score
        store_score = 50
        if product_stats["total"] > 0:
            store_score += 5
        if product_stats["total"] > 20:
            store_score += 5
        if collections:
            store_score += 5
        if len(installed_apps) > 5:
            store_score += 10
        elif len(installed_apps) > 2:
            store_score += 5
        if len(payment_methods) > 2:
            store_score += 5
        if social_profiles:
            store_score += 5
        if not seo_issues:
            store_score += 10
        elif len(seo_issues) <= 2:
            store_score += 5
        if not perf_issues:
            store_score += 5
        store_score = min(100, store_score)

        return {
            "success": True,
            "isShopify": True,
            "domain": domain,
            "storeScore": store_score,
            "shopifyPlan": shopify_plan,
            "currency": currency,
            "theme": theme_name,
            "products": {
                "stats": product_stats,
                "topProducts": products[:10],
                "types": product_types,
                "vendors": vendors,
                "priceTiers": price_tiers,
            },
            "collections": collections[:20],
            "installedApps": installed_apps,
            "paymentMethods": payment_methods,
            "seo": {
                "score": max(0, seo_score),
                "title": title,
                "description": description[:200],
                "issues": seo_issues,
            },
            "performance": {**performance, "issues": perf_issues},
            "socialProfiles": social_profiles,
            "recommendations": recommendations,
        }
    except HTTPError as e:
        return {
            "success": False,
            "domain": domain,
            "error": f"HTTP {e.code}: {e.reason}",
            "isShopify": False,
        }
    except URLError as e:
        return {
            "success": False,
            "domain": domain,
            "error": f"Connection error: {str(e.reason)}",
            "isShopify": False,
        }
    except Exception as e:
        return {
            "success": False,
            "domain": domain,
            "error": str(e),
            "isShopify": False,
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrapling-shopify-audit.py <domain>"}))
        sys.exit(1)

    result = audit_shopify_store(sys.argv[1])
    print(json.dumps(result))
