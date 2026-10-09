import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const fail = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
const now = () => new Date().toISOString();
const hk = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= 22.15 &&
  lat <= 22.62 &&
  lng >= 113.8 &&
  lng <= 114.5;
const text = (value, max = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const email = (value) => text(value, 254).toLowerCase();
const passwordHash = (password, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const passwordMatches = (password, stored) => {
  const [salt, digest] = stored.split(":");
  const a = scryptSync(password, salt, 64),
    b = Buffer.from(digest, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
};
const validDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T23:59:59+08:00");
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toLocaleDateString("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }) === date &&
    parsed.getTime() > Date.now()
  );
};

export function createPassengerCore(file = ":memory:", configuration = {}) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),expires_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS customer_vehicles(id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),plate TEXT NOT NULL,make TEXT NOT NULL,model TEXT NOT NULL,transmission TEXT NOT NULL CHECK(transmission IN ('auto','manual')),requirements TEXT NOT NULL DEFAULT '',existing_damage TEXT NOT NULL DEFAULT '',insurance_company TEXT NOT NULL DEFAULT '',insurance_reference TEXT NOT NULL DEFAULT '',insurance_expiry TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(customer_id,plate));
    CREATE TABLE IF NOT EXISTS saved_locations(id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),label TEXT NOT NULL,address TEXT NOT NULL,latitude REAL,longitude REAL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES customers(id),vehicle_id INTEGER NOT NULL REFERENCES customer_vehicles(id),pickup TEXT NOT NULL,destination TEXT NOT NULL,pickup_lat REAL,pickup_lng REAL,dest_lat REAL,dest_lng REAL,trip_type TEXT NOT NULL CHECK(trip_type IN ('now','scheduled')),scheduled_at TEXT,estimate_minutes INTEGER NOT NULL,estimate_source TEXT NOT NULL,fare_hkd INTEGER NOT NULL,pricing_version TEXT NOT NULL,night_surcharge INTEGER NOT NULL,payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','fps')),payment_status TEXT NOT NULL DEFAULT 'pending',status TEXT NOT NULL DEFAULT 'awaiting_arrangement',owner_authorized INTEGER NOT NULL,insurance_confirmed INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS booking_events(id INTEGER PRIMARY KEY,booking_id INTEGER NOT NULL REFERENCES bookings(id),event TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY,booking_id INTEGER NOT NULL REFERENCES bookings(id),method TEXT NOT NULL,status TEXT NOT NULL,amount_hkd INTEGER NOT NULL,created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS bookings_customer ON bookings(customer_id,created_at);
    CREATE INDEX IF NOT EXISTS locations_customer ON saved_locations(customer_id);
  `);
  const q = (sql) => db.prepare(sql);
  const pricing = {
    version: text(configuration.version || "test-v1", 30),
    minimum_hkd: Number(configuration.minimum_hkd ?? 200),
    per_15_minutes_hkd: Number(configuration.per_15_minutes_hkd ?? 60),
    night_hkd: Number(configuration.night_hkd ?? 60),
    minutes_step: 15,
    estimate_source: "manual",
    approved: false,
  };
  if (
    !Number.isInteger(pricing.minimum_hkd) ||
    pricing.minimum_hkd < 0 ||
    !Number.isInteger(pricing.per_15_minutes_hkd) ||
    pricing.per_15_minutes_hkd < 0 ||
    !Number.isInteger(pricing.night_hkd) ||
    pricing.night_hkd < 0
  )
    throw Error("收費設定無效");

  function register(data) {
    const name = text(data.name, 100),
      mail = email(data.email),
      secret = String(data.password || "");
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || secret.length < 10)
      fail("請填寫姓名、有效電郵及最少 10 字元密碼");
    try {
      const id = Number(
        q(
          "INSERT INTO customers(name,email,password_hash,created_at) VALUES(?,?,?,?)",
        ).run(name, mail, passwordHash(secret), now()).lastInsertRowid,
      );
      return { id, name, email: mail };
    } catch (error) {
      if (String(error).includes("UNIQUE")) fail("此電郵已登記", 409);
      throw error;
    }
  }
  function login(mail, secret) {
    const customer = q("SELECT * FROM customers WHERE email=?").get(
      email(mail),
    );
    if (
      !customer ||
      !passwordMatches(String(secret || ""), customer.password_hash)
    )
      fail("電郵或密碼不正確", 401);
    const token = randomBytes(32).toString("hex");
    q("INSERT INTO sessions(token,customer_id,expires_at) VALUES(?,?,?)").run(
      token,
      customer.id,
      new Date(Date.now() + 7 * 86400000).toISOString(),
    );
    return {
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    };
  }
  function authenticate(token) {
    const customer = q(
      "SELECT customers.id,customers.name,customers.email FROM sessions JOIN customers ON customers.id=sessions.customer_id WHERE token=? AND expires_at>?",
    ).get(token || "", now());
    if (!customer) fail("請先登入", 401);
    return customer;
  }
  function logout(token) {
    q("DELETE FROM sessions WHERE token=?").run(token);
    return { ok: true };
  }

  function validateVehicle(data) {
    const plate = text(data.plate, 12).toUpperCase().replace(/\s+/g, "");
    const make = text(data.make, 80),
      model = text(data.model, 80),
      transmission = data.transmission;
    const insurance_expiry = text(data.insurance_expiry, 10);
    if (
      !/^[A-Z0-9-]{2,10}$/.test(plate) ||
      !make ||
      !model ||
      !["auto", "manual"].includes(transmission)
    )
      fail("請填寫有效車牌、品牌、型號及波箱");
    if (!validDate(insurance_expiry)) fail("保險到期日無效或已過期");
    return {
      plate,
      make,
      model,
      transmission,
      requirements: text(data.requirements, 500),
      existing_damage: text(data.existing_damage, 1000),
      insurance_company: text(data.insurance_company, 100),
      insurance_reference: text(data.insurance_reference, 100),
      insurance_expiry,
    };
  }
  function vehicle(customerId, id) {
    return q(
      "SELECT * FROM customer_vehicles WHERE id=? AND customer_id=?",
    ).get(id, customerId);
  }
  function listVehicles(customer) {
    return q(
      "SELECT * FROM customer_vehicles WHERE customer_id=? ORDER BY id DESC",
    ).all(customer.id);
  }
  function saveVehicle(customer, data, id = null) {
    const item = validateVehicle(data);
    try {
      if (id) {
        if (!vehicle(customer.id, id)) fail("找不到你的車輛", 404);
        q(
          "UPDATE customer_vehicles SET plate=?,make=?,model=?,transmission=?,requirements=?,existing_damage=?,insurance_company=?,insurance_reference=?,insurance_expiry=? WHERE id=? AND customer_id=?",
        ).run(
          item.plate,
          item.make,
          item.model,
          item.transmission,
          item.requirements,
          item.existing_damage,
          item.insurance_company,
          item.insurance_reference,
          item.insurance_expiry,
          id,
          customer.id,
        );
      } else
        id = Number(
          q(
            "INSERT INTO customer_vehicles(customer_id,plate,make,model,transmission,requirements,existing_damage,insurance_company,insurance_reference,insurance_expiry,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
          ).run(
            customer.id,
            item.plate,
            item.make,
            item.model,
            item.transmission,
            item.requirements,
            item.existing_damage,
            item.insurance_company,
            item.insurance_reference,
            item.insurance_expiry,
            now(),
          ).lastInsertRowid,
        );
      return vehicle(customer.id, id);
    } catch (error) {
      if (String(error).includes("UNIQUE")) fail("此車牌已登記", 409);
      throw error;
    }
  }
  function deleteVehicle(customer, id) {
    if (!vehicle(customer.id, id)) fail("找不到你的車輛", 404);
    if (q("SELECT 1 FROM bookings WHERE vehicle_id=?").get(id))
      fail("已有訂單的車輛不能刪除", 409);
    q("DELETE FROM customer_vehicles WHERE id=? AND customer_id=?").run(
      id,
      customer.id,
    );
    return { ok: true };
  }
  function listLocations(customer) {
    return q(
      "SELECT * FROM saved_locations WHERE customer_id=? ORDER BY id DESC",
    ).all(customer.id);
  }
  function saveLocation(customer, data) {
    const label = text(data.label, 40),
      address = text(data.address, 200);
    if (!label || address.length < 2) fail("請填寫地點名稱及香港地址");
    const lat = data.latitude == null ? null : Number(data.latitude),
      lng = data.longitude == null ? null : Number(data.longitude);
    if ((lat != null || lng != null) && !hk(lat, lng))
      fail("地圖位置必須喺香港境內");
    const id = Number(
      q(
        "INSERT INTO saved_locations(customer_id,label,address,latitude,longitude,created_at) VALUES(?,?,?,?,?,?)",
      ).run(customer.id, label, address, lat, lng, now()).lastInsertRowid,
    );
    return q("SELECT * FROM saved_locations WHERE id=?").get(id);
  }
  function deleteLocation(customer, id) {
    const changed = q(
      "DELETE FROM saved_locations WHERE id=? AND customer_id=?",
    ).run(id, customer.id);
    if (!changed.changes) fail("找不到你的常用地址", 404);
    return { ok: true };
  }

  function quote(data) {
    const minutes = Number(data.estimate_minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720)
      fail("請選擇 1 至 720 分鐘的手動預計時間");
    const night = data.night_surcharge === true;
    const amount =
      Math.max(
        pricing.minimum_hkd,
        Math.ceil(minutes / pricing.minutes_step) * pricing.per_15_minutes_hkd,
      ) + (night ? pricing.night_hkd : 0);
    return {
      fare_hkd: amount,
      estimate_minutes: minutes,
      estimate_source: "manual",
      night_surcharge: night,
      pricing_version: pricing.version,
      pricing,
    };
  }
  const bookingColumns =
    "bookings.*,customer_vehicles.plate,customer_vehicles.make,customer_vehicles.model,customer_vehicles.transmission";
  const bookingJoin =
    " FROM bookings JOIN customer_vehicles ON customer_vehicles.id=bookings.vehicle_id ";
  function booking(customer, id) {
    const item = q(
      "SELECT " +
        bookingColumns +
        bookingJoin +
        " WHERE bookings.id=? AND bookings.customer_id=?",
    ).get(id, customer.id);
    if (!item) fail("找不到你的訂單", 404);
    return item;
  }
  function listBookings(customer) {
    return q(
      "SELECT " +
        bookingColumns +
        bookingJoin +
        " WHERE bookings.customer_id=? ORDER BY bookings.id DESC",
    ).all(customer.id);
  }
  function events(customer, id) {
    booking(customer, id);
    return q(
      "SELECT event,created_at FROM booking_events WHERE booking_id=? ORDER BY id",
    ).all(id);
  }
  function createBooking(customer, data) {
    const car = vehicle(customer.id, Number(data.vehicle_id));
    if (!car) fail("車輛不屬於你", 403);
    const pickup = text(data.pickup, 200),
      destination = text(data.destination, 200);
    if (pickup.length < 2 || destination.length < 2 || pickup === destination)
      fail("請填寫唔同嘅接車地點同目的地");
    const trip_type = data.trip_type;
    if (!["now", "scheduled"].includes(trip_type)) fail("請選擇即時或預約代駕");
    const scheduled_at =
      trip_type === "scheduled" ? String(data.scheduled_at || "") : null;
    if (
      trip_type === "scheduled" &&
      (!Number.isFinite(Date.parse(scheduled_at)) ||
        Date.parse(scheduled_at) <= Date.now())
    )
      fail("預約時間必須係將來有效時間");
    if (data.owner_authorized !== true || data.insurance_confirmed !== true)
      fail("請先確認車主授權及保險聲明");
    if (!validDate(car.insurance_expiry)) fail("車輛保險已過期");
    const method = data.payment_method;
    if (!["cash", "fps"].includes(method)) fail("目前只可選現金或轉數快待確認");
    const coordinateKeys = ["pickup_lat", "pickup_lng", "dest_lat", "dest_lng"];
    const coordinates = coordinateKeys.map((key) =>
      data[key] == null ? null : Number(data[key]),
    );
    if (
      coordinates.some((value) => value != null) &&
      (!hk(coordinates[0], coordinates[1]) ||
        !hk(coordinates[2], coordinates[3]))
    )
      fail("請選擇香港境內地圖位置；或清空座標改用手動地址");
    const estimate = quote(data),
      at = now();
    const id = Number(
      q(
        "INSERT INTO bookings(customer_id,vehicle_id,pickup,destination,pickup_lat,pickup_lng,dest_lat,dest_lng,trip_type,scheduled_at,estimate_minutes,estimate_source,fare_hkd,pricing_version,night_surcharge,payment_method,owner_authorized,insurance_confirmed,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        customer.id,
        car.id,
        pickup,
        destination,
        ...coordinates,
        trip_type,
        scheduled_at,
        estimate.estimate_minutes,
        estimate.estimate_source,
        estimate.fare_hkd,
        estimate.pricing_version,
        estimate.night_surcharge ? 1 : 0,
        method,
        1,
        1,
        at,
        at,
      ).lastInsertRowid,
    );
    q(
      "INSERT INTO booking_events(booking_id,event,created_at) VALUES(?,?,?)",
    ).run(id, "建立測試訂單，等待安排司機", at);
    q(
      "INSERT INTO payments(booking_id,method,status,amount_hkd,created_at) VALUES(?,?,?,?,?)",
    ).run(id, method, "pending", estimate.fare_hkd, at);
    return booking(customer, id);
  }
  function cancelBooking(customer, id) {
    const item = booking(customer, id);
    if (!["awaiting_arrangement"].includes(item.status))
      fail("此訂單目前不能自行取消", 409);
    const at = now();
    q(
      "UPDATE bookings SET status=?,updated_at=? WHERE id=? AND customer_id=?",
    ).run("cancelled", at, id, customer.id);
    q(
      "INSERT INTO booking_events(booking_id,event,created_at) VALUES(?,?,?)",
    ).run(id, "乘客取消訂單", at);
    return booking(customer, id);
  }
  return {
    db,
    pricing,
    register,
    login,
    authenticate,
    logout,
    listVehicles,
    saveVehicle,
    deleteVehicle,
    listLocations,
    saveLocation,
    deleteLocation,
    quote,
    booking,
    listBookings,
    events,
    createBooking,
    cancelBooking,
  };
}
