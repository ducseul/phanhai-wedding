const MAX_BODY_BYTES = 821000;
const ACTIONS = new Set(["rsvp", "wish", "photo"]);

function reply(env, data, status = 200, extra = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": env.SITE_ORIGIN,
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

async function readBody(request) {
  if (!request.body || Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) return null;
  let bytes = 0;
  let text = "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

export default {
  async fetch(request, env) {
    const error = (message, status, headers) => reply(env, { ok: false, error: message }, status, headers);
    if (new URL(request.url).pathname !== "/submit" || request.method !== "POST") {
      return error("Yêu cầu không hợp lệ.", 404);
    }
    const origin = request.headers.get("Origin");
    if (origin && origin !== env.SITE_ORIGIN) return error("Vui lòng mở trang thiệp để gửi dữ liệu.", 403);
    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip || !env.WRITE_GATEWAY_SECRET || !env.APPS_SCRIPT_URL) {
      return error("Chưa thể kết nối kho dữ liệu.", 503);
    }
    let body;
    try { body = JSON.parse(await readBody(request)); }
    catch { return error("Dữ liệu gửi không hợp lệ.", 400); }
    if (!body || !ACTIONS.has(body.action)) return error("Dữ liệu gửi không hợp lệ.", 400);
    try {
      const limiter = body.action === "photo" ? env.PHOTO_LIMIT : env.TEXT_LIMIT;
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        return error("Bạn gửi quá nhiều lần. Vui lòng thử lại sau một phút.", 429, { "Retry-After": "60" });
      }
      let upstream = await fetch(env.APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ ...body, gatewaySecret: env.WRITE_GATEWAY_SECRET }),
        redirect: "manual",
        signal: AbortSignal.timeout(35000),
      });
      if (upstream.status === 302 || upstream.status === 303) {
        const location = new URL(upstream.headers.get("Location"));
        if (location.origin !== "https://script.googleusercontent.com") {
          return error("Chưa thể kết nối kho dữ liệu.", 502);
        }
        upstream = await fetch(location, { redirect: "error", signal: AbortSignal.timeout(8000) });
      }
      if (!upstream.ok) return error("Chưa thể kết nối kho dữ liệu.", 502);
      return reply(env, await upstream.json());
    } catch {
      return error("Chưa thể kết nối kho dữ liệu. Vui lòng thử lại.", 502);
    }
  },
};
