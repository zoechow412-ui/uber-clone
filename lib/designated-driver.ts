export type Status =
  "requested" | "accepted" | "arrived" | "driving" | "completed" | "cancelled";
export type Driver = {
  id: string;
  name: string;
  approved: boolean;
  online: boolean;
};
export type Booking = {
  id: string;
  pickup: string;
  destination: string;
  plate: string;
  vehicle: string;
  tripType: "即時" | "預約";
  scheduledAt: string;
  transmission: "自動波" | "手動波";
  condition: string;
  insuranceReference: string;
  insuranceExpiry: string;
  insuranceConfirmed: boolean;
  authorization: boolean;
  status: Status;
  driverId: string | null;
  plateChecked: boolean;
  conditionChecked: boolean;
  insuranceChecked: boolean;
  keysReturned: boolean;
  customerConfirmed: boolean;
  createdAt: string;
  events: { at: string; action: string }[];
};
export type State = { version: 1; drivers: Driver[]; bookings: Booking[] };
export const initialState = (): State => ({
  version: 1,
  drivers: [
    {
      id: "demo-driver",
      name: "測試司機 陳先生",
      approved: false,
      online: false,
    },
  ],
  bookings: [],
});
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};
export const validInsurance = (expiry: string, now = new Date()) => {
  const day = now.toISOString().slice(0, 10);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(expiry) &&
    !Number.isNaN(Date.parse(expiry)) &&
    expiry >= day
  );
};
export function createBooking(
  input: Pick<
    Booking,
    | "pickup"
    | "destination"
    | "plate"
    | "vehicle"
    | "transmission"
    | "condition"
    | "insuranceReference"
    | "insuranceExpiry"
    | "insuranceConfirmed"
    | "authorization"
    | "tripType"
    | "scheduledAt"
  >,
): Booking {
  assert(
    input.pickup.trim() && input.destination.trim(),
    "請填寫接車地點及目的地",
  );
  assert(
    input.pickup.trim() !== input.destination.trim(),
    "接車地點及目的地不能相同",
  );
  const plate = input.plate.toUpperCase().replace(/\s/g, "");
  assert(
    /^[A-Z0-9]{1,8}$/.test(plate),
    "請輸入 1 至 8 位英文字母或數字車牌；特殊車牌需人工處理",
  );
  assert(
    input.vehicle.trim() && input.condition.trim(),
    "請填寫車款及車況，包括已有損傷",
  );
  assert(input.insuranceReference.trim(), "請填寫測試保單參考");
  assert(validInsurance(input.insuranceExpiry), "保險到期日無效或已過期");
  if (input.tripType === "預約") {
    assert(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(input.scheduledAt) &&
        !Number.isNaN(Date.parse(input.scheduledAt.replace(" ", "T"))),
      "請按 YYYY-MM-DD HH:mm 輸入預約日期及時間",
    );
    assert(
      Date.parse(input.scheduledAt.replace(" ", "T")) > Date.now(),
      "預約時間必須是將來時間",
    );
  }
  assert(
    input.insuranceConfirmed && input.authorization,
    "必須確認代駕保障及車主授權",
  );
  const at = new Date().toISOString();
  return {
    ...input,
    plate,
    id: `AX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "requested",
    driverId: null,
    plateChecked: false,
    conditionChecked: false,
    insuranceChecked: false,
    keysReturned: false,
    customerConfirmed: false,
    createdAt: at,
    events: [{ at, action: "建立測試訂單" }],
  };
}
export function acceptBooking(
  state: State,
  id: string,
  driverId: string,
): State {
  const driver = state.drivers.find((d) => d.id === driverId);
  assert(driver?.approved && driver.online, "司機必須經測試管理員批准並上線");
  assert(
    !state.bookings.some(
      (b) =>
        b.driverId === driverId &&
        ["accepted", "arrived", "driving"].includes(b.status),
    ),
    "司機已有進行中訂單",
  );
  const booking = state.bookings.find((b) => b.id === id);
  assert(booking?.status === "requested", "訂單已被接取或不在待接狀態");
  return {
    ...state,
    bookings: state.bookings.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "accepted",
            driverId,
            events: [
              ...b.events,
              { at: new Date().toISOString(), action: "司機接單" },
            ],
          }
        : b,
    ),
  };
}
export function advanceBooking(booking: Booking, next: Status): Booking {
  const allowed: Partial<Record<Status, Status[]>> = {
    requested: ["cancelled"],
    accepted: ["arrived", "cancelled"],
    arrived: ["driving", "cancelled"],
    driving: ["completed"],
  };
  assert(allowed[booking.status]?.includes(next), "不允許跳過訂單步驟");
  if (next === "driving") {
    assert(
      booking.plateChecked &&
        booking.conditionChecked &&
        booking.insuranceChecked,
      "先完成車牌、車況、保險現場核對",
    );
    assert(
      booking.authorization &&
        booking.insuranceConfirmed &&
        validInsurance(booking.insuranceExpiry),
      "授權或保險資料無效",
    );
  }
  if (next === "completed")
    assert(
      booking.keysReturned && booking.customerConfirmed,
      "先確認交還車匙及客人確認",
    );
  return {
    ...booking,
    status: next,
    events: [...booking.events, { at: new Date().toISOString(), action: next }],
  };
}
