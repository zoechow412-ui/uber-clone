import http from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPassengerCore } from "./core.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const core = createPassengerCore(
  process.env.ANXIN_DB || join(root, "backend", "data", "passenger.sqlite"),
  {
    version: process.env.FARE_VERSION,
    minimum_hkd: process.env.FARE_MIN_HKD,
    per_15_minutes_hkd: process.env.FARE_PER_15_HKD,
    night_hkd: process.env.FARE_NIGHT_HKD,
  },
);
if (process.env.SEED_DEMO === "1" && process.env.NODE_ENV !== "production") {
  if (
    !core.db
      .prepare("SELECT 1 FROM customers WHERE email=?")
      .get("customer@demo.local")
  )
    core.register({
      name: "測試乘客",
      email: "customer@demo.local",
      password: "DemoPass123!",
    });
}
function originHeaders(req) {
  const origin = req.headers.origin || "";
  const allowed =
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    origin === process.env.CORS_ORIGIN;
  return allowed
    ? {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      }
    : {};
}
function json(req, res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...originHeaders(req),
  });
  res.end(JSON.stringify(value));
}
async function readJson(req) {
  let chunks = [],
    size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200000)
      throw Object.assign(new Error("資料過大"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    throw Object.assign(new Error("資料格式不正確"), { status: 400 });
  }
}
const bearer = (req) =>
  String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
const customer = (req) => core.authenticate(bearer(req));
const handler = async (req, res) => {
  const path = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  ).pathname;
  const method = req.method;
  if (method === "OPTIONS") {
    res.writeHead(204, originHeaders(req));
    res.end();
    return;
  }
  try {
    if (method === "GET" && path === "/api/health")
      return json(req, res, 200, {
        ok: true,
        app: "安心代駕乘客 API",
        mode: process.env.SEED_DEMO === "1" ? "local-demo" : "configured",
        payments_ready: false,
        dispatch_ready: false,
      });
    if (method === "GET" && path === "/api/pricing")
      return json(req, res, 200, core.pricing);
    if (method === "POST" && path === "/api/customers/register")
      return json(req, res, 201, core.register(await readJson(req)));
    if (method === "POST" && path === "/api/customers/login") {
      const body = await readJson(req);
      return json(req, res, 200, core.login(body.email, body.password));
    }
    if (method === "GET" && path === "/api/me")
      return json(req, res, 200, customer(req));
    if (method === "POST" && path === "/api/logout") {
      customer(req);
      return json(req, res, 200, core.logout(bearer(req)));
    }
    if (method === "GET" && path === "/api/vehicles")
      return json(req, res, 200, core.listVehicles(customer(req)));
    if (method === "POST" && path === "/api/vehicles")
      return json(
        req,
        res,
        201,
        core.saveVehicle(customer(req), await readJson(req)),
      );
    let match = path.match(/^\/api\/vehicles\/(\d+)$/);
    if (method === "PUT" && match)
      return json(
        req,
        res,
        200,
        core.saveVehicle(customer(req), await readJson(req), Number(match[1])),
      );
    if (method === "DELETE" && match)
      return json(
        req,
        res,
        200,
        core.deleteVehicle(customer(req), Number(match[1])),
      );
    if (method === "GET" && path === "/api/locations")
      return json(req, res, 200, core.listLocations(customer(req)));
    if (method === "POST" && path === "/api/locations")
      return json(
        req,
        res,
        201,
        core.saveLocation(customer(req), await readJson(req)),
      );
    match = path.match(/^\/api\/locations\/(\d+)$/);
    if (method === "DELETE" && match)
      return json(
        req,
        res,
        200,
        core.deleteLocation(customer(req), Number(match[1])),
      );
    if (method === "POST" && path === "/api/quote") {
      customer(req);
      return json(req, res, 200, core.quote(await readJson(req)));
    }
    if (method === "GET" && path === "/api/bookings")
      return json(req, res, 200, core.listBookings(customer(req)));
    if (method === "POST" && path === "/api/bookings")
      return json(
        req,
        res,
        201,
        core.createBooking(customer(req), await readJson(req)),
      );
    match = path.match(/^\/api\/bookings\/(\d+)$/);
    if (method === "GET" && match)
      return json(req, res, 200, core.booking(customer(req), Number(match[1])));
    match = path.match(/^\/api\/bookings\/(\d+)\/events$/);
    if (method === "GET" && match)
      return json(req, res, 200, core.events(customer(req), Number(match[1])));
    match = path.match(/^\/api\/bookings\/(\d+)\/cancel$/);
    if (method === "POST" && match)
      return json(
        req,
        res,
        200,
        core.cancelBooking(customer(req), Number(match[1])),
      );
    return json(req, res, 404, { error: "找不到此功能" });
  } catch (error) {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    return json(req, res, status, {
      error: status === 500 ? "服務暫時出錯" : error.message,
    });
  }
};
const port = Number(process.env.API_PORT || 8094),
  host = process.env.API_HOST || "127.0.0.1";
const server = http.createServer(handler);
server.listen(port, host, () =>
  console.log(`安心代駕乘客 API http://${host}:${port}`),
);
export { server, core };
