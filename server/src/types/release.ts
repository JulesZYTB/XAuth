export interface AppRelease {
  id: number;
  app_id: number;
  version: string;
  channel: "stable" | "beta";
  download_url: string;
  checksum: string;
  is_active: boolean;
  is_banned: boolean;
  created_at: string;
}

export type ReleaseChannel = "stable" | "beta";
