import type { Metadata } from "next";
import { pool } from "@/lib/postgres";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const language = lang === "en" ? "en" : "es";
  const result = await pool.query(
    "SELECT f.content_json,b.name FROM funnels f JOIN businesses b ON b.id=f.business_id WHERE f.slug=$1",
    [slug]
  ).catch(() => ({ rows: [] }));
  const row = result.rows[0];
  const content = row?.content_json?.translations?.[language] || row?.content_json;
  return {
    title: content?.headline ? `${content.headline} | ${row?.name || "Revora"}` : row?.name || "Revora",
    description: content?.subheadline,
    alternates: {
      canonical: `/${language}/funnel/${slug}`,
      languages: { es: `/es/funnel/${slug}`, en: `/en/funnel/${slug}` },
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
  const { lang } = await params;
  return <div lang={lang === "en" ? "en" : "es"}>{children}</div>;
}
