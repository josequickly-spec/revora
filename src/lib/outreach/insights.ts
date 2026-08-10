export interface SelectedInsight {
  title: string;
  observation: string;
  evidence: string;
}

export interface OutreachInsights {
  businessId: number;
  insights: SelectedInsight[];
  selectedAt: string;
  approved: boolean;
  approvedBy?: string;
}

const insightsStore = new Map<number, OutreachInsights>();

export function saveSelectedInsights(businessId: number, insights: SelectedInsight[]): OutreachInsights {
  const record: OutreachInsights = {
    businessId,
    insights,
    selectedAt: new Date().toISOString(),
    approved: false,
  };
  insightsStore.set(businessId, record);
  return record;
}

export function getSelectedInsights(businessId: number): OutreachInsights | null {
  return insightsStore.get(businessId) || null;
}

export function approveInsights(businessId: number, approvedBy?: string): boolean {
  const record = insightsStore.get(businessId);
  if (!record) return false;
  
  record.approved = true;
  record.approvedBy = approvedBy;
  return true;
}

export function areInsightsApproved(businessId: number): boolean {
  const record = insightsStore.get(businessId);
  return record?.approved === true;
}
