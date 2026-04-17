/**
 * API configuration utility
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Prepends the API base URL to a given path if it's not already an absolute URL.
 * 
 * @param path The API endpoint path (e.g., "/api/auth/login")
 * @returns The full API URL
 */
export const getApiUrl = (path: string): string => {
  if (path.startsWith("http")) {
    return path;
  }
  
  // Ensure we don't have double slashes if API_BASE_URL ends with /
  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};

export default { getApiUrl };
