import { NextResponse } from "next/server";

interface LeadSearchRequest {
  city?: string;
  zipcode?: string;
  address?: string;
  category?: string;
}

const LEADS_DB = [
  {
    id: "lead_1",
    name: "TechHub Solutions",
    category: "Software",
    address: "123 Main St",
    city: "San Francisco",
    zipcode: "94102",
    phone: "(415) 555-0100",
    website: "techhub.com",
    employees: 25,
    revenue: 500000,
    hasFunnel: false,
  },
  {
    id: "lead_2",
    name: "Sweet Bakery Co",
    category: "Food",
    address: "456 Oak Ave",
    city: "San Francisco",
    zipcode: "94102",
    phone: "(415) 555-0101",
    website: "sweetbakery.com",
    employees: 8,
    revenue: 200000,
    hasFunnel: false,
  },
  {
    id: "lead_3",
    name: "FitLife Gym",
    category: "Fitness",
    address: "789 Park Blvd",
    city: "San Francisco",
    zipcode: "94102",
    phone: "(415) 555-0102",
    website: "fitlifegym.com",
    employees: 15,
    revenue: 350000,
    hasFunnel: false,
  },
  {
    id: "lead_4",
    name: "Digital Marketing Pro",
    category: "Marketing",
    address: "321 Market St",
    city: "Los Angeles",
    zipcode: "90001",
    phone: "(213) 555-0103",
    website: "dmkpro.com",
    employees: 12,
    revenue: 400000,
    hasFunnel: true,
  },
  {
    id: "lead_5",
    name: "Cloud Consulting Inc",
    category: "Consulting",
    address: "654 Commerce St",
    city: "New York",
    zipcode: "10001",
    phone: "(212) 555-0104",
    website: "cloudconsult.com",
    employees: 30,
    revenue: 750000,
    hasFunnel: false,
  },
];

export async function POST(req: Request) {
  try {
    const body: LeadSearchRequest = await req.json();
    const { city, zipcode, address, category } = body;

    if (!city && !zipcode && !address) {
      return NextResponse.json(
        { success: false, error: "Provide city, zipcode, or address" },
        { status: 400 }
      );
    }

    let results = LEADS_DB;

    if (city) {
      results = results.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
    }

    if (zipcode) {
      results = results.filter(l => l.zipcode === zipcode);
    }

    if (address) {
      results = results.filter(l => l.address.toLowerCase().includes(address.toLowerCase()));
    }

    if (category) {
      results = results.filter(l => l.category.toLowerCase().includes(category.toLowerCase()));
    }

    const leadsWithoutFunnel = results.filter(l => !l.hasFunnel);

    return NextResponse.json({
      success: true,
      total: leadsWithoutFunnel.length,
      leads: leadsWithoutFunnel,
      message: `Found ${leadsWithoutFunnel.length} leads without sales funnels`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "POST with city, zipcode, or address to find leads without funnels",
  });
}
