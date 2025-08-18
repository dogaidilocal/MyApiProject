const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function core(path, { method = "GET", body, headers } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // 204 No Content gibi durumlar
  if (res.status === 204) return null;

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // JSON değilse ham metni döndür
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get: (p, opt) => core(p, { ...(opt || {}), method: "GET" }),
  post: (p, body, opt) => core(p, { ...(opt || {}), method: "POST", body }),
  put: (p, body, opt) => core(p, { ...(opt || {}), method: "PUT", body }),
  del: (p, opt) => core(p, { ...(opt || {}), method: "DELETE" }),
  url: API_URL,
};
