window.weddingApi = async function (action, body, params = {}) {
  const endpoint = window.WEDDING.sheetsEndpoint;
  if (!endpoint) throw new Error("Thiệp đang kết nối kho dữ liệu. Vui lòng thử lại sau.");
  const url = new URL(endpoint);
  if (!body) url.search = new URLSearchParams({ action, ...params });
  let response, result;
  try {
    response = await fetch(url, body ? {
      method: "POST",
      body: JSON.stringify({ ...body, action }),
      credentials: "omit",
      signal: AbortSignal.timeout(45000),
    } : { credentials: "omit", signal: AbortSignal.timeout(45000) });
    result = await response.json();
  } catch {
    throw new Error("Chưa kết nối được kho dữ liệu. Vui lòng thử lại.");
  }
  if (!response.ok || !result.ok) throw new Error(result.error || "Có lỗi xảy ra, vui lòng thử lại.");
  return result.data;
};
