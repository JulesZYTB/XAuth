export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: "admin" | "user";
  created_at: Date | string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: "admin" | "user";
}
