const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("datanest_token");

  const headers = {
    ...(options.headers || {}),
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

export default API_URL;