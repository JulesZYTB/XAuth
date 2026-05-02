export interface License {
  id: number;
  license_key: string;
  license_key_hash?: string;
  hwid?: string;
  hwid_hash?: string;
  expiry_date: Date | string;
  status: "active" | "banned";
  app_id: number;
  variables?: string;
  max_hwids?: number;
  linked_hwids?: string; // JSON string
  ip_lock?: string;
  user_id?: number;
  created_by?: number;
  app_name?: string;
  is_online?: boolean;
}
