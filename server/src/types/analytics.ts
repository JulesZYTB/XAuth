export interface ValidationLog {
  id: number;
  license_id?: number;
  app_id: number;
  ip_address: string;
  country: string;
  country_code: string;
  status: "success" | "failed";
  error_type?: string;
  created_at: string;
}

export interface AnalyticsStats {
  mapData: { country: string; value: number }[];
  dauData: { date: string; count: number }[];
  anomalyData: { timestamp: string; successes: number; failures: number }[];
}
