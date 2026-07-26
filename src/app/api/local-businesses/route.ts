import { NextResponse } from "next/server";
import { searchLocalBusinesses, enrichBusinessData } from "@/lib/local-business-finder";

interface LocalBusinessSearchRequest {
  query?: string;
  zipcode?: string;
  city?: string;
  address?: string;
  category?: string;
  withoutFunnel?: boolean;
}

export async function POST(req: Request) {
  try {
    const body: LocalBusinessSearchRequest = await req.json();
    const { query, zipcode, city, address, category, withoutFunnel } = body;

    if (!query && !zipcode && !city && !address) {
      return NextResponse.json(
        { success: false, error: "Provide at least one search parameter (query, zipcode, city, or address)" },
        { status: 400 }
      );
    }

    console.log(`Searching local businesses: ${JSON.stringify(body)}`);

    const businesses = await searchLocalBusinesses({
      query,
      zipcode,
      city,
      address,
      category,
      withoutFunnel,
    });

    if (businesses.length === 0) {
      return NextResponse.json({
        success: true,
        businesses: [],
        message: `No businesses found matching: ${query || zipcode || city || address}`,
      });
    }

    // Enrich data with additional details
    const enrichedBusinesses = await Promise.all(
      businesses.map(b => enrichBusinessData(b))
    );

    return NextResponse.json({
      success: true,
      count: enrichedBusinesses.length,
      businesses: enrichedBusinesses,
      message: `Found ${enrichedBusinesses.length} local businesses`,
    });
  } catch (error) {
    console.error("Local business search error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error searching businesses" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Use POST with search parameters: query, zipcode, city, address, category",
  });
}
