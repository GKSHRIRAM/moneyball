/**
 * Token management — localStorage abstraction.
 */

const ACCESS_KEY = "dealdrop_access_token";
const REFRESH_KEY = "dealdrop_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

interface DecodedToken {
  sub: string;
  role: string;
  exp: number;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    
    // Add Base64 padding to prevent atob DOMException errors on unpadded strings
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    
    // Use decodeURIComponent and escape to handle UTF-8 chars in user names inside the JWT (safely parses to JSON)
    const jsonPayload = decodeURIComponent(
      window
        .atob(padded)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const decoded = JSON.parse(jsonPayload);
    return {
      sub: decoded.sub,
      role: decoded.role,
      exp: decoded.exp,
    };
  } catch (err) {
    console.error("Token decoding failed:", err);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  // Add 10-second buffer
  return Date.now() >= decoded.exp * 1000 - 10_000;
}
