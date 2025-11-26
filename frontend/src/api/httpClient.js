export async function httpRequest(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) throw new Error(data?.detail || data?.error || "Request failed");

  return data;
}
