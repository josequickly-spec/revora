#!/usr/bin/env python3
"""Contact Extraction using Scrapling - Extract contacts from business websites"""

import sys
import json
import re

sys.path.insert(0, "C:/Users/jquin/Music/Scrapling-0.4.7")

try:
    from scrapling import Fetcher
except ImportError as e:
    print(json.dumps({"error": f"Scrapling import error: {str(e)}"}))
    sys.exit(1)


def extract_contacts(domain: str) -> dict:
    """Extract contact information from a business website"""
    try:
        base_url = f"https://{domain}" if not domain.startswith("http") else domain

        all_emails = set()
        all_phones = set()
        all_addresses = set()
        employees = []
        social_profiles = {}
        contact_pages = []

        pages_to_check = [
            base_url,
            f"{base_url}/contact",
            f"{base_url}/contact-us",
            f"{base_url}/about",
            f"{base_url}/about-us",
            f"{base_url}/team",
        ]

        for page_url in pages_to_check:
            try:
                response = Fetcher.get(page_url)
                if response.status != 200:
                    continue
                html = response.body.decode("utf-8", errors="ignore")

                # Emails
                found_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
                for email in found_emails:
                    if not any(x in email.lower() for x in ["example.com", "sentry", "wixpress", "shopify.com", "schema.org", "placeholder"]):
                        all_emails.add(email.lower())

                # Phones
                found_phones = re.findall(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{4,6}', html)
                for phone in found_phones:
                    clean = phone.strip()
                    if len(clean) >= 10:
                        all_phones.add(clean)

                # Addresses (US format)
                addr_matches = re.findall(
                    r'\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct)[.,]?\s*(?:Suite|Ste|Apt|#)?\s*\d*[.,]?\s*[\w\s]+,\s*[A-Z]{2}\s+\d{5}',
                    html,
                )
                for addr in addr_matches:
                    all_addresses.add(addr.strip())

                # Structured data
                ld_jsons = response.css('script[type="application/ld+json"]::text').getall()
                for ld in ld_jsons:
                    try:
                        data = json.loads(ld)
                        if isinstance(data, dict):
                            addr = data.get("address", {})
                            if isinstance(addr, dict) and addr.get("streetAddress"):
                                full = f"{addr.get('streetAddress', '')}, {addr.get('addressLocality', '')}, {addr.get('addressRegion', '')} {addr.get('postalCode', '')}"
                                all_addresses.add(full.strip())
                            if data.get("telephone"):
                                all_phones.add(data["telephone"])
                            if data.get("email"):
                                all_emails.add(data["email"].lower())
                    except (json.JSONDecodeError, ValueError):
                        pass

                # Team members from HTML
                team_cards = response.css('[class*="team"] [class*="card"], [class*="member"], [class*="staff"]')
                for card in team_cards[:20]:
                    name = card.css("h3::text, h4::text").get(default="").strip()
                    title = card.css('[class*="title"]::text, [class*="role"]::text, [class*="position"]::text').get(default="").strip()
                    email_link = card.css('a[href^="mailto:"]::attr(href)').get(default="")
                    linkedin = card.css('a[href*="linkedin"]::attr(href)').get(default="")

                    if name and len(name) > 2:
                        emp = {"name": name, "title": title}
                        if email_link:
                            emp["email"] = email_link.replace("mailto:", "").split("?")[0]
                        if linkedin:
                            emp["linkedin"] = linkedin
                        employees.append(emp)

                # Social profiles (from first page only)
                if page_url == base_url:
                    patterns = {
                        "facebook": r'(?:facebook\.com|fb\.com)/([a-zA-Z0-9._-]+)',
                        "twitter": r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)',
                        "instagram": r'instagram\.com/([a-zA-Z0-9._]+)',
                        "linkedin": r'linkedin\.com/(?:company|in)/([a-zA-Z0-9._-]+)',
                        "youtube": r'youtube\.com/(?:c/|channel/|@)([a-zA-Z0-9._-]+)',
                    }
                    for platform, pattern in patterns.items():
                        match = re.search(pattern, html)
                        if match:
                            social_profiles[platform] = match.group(1)

                if found_emails or found_phones:
                    contact_pages.append(page_url)

            except Exception:
                continue

        # Classify decision makers
        decision_titles = ["ceo", "cto", "cfo", "coo", "founder", "co-founder", "president",
                           "director", "vp", "vice president", "head of", "chief", "owner", "partner"]
        decision_makers = []
        regular_employees = []
        for emp in employees:
            if any(dt in emp.get("title", "").lower() for dt in decision_titles):
                decision_makers.append(emp)
            else:
                regular_employees.append(emp)

        contacts = {
            "emails": list(all_emails)[:10],
            "phones": list(all_phones)[:5],
            "addresses": list(all_addresses)[:3],
            "employees": regular_employees[:15],
            "decisionMakers": decision_makers[:10],
            "socialProfiles": social_profiles,
            "contactPages": contact_pages,
        }

        return {
            "success": True,
            "domain": domain,
            "contacts": contacts,
            "totalEmails": len(contacts["emails"]),
            "totalPhones": len(contacts["phones"]),
            "totalEmployees": len(contacts["employees"]) + len(contacts["decisionMakers"]),
            "pagesScanned": len(contact_pages),
        }
    except Exception as e:
        return {
            "success": False,
            "domain": domain,
            "error": str(e),
            "contacts": {"emails": [], "phones": [], "addresses": [], "employees": [], "decisionMakers": [], "socialProfiles": {}, "contactPages": []},
            "totalEmails": 0,
            "totalPhones": 0,
            "totalEmployees": 0,
            "pagesScanned": 0,
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scrapling-contact-extraction.py <domain>"}))
        sys.exit(1)

    result = extract_contacts(sys.argv[1])
    print(json.dumps(result))
