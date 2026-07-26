import { NextResponse } from "next/server";

interface RevenueShareRequest {
  businessName: string;
  monthlyRevenue: number;
  comissionPercentage: number;
}

export async function POST(req: Request) {
  try {
    const body: RevenueShareRequest = await req.json();
    const { businessName, monthlyRevenue, comissionPercentage } = body;

    const monthlyCommission = (monthlyRevenue * comissionPercentage) / 100;
    const yearlyCommission = monthlyCommission * 12;

    const analytics = {
      businessName,
      monthlyRevenue,
      comissionPercentage,
      monthlyCommission: Math.round(monthlyCommission),
      yearlyCommission: Math.round(yearlyCommission),
      projections: {
        month3: Math.round(monthlyCommission * 1.2 * 3),
        month6: Math.round(monthlyCommission * 1.4 * 6),
        month12: Math.round(monthlyCommission * 1.6 * 12),
      },
      status: "active",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      revenueShare: analytics,
      message: `Revenue-share dashboard para ${businessName}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Revenue-share API endpoint",
  });
}
