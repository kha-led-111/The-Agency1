/**
 * API Utility for authenticated HTTP requests with token auto-attach and refresh logic.
 */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.error("Auto token refresh failed:", err);
  }
  return null;
}

/**
 * Fetch wrapper that automatically appends Bearer Authorization token
 * and handles 401 auto-refresh & retry.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  });

  // Handle 401 Unauthorized via auto-refresh
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials || "include",
      });
    }
  }

  return res;
}

export function getImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim().replace(/\\/g, "/");
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (!trimmed.startsWith("/")) {
    trimmed = "/" + trimmed;
  }
  return trimmed;
}
