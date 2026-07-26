import { NextResponse } from "next/server";
import { mockData } from "@/db";
import { findEmail, getDomainEmails, verifyEmail } from "@/lib/hunter";
import { getIndustry } from "@/lib/industries";

interface DiscoveryRequest {
  domain: string;
  businessName: string;
  industryType: string;
  contactName?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * POST /api/discovery
 * Automatically discover business details and find contact emails using Hunter.io
 */
export async function POST(req: Request) {
  try {
    const body: DiscoveryRequest = await req.json();
    const { domain, businessName, industryType, contactName, firstName, lastName } = body;

    if (!domain || !businessName) {
      return NextResponse.json(
        { success: false, error: "domain and businessName are required" },
        { status: 400 }
      );
    }

    // Clean domain (remove www, https, etc)
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();

    // Get industry config
    const ind = getIndustry(industryType || "ecommerce");

    // Step 1: Get all emails from the domain using Hunter.io
    console.log(`🔍 Discovering emails for domain: ${cleanDomain}`);
    const domainData = await getDomainEmails(cleanDomain);

    let bestContact = null;

    // Step 2: If we have domain data, find the best contact (CEO/Founder preferred)
    if (domainData?.emails && domainData.emails.length > 0) {
      // Look for CEO, Founder, Director titles
      const priorityTitles = ["ceo", "founder", "director", "owner", "president"];

      const ceoOrders = domainData.emails.sort((a, b) => {
        const aType = a.type?.toLowerCase() || "";
        const bType = b.type?.toLowerCase() || "";

        const aPriority = priorityTitles.some((t) => aType.includes(t)) ? 0 : 1;
        const bPriority = priorityTitles.some((t) => bType.includes(t)) ? 0 : 1;

        if (aPriority !== bPriority) return aPriority - bPriority;
        return b.confidence - a.confidence;
      });

      bestContact = ceoOrders[0];
    }

    // Step 3: If no domain data, try finding specific person
    if (!bestContact && (firstName || lastName)) {
      const fName = firstName || contactName?.split(" ")[0] || "";
      const lName = lastName || contactName?.split(" ")[1] || contactName || "";

      if (fName && lName) {
        console.log(`📧 Finding email for: ${fName} ${lName}`);
        const emailResult = await findEmail(cleanDomain, fName, lName);

        if (emailResult) {
          bestContact = {
            value: emailResult.email,
            type: "discovered",
            confidence: emailResult.confidence,
            sources: emailResult.sources,
          };
        }
      }
    }

    // Step 4: Verify the email if found
    if (bestContact?.value) {
      const isValid = await verifyEmail(bestContact.value);
      if (!isValid) {
        console.warn(`⚠️ Email ${bestContact.value} failed verification`);
      }
    }

    // Step 5: Create business record
    const newBiz = {
      id: Math.max(...mockData.businesses.map((b) => b.id || 0)) + 1,
      name: businessName,
      domain: cleanDomain,
      country: "España", // Default, could be parameterized
      businessType: industryType || "ecommerce",
      niche: ind.defaultNiche,
      monthlyRevenue: 25000, // Default estimate
      platform: ind.defaultPlatform,
      logoUrl: null,
      brandColor: ind.color,
      brandAccent: ind.accent,
      status: "discovered",
      heroOffer: ind.defaultOffer,
      heroPrice: ind.defaultPrice,
      painPoint: ind.defaultPainPoint,
      createdAt: new Date().toISOString(),
    };

    mockData.businesses.push(newBiz);

    // Step 6: Create contact if email found
    let newContact = null;
    if (bestContact?.value) {
      newContact = {
        id: Math.max(...mockData.contacts.map((c) => c.id || 0)) + 1,
        businessId: newBiz.id,
        name: contactName || `${firstName || ""} ${lastName || ""}`.trim() || "Director",
        role: bestContact.type === "discovered" ? "CEO/Founder" : (bestContact.type || "CEO"),
        email: bestContact.value,
        linkedinUrl: "",
        confidenceScore: Math.round((bestContact.confidence || 0) * 100),
        status: "verified",
        createdAt: new Date().toISOString(),
      };

      mockData.contacts.push(newContact);
    }

    // Step 7: Create funnel
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
    const newFunnel = {
      id: Math.max(...mockData.funnels.map((f) => f.id || 0)) + 1,
      businessId: newBiz.id,
      funnelName: `Embudo para ${businessName}`,
      templateType: ind.funnelType,
      headline: ind.funnelHeadline(businessName, ind.defaultOffer),
      subheadline: ind.funnelSubheadline(businessName),
      ctaText: ind.funnelCta,
      offerBadge: ind.funnelBadge,
      bonusOffer: ind.funnelBonus,
      customPrimaryColor: ind.color,
      slug,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    mockData.funnels.push(newFunnel);

    return NextResponse.json({
      success: true,
      business: newBiz,
      contact: newContact,
      funnel: newFunnel,
      emailFound: !!bestContact?.value,
      emailConfidence: bestContact?.confidence || 0,
      message: `✅ Negocio "${businessName}" descubierto automáticamente`,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/discovery
 * Get list of discovered businesses
 */
export async function GET() {
  try {
    const discovered = mockData.businesses.filter((b) => b.status === "discovered");
    return NextResponse.json({
      success: true,
      count: discovered.length,
      businesses: discovered,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
