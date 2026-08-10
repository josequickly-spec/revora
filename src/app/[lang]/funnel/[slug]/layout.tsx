import type { Metadata } from "next";
import { pool } from "@/lib/postgres";
import { brand } from "@/lib/brand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const language = "en";
  const result = await pool.query(
    "SELECT f.content_json,b.name FROM funnels f JOIN businesses b ON b.id=f.business_id WHERE f.slug=$1",
    [slug]
  ).catch(() => ({ rows: [] }));
  const row = result.rows[0];
  const content = row?.content_json?.translations?.[language] || row?.content_json;
  return {
    title: content?.headline ? `${content.headline} | ${row?.name || brand.name}` : row?.name || brand.name,
    description: content?.subheadline,
    alternates: {
      canonical: `/${language}/funnel/${slug}`,
      languages: { en: `/en/funnel/${slug}` },
    },
  };
}

export default async function LocalizedFunnelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string; slug: string }>;
}) {
  return <div lang="en">{children}</div>;
}
