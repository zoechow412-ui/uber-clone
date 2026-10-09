import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPassengerCore } from "./core.mjs";

const expiry = () => {
  const day = new Date();
  day.setFullYear(day.getFullYear() + 1);
  return day.toISOString().slice(0, 10);
};
const car = {
  plate: "AB1234",
  make: "Toyota",
  model: "Alphard",
  transmission: "auto",
  requirements: "",
  existing_damage: "左邊刮痕",
  insurance_company: "測試保險",
  insurance_reference: "TEST-1",
  insurance_expiry: expiry(),
};
const trip = {
  pickup: "中環皇后大道中",
  destination: "九龍塘站",
  trip_type: "now",
  estimate_minutes: 45,
  night_surcharge: false,
  payment_method: "cash",
  owner_authorized: true,
  insurance_confirmed: true,
};
function setup() {
  const core = createPassengerCore();
  const first = core.register({
    name: "Zoe",
    email: "zoe@test.local",
    password: "StrongPass123!",
  });
  const second = core.register({
    name: "其他客人",
    email: "other@test.local",
    password: "StrongPass123!",
  });
  const vehicle = core.saveVehicle(first, car);
  return { core, first, second, vehicle };
}

test("後端核價按 200 元底價、每 15 分鐘 60 元及深夜 60 元", () => {
  const { core, first, vehicle } = setup();
  assert.equal(
    core.quote({ estimate_minutes: 15, night_surcharge: false }).fare_hkd,
    200,
  );
  assert.equal(
    core.quote({ estimate_minutes: 60, night_surcharge: false }).fare_hkd,
    240,
  );
  assert.equal(
    core.quote({ estimate_minutes: 61, night_surcharge: true }).fare_hkd,
    360,
  );
  const order = core.createBooking(first, {
    ...trip,
    vehicle_id: vehicle.id,
    fare_hkd: 1,
    payment_status: "paid",
  });
  assert.equal(order.fare_hkd, 200);
  assert.equal(order.estimate_source, "manual");
  assert.equal(order.status, "awaiting_arrangement");
  assert.equal(order.payment_status, "pending");
  assert.deepEqual(
    core.events(first, order.id).map((item) => item.event),
    ["建立測試訂單，等待安排司機"],
  );
});

test("乘客權限與付款狀態：不能改或讀其他人車輛和訂單", () => {
  const { core, first, second, vehicle } = setup();
  assert.throws(
    () => core.createBooking(second, { ...trip, vehicle_id: vehicle.id }),
    { status: 403 },
  );
  assert.throws(() => core.saveVehicle(second, car, vehicle.id), {
    status: 404,
  });
  const order = core.createBooking(first, {
    ...trip,
    vehicle_id: vehicle.id,
    payment_method: "fps",
  });
  assert.throws(() => core.booking(second, order.id), { status: 404 });
  assert.throws(() => core.cancelBooking(second, order.id), { status: 404 });
  assert.equal(core.cancelBooking(first, order.id).status, "cancelled");
  assert.throws(() => core.cancelBooking(first, order.id), { status: 409 });
  assert.equal(
    core.db
      .prepare("SELECT status FROM payments WHERE booking_id=?")
      .get(order.id).status,
    "pending",
  );
});

test("拒絕無效車牌、過期保險、未授權和過去預約；常用地址分戶保存", () => {
  const { core, first, second, vehicle } = setup();
  assert.throws(() => core.saveVehicle(first, { ...car, plate: "!@#" }), {
    status: 400,
  });
  assert.throws(
    () =>
      core.saveVehicle(first, {
        ...car,
        plate: "CD9999",
        insurance_expiry: "2000-01-01",
      }),
    { status: 400 },
  );
  assert.throws(
    () =>
      core.createBooking(first, {
        ...trip,
        vehicle_id: vehicle.id,
        owner_authorized: false,
      }),
    { status: 400 },
  );
  assert.throws(
    () =>
      core.createBooking(first, {
        ...trip,
        vehicle_id: vehicle.id,
        trip_type: "scheduled",
        scheduled_at: "2000-01-01T10:00:00+08:00",
      }),
    { status: 400 },
  );
  const address = core.saveLocation(first, {
    label: "屋企",
    address: "中環皇后大道中",
  });
  assert.equal(core.listLocations(first).length, 1);
  assert.equal(core.listLocations(second).length, 0);
  assert.throws(() => core.deleteLocation(second, address.id), { status: 404 });
});

test("登入驗證及訂單車輛刪除限制", () => {
  const { core, first, vehicle } = setup();
  const login = core.login("zoe@test.local", "StrongPass123!");
  assert.equal(core.authenticate(login.token).id, first.id);
  assert.throws(() => core.login("zoe@test.local", "wrong"), { status: 401 });
  const order = core.createBooking(first, { ...trip, vehicle_id: vehicle.id });
  assert.throws(() => core.deleteVehicle(first, vehicle.id), { status: 409 });
  assert.equal(core.listBookings(first)[0].id, order.id);
  core.logout(login.token);
  assert.throws(() => core.authenticate(login.token), { status: 401 });
});

test("SQLite 重新開啟後仍保留乘客車輛和測試訂單", () => {
  const dir = mkdtempSync(join(tmpdir(), "anxin-passenger-test-"));
  const file = join(dir, "passenger.sqlite");
  try {
    const first = createPassengerCore(file);
    const customer = first.register({
      name: "Zoe",
      email: "persist@test.local",
      password: "StrongPass123!",
    });
    const vehicle = first.saveVehicle(customer, car);
    const order = first.createBooking(customer, {
      ...trip,
      vehicle_id: vehicle.id,
    });
    first.db.close();
    const second = createPassengerCore(file);
    const login = second.login("persist@test.local", "StrongPass123!");
    assert.equal(second.listVehicles(login.customer)[0].plate, "AB1234");
    assert.equal(second.listBookings(login.customer)[0].id, order.id);
    second.db.close();
  } finally {
    unlinkSync(file);
    rmdirSync(dir);
  }
});
