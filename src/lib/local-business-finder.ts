export interface LocalBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  zipcode: string;
  phone?: string;
  website?: string;
  rating?: number;
  employees?: number;
  annualRevenue?: number;
  email?: string;
  lat?: number;
  lng?: number;
}

export interface LocalBusinessSearchParams {
  query?: string;
  zipcode?: string;
  city?: string;
  address?: string;
  radius?: number;
  category?: string;
  withoutFunnel?: boolean;
}

// Mock database of local businesses
const LOCAL_BUSINESSES_DB: LocalBusiness[] = [
  {
    id: "lb_1",
    name: "TechHub Solutions",
    category: "Software Development",
    address: "123 Main St",
    city: "San Francisco",
    zipcode: "94102",
    phone: "(415) 555-0100",
    website: "techhub.com",
    rating: 4.8,
    employees: 25,
    annualRevenue: 500000,
    email: "contact@techhub.com",
  },
  {
    id: "lb_2",
    name: "Sweet Bakery Co",
    category: "Food & Beverage",
    address: "456 Oak Ave",
    city: "San Francisco",
    zipcode: "94102",
    phone: "(415) 555-0101",
    website: "sweetbakery.com",
    rating: 4.9,
    employees: 8,
    annualRevenue: 200000,
    email: "hello@sweetbakery.com",
  },
  {
    id: "lb_3",
    name: "FitLife Gym",
    category: "Fitness",
    address: "789 Park Blvd",
    city: "San Francisco",
    zipcode: "94102",
    phone: "(415) 555-0102",
    website: "fitlifegym.com",
    rating: 4.7,
    employees: 15,
    annualRevenue: 350000,
    email: "info@fitlifegym.com",
  },
  {
    id: "lb_4",
    name: "Digital Marketing Pro",
    category: "Marketing Agency",
    address: "321 Market St",
    city: "Los Angeles",
    zipcode: "90001",
    phone: "(213) 555-0103",
    website: "dmkpro.com",
    rating: 4.6,
    employees: 12,
    annualRevenue: 400000,
    email: "contact@dmkpro.com",
  },
  {
    id: "lb_5",
    name: "Cloud Consulting Inc",
    category: "Consulting",
    address: "654 Commerce St",
    city: "New York",
    zipcode: "10001",
    phone: "(212) 555-0104",
    website: "cloudconsult.com",
    rating: 4.9,
    employees: 30,
    annualRevenue: 750000,
    email: "hello@cloudconsult.com",
  },
];

export async function searchLocalBusinesses(
  params: LocalBusinessSearchParams
): Promise<LocalBusiness[]> {
  let results = [...LOCAL_BUSINESSES_DB];

  // Filter by ZIP code
  if (params.zipcode) {
    results = results.filter(b => b.zipcode === params.zipcode);
  }

  // Filter by city
  if (params.city) {
    results = results.filter(b =>
      b.city.toLowerCase().includes(params.city!.toLowerCase())
    );
  }

  // Filter by address
  if (params.address) {
    results = results.filter(b =>
      b.address.toLowerCase().includes(params.address!.toLowerCase())
    );
  }

  // Filter by category
  if (params.category) {
    results = results.filter(b =>
      b.category.toLowerCase().includes(params.category!.toLowerCase())
    );
  }

  // Filter by search query
  if (params.query) {
    const q = params.query.toLowerCase();
    results = results.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  // Filter by without funnel - check if business doesn't have funnel
  if (params.withoutFunnel) {
    results = await filterBusinessesWithoutFunnel(results);
  }

  return results;
}

export async function filterBusinessesWithoutFunnel(
  businesses: LocalBusiness[]
): Promise<LocalBusiness[]> {
  // Import mockData from db
  const { mockData } = require("@/db");

  // Filter businesses that don't have a funnel
  return businesses.filter(business => {
    const existingFunnel = mockData.funnels.find(
      f => f.businessId === parseInt(business.id.replace("lb_", "")) ||
           mockData.businesses.find(b => b.name === business.name && f.businessId === b.id)
    );
    return !existingFunnel;
  });
}

export async function enrichBusinessData(
  business: LocalBusiness
): Promise<LocalBusiness> {
  // In production, this would call:
  // - Google Places API for location details
  // - Hunter.io for email discovery
  // - Company database for revenue estimates
  
  return {
    ...business,
    lat: Math.random() * 180 - 90,
    lng: Math.random() * 360 - 180,
  };
}

export async function getBusinessesByRadius(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<LocalBusiness[]> {
  // In production, calculate actual distance using Haversine formula
  return LOCAL_BUSINESSES_DB.slice(0, 3);
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
