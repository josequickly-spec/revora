import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function saveCampaign(campaign: any) {
  const { data, error } = await supabase
    .from("campaigns")
    .insert([
      {
        business_name: campaign.businessName,
        status: campaign.status,
        analysis: campaign.analysis,
        landing_page: campaign.landingPage,
        email_sequence: campaign.emailSequence,
        video_script: campaign.videoScript,
        ads_strategy: campaign.adsStrategy,
        projections: campaign.projections,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCampaigns(limit = 50) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getCampaign(id: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCampaign(id: string, updates: any) {
  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);

  if (error) throw error;
}

export async function saveCampaignMetrics(campaignId: string, metrics: any) {
  const { data, error } = await supabase
    .from("campaign_metrics")
    .insert([
      {
        campaign_id: campaignId,
        landing_page_views: metrics.landingPageViews || 0,
        email_opens: metrics.emailOpens || 0,
        email_clicks: metrics.emailClicks || 0,
        ad_impressions: metrics.adImpressions || 0,
        ad_clicks: metrics.adClicks || 0,
        conversions: metrics.conversions || 0,
        revenue: metrics.revenue || 0,
        roi: metrics.roi || 0,
        timestamp: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCampaignMetrics(campaignId: string) {
  const { data, error } = await supabase
    .from("campaign_metrics")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}
