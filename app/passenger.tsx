import { Ionicons } from "@expo/vector-icons";
import { PassengerMap } from "@/components/passenger-map";
import { PassengerAddressSearch } from "@/components/passenger-address-search";
import { PassengerInfo } from "@/components/passenger-info";
import {
  passengerApi,
  readSession,
  writeSession,
  type Booking,
  type Customer,
  type Point,
  type Pricing,
  type SavedLocation,
  type Vehicle,
} from "@/lib/passenger-api";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "首頁" | "我的行程" | "我的";
type VehicleForm = Pick<
  Vehicle,
  | "plate"
  | "make"
  | "model"
  | "transmission"
  | "requirements"
  | "existing_damage"
  | "insurance_company"
  | "insurance_reference"
  | "insurance_expiry"
>;
const emptyVehicle: VehicleForm = {
  plate: "",
  make: "",
  model: "",
  transmission: "auto",
  requirements: "",
  existing_damage: "",
  insurance_company: "",
  insurance_reference: "",
  insurance_expiry: "",
};
const C = {
  green: "#C9A96B",
  green2: "#E1C686",
  mist: "#2E2E30",
  bg: "#0B0B0B",
  ink: "#FFFFFF",
  muted: "#A5A5A5",
  border: "#39393B",
  white: "#1C1C1E",
  danger: "#E37E79",
};
const statuses: Record<string, string> = {
  awaiting_arrangement: "等待安排司機",
  accepted: "司機已接單",
  on_the_way: "司機前往接車地點",
  arrived: "司機已到達",
  driving: "代駕進行中",
  safely_arrived: "已安全到達",
  completed: "已完成",
  cancelled: "已取消",
};
const problem = (error: unknown) =>
  error instanceof Error ? error.message : "操作失敗，請稍後再試";
function notice(message: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(message);
  } else Alert.alert("安心代駕", message);
}
function Card({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        marginTop: 14,
        padding: 18,
        borderRadius: 20,
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      {children}
    </View>
  );
}
function Field({
  label,
  value,
  onChangeText,
  hint,
  secureTextEntry = false,
  autoCapitalize = "sentences",
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  hint: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "characters";
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <View style={{ marginTop: 15 }}>
      <Text
        style={{
          color: C.ink,
          fontWeight: "600",
          fontSize: 13,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={hint}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholderTextColor="#888888"
        style={{
          paddingHorizontal: 13,
          paddingVertical: 13,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
          fontSize: 16,
          color: C.ink,
          backgroundColor: C.bg,
        }}
      />
    </View>
  );
}
function MainButton({
  title,
  onPress,
  disabled = false,
  outline = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  outline?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 53,
        borderRadius: 14,
        marginTop: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: disabled ? "#565147" : outline ? C.white : C.green,
        borderWidth: outline ? 1 : 0,
        borderColor: C.green,
      }}
    >
      <Text
        style={{
          fontWeight: "800",
          color: outline ? C.green : C.bg,
          fontSize: 16,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
function Choice<T extends string | number>({
  items,
  value,
  onChange,
  display,
}: {
  items: readonly T[];
  value: T;
  onChange: (n: T) => void;
  display?: (n: T) => string;
}) {
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 11 }}
    >
      {items.map((item) => (
        <Pressable
          key={String(item)}
          onPress={() => onChange(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === item }}
          style={{
            paddingHorizontal: 13,
            paddingVertical: 11,
            borderRadius: 12,
            backgroundColor: value === item ? C.mist : C.bg,
            borderWidth: 1,
            borderColor: value === item ? C.green2 : C.border,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              color: value === item ? C.green : C.muted,
            }}
          >
            {display ? display(item) : String(item)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Check({
  value,
  onChange,
  text,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  text: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 15,
        gap: 10,
      }}
    >
      <Ionicons
        name={value ? "checkbox" : "square-outline"}
        size={23}
        color={C.green2}
      />
      <Text style={{ color: C.ink, fontSize: 13, lineHeight: 21, flex: 1 }}>
        {text}
      </Text>
    </Pressable>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 10,
      }}
    >
      <Text style={{ color: C.muted, flex: 1 }}>{label}</Text>
      <Text
        style={{ color: C.ink, fontWeight: "700", flex: 2, textAlign: "right" }}
      >
        {value}
      </Text>
    </View>
  );
}
const scheduledIso = (input: string) => {
  const match = input
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  const parsed = new Date(`${y}-${m}-${d}T${h}:${min}:00+08:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now())
    return null;
  const local = new Date(parsed.getTime() + 8 * 3600000)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
  return local === `${y}-${m}-${d} ${h}:${min}` ? parsed.toISOString() : null;
};

export default function Passenger() {
  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<Tab>("首頁");
  const [bookingStep, setBookingStep] = useState<
    "home" | "route" | "vehicle" | "review"
  >("home");
  const [booting, setBooting] = useState(true),
    [busy, setBusy] = useState(false),
    [customer, setCustomer] = useState<Customer | null>(null),
    [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [pricing, setPricing] = useState<Pricing | null>(null),
    [vehicles, setVehicles] = useState<Vehicle[]>([]),
    [locations, setLocations] = useState<SavedLocation[]>([]),
    [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicleId, setVehicleId] = useState<number>(0),
    [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicle),
    [editingVehicle, setEditingVehicle] = useState<number | null>(null);
  const [pickup, setPickup] = useState(""),
    [destination, setDestination] = useState(""),
    [pickupPoint, setPickupPoint] = useState<Point | null>(null),
    [destinationPoint, setDestinationPoint] = useState<Point | null>(null),
    [selecting, setSelecting] = useState<"pickup" | "destination">("pickup"),
    [locating, setLocating] = useState(false),
    [locationAllowed, setLocationAllowed] = useState(false);
  const [route, setRoute] = useState<{ km: number; minutes: number } | null>(
      null,
    ),
    [minutes, setMinutes] = useState(30),
    [night, setNight] = useState(false),
    [scheduled, setScheduled] = useState(false),
    [scheduledAt, setScheduledAt] = useState(""),
    [payment, setPayment] = useState<"cash" | "fps">("cash");
  const [authorized, setAuthorized] = useState(false),
    [insured, setInsured] = useState(false),
    [confirming, setConfirming] = useState(false),
    [selectedId, setSelectedId] = useState<number | null>(null),
    [events, setEvents] = useState<{ event: string; created_at: string }[]>([]);
  const [locationLabel, setLocationLabel] = useState(""),
    [locationAddress, setLocationAddress] = useState("");
  const selected = bookings.find((item) => item.id === selectedId) || null;
  const active = useMemo(
    () =>
      bookings.filter(
        (item) => !["completed", "cancelled"].includes(item.status),
      ),
    [bookings],
  );
  const fare = pricing
    ? Math.max(
        pricing.minimum_hkd,
        Math.ceil(minutes / pricing.minutes_step) * pricing.per_15_minutes_hkd,
      ) + (night ? pricing.night_hkd : 0)
    : null;
  const chosenVehicle = vehicles.find((item) => item.id === vehicleId) || null;

  async function refresh(session: string) {
    const [p, v, l, b] = await Promise.all([
      passengerApi<Pricing>("/pricing"),
      passengerApi<Vehicle[]>("/vehicles", session),
      passengerApi<SavedLocation[]>("/locations", session),
      passengerApi<Booking[]>("/bookings", session),
    ]);
    setPricing(p);
    setVehicles(v);
    setLocations(l);
    setBookings(b);
    setVehicleId((current) =>
      v.some((item) => item.id === current) ? current : v[0]?.id || 0,
    );
  }
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const saved = await readSession();
        if (saved) {
          const person = await passengerApi<Customer>("/me", saved);
          if (alive) {
            setCustomer(person);
            setToken(saved);
            await refresh(saved);
          }
        } else {
          const p = await passengerApi<Pricing>("/pricing");
          if (alive) setPricing(p);
        }
      } catch (error) {
        if (alive) {
          await writeSession(null);
          setToken(null);
          setCustomer(null);
          notice(problem(error));
        }
      } finally {
        if (alive) setBooting(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (tab !== "我的行程" || !token) return;
    const timer = setInterval(() => {
      passengerApi<Booking[]>("/bookings", token)
        .then(setBookings)
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [tab, token]);
  useEffect(() => {
    if (!selectedId || !token) return;
    passengerApi<{ event: string; created_at: string }[]>(
      `/bookings/${selectedId}/events`,
      token,
    )
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [selectedId, token, bookings]);
  async function authenticate() {
    if (busy) return;
    setBusy(true);
    try {
      if (authMode === "register")
        await passengerApi("/customers/register", null, "POST", {
          name,
          email,
          password,
        });
      const result = await passengerApi<{ token: string; customer: Customer }>(
        "/customers/login",
        null,
        "POST",
        { email, password },
      );
      await writeSession(result.token);
      setToken(result.token);
      setCustomer(result.customer);
      await refresh(result.token);
    } catch (error) {
      notice(problem(error));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (token) await passengerApi("/logout", token, "POST").catch(() => {});
    await writeSession(null);
    setToken(null);
    setCustomer(null);
    setVehicles([]);
    setBookings([]);
    setTab("首頁");
  }
  function confirmDeleteAccount() {
    const run = async () => {
      if (!token || busy) return;
      setBusy(true);
      try {
        await passengerApi("/me", token, "DELETE");
        await writeSession(null);
        setToken(null);
        setCustomer(null);
        setVehicles([]);
        setLocations([]);
        setBookings([]);
        setSelectedId(null);
        setTab("首頁");
        notice("帳戶及本測試服務所儲存的個人資料已刪除。");
      } catch (error) {
        notice(problem(error));
      } finally {
        setBusy(false);
      }
    };
    const message =
      "將永久刪除帳戶、車輛、地址及所有測試訂單。此操作無法復原。";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) void run();
    } else
      Alert.alert("刪除帳戶", message, [
        { text: "返回", style: "cancel" },
        { text: "永久刪除", style: "destructive", onPress: () => void run() },
      ]);
  }
  function vehiclePatch<K extends keyof VehicleForm>(
    key: K,
    value: VehicleForm[K],
  ) {
    setVehicleForm((current) => ({ ...current, [key]: value }));
  }
  async function saveVehicle() {
    if (!token) return;
    setBusy(true);
    try {
      const item = await passengerApi<Vehicle>(
        editingVehicle ? `/vehicles/${editingVehicle}` : "/vehicles",
        token,
        editingVehicle ? "PUT" : "POST",
        vehicleForm,
      );
      await refresh(token);
      setVehicleId(item.id);
      setEditingVehicle(null);
      setVehicleForm(emptyVehicle);
      notice("車輛資料已儲存。");
    } catch (error) {
      notice(problem(error));
    } finally {
      setBusy(false);
    }
  }
  function editVehicle(item: Vehicle) {
    setVehicleForm({
      plate: item.plate,
      make: item.make,
      model: item.model,
      transmission: item.transmission,
      requirements: item.requirements,
      existing_damage: item.existing_damage,
      insurance_company: item.insurance_company,
      insurance_reference: item.insurance_reference,
      insurance_expiry: item.insurance_expiry,
    });
    setEditingVehicle(item.id);
    setTab("我的");
  }
  async function saveLocation() {
    if (!token) return;
    setBusy(true);
    try {
      await passengerApi("/locations", token, "POST", {
        label: locationLabel,
        address: locationAddress,
      });
      setLocationLabel("");
      setLocationAddress("");
      await refresh(token);
      notice("常用地址已儲存。");
    } catch (error) {
      notice(problem(error));
    } finally {
      setBusy(false);
    }
  }
  async function useMyLocation() {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        notice("未獲定位權限，可以手動輸入接車地址。");
        return;
      }
      setLocationAllowed(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const point = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const result = await Location.reverseGeocodeAsync(point);
      const address = result[0];
      setPickup(
        address
          ? [
              address.streetNumber,
              address.street,
              address.district,
              address.city,
            ]
              .filter(Boolean)
              .join(" ")
          : `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
      );
      setPickupPoint(point);
      setRoute(null);
    } catch {
      notice("目前無法取得定位，請手動輸入地址。");
    } finally {
      setLocating(false);
    }
  }
  async function onMapSelect(point: Point) {
    try {
      const result = await Location.reverseGeocodeAsync(point);
      const address = result[0];
      const label = address
        ? [address.streetNumber, address.street, address.district, address.city]
            .filter(Boolean)
            .join(" ")
        : `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
      if (selecting === "pickup") {
        setPickupPoint(point);
        setPickup(label);
      } else {
        setDestinationPoint(point);
        setDestination(label);
      }
      setRoute(null);
    } catch {
      notice("地址解析失敗，請手動輸入地址。");
    }
  }
  function validateOrder() {
    if (
      !pickup.trim() ||
      !destination.trim() ||
      pickup.trim() === destination.trim()
    )
      return "請填寫不同的接車地點和目的地";
    if (!chosenVehicle) return "請先在「我的」儲存車輛";
    if (scheduled && !scheduledIso(scheduledAt))
      return "請填寫有效的未來預約時間（YYYY-MM-DD HH:mm）";
    if (!authorized || !insured) return "請確認車主授權及保險聲明";
    if (!fare) return "暫時無法取得後端收費設定";
    return null;
  }
  async function createOrder() {
    if (!token) return;
    const invalid = validateOrder();
    if (invalid) {
      notice(invalid);
      return;
    }
    setBusy(true);
    try {
      const result = await passengerApi<Booking>("/bookings", token, "POST", {
        vehicle_id: vehicleId,
        pickup: pickup.trim(),
        destination: destination.trim(),
        ...(pickupPoint && destinationPoint
          ? {
              pickup_lat: pickupPoint.latitude,
              pickup_lng: pickupPoint.longitude,
              dest_lat: destinationPoint.latitude,
              dest_lng: destinationPoint.longitude,
            }
          : {}),
        trip_type: scheduled ? "scheduled" : "now",
        scheduled_at: scheduled ? scheduledIso(scheduledAt) : null,
        estimate_minutes: minutes,
        night_surcharge: night,
        payment_method: payment,
        owner_authorized: authorized,
        insurance_confirmed: insured,
      });
      await refresh(token);
      setSelectedId(result.id);
      setConfirming(false);
      setBookingStep("home");
      setTab("我的行程");
      notice(
        "測試訂單已存入乘客後端，目前等待安排司機；尚未接通司機派單或收款。",
      );
    } catch (error) {
      notice(problem(error));
    } finally {
      setBusy(false);
    }
  }
  async function cancelOrder(id: number) {
    if (!token) return;
    setBusy(true);
    try {
      await passengerApi(`/bookings/${id}/cancel`, token, "POST");
      await refresh(token);
    } catch (error) {
      notice(problem(error));
    } finally {
      setBusy(false);
    }
  }
  const section = (title: string) => (
    <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink }}>
      {title}
    </Text>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 11,
          backgroundColor: C.white,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ fontSize: 21, fontWeight: "900", color: C.green }}>
            安心代駕
          </Text>
          <Text style={{ color: C.muted, marginTop: 2, fontSize: 12 }}>
            由司機駕駛你自己架車
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 7,
            backgroundColor: C.mist,
            borderRadius: 99,
          }}
        >
          <Text style={{ fontSize: 11, color: C.green, fontWeight: "800" }}>
            乘客測試版
          </Text>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 17, paddingBottom: 26 }}
        >
          {booting ? (
            <ActivityIndicator style={{ marginTop: 50 }} color={C.green} />
          ) : !customer ? (
            <>
              <Text
                style={{
                  color: C.ink,
                  fontSize: 27,
                  fontWeight: "900",
                  marginTop: 24,
                }}
              >
                登入乘客帳戶
              </Text>
              <Text style={{ color: C.muted, marginTop: 7 }}>
                登入後，你的車輛和測試訂單會儲存在乘客後端。
              </Text>
              <Card>
                {section(authMode === "login" ? "登入" : "建立帳戶")}
                {authMode === "register" && (
                  <Field
                    label="姓名"
                    value={name}
                    onChangeText={setName}
                    hint="你的稱呼"
                  />
                )}
                <Field
                  label="電郵"
                  value={email}
                  onChangeText={setEmail}
                  hint="name@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Field
                  label="密碼"
                  value={password}
                  onChangeText={setPassword}
                  hint="最少 10 字元"
                  autoCapitalize="none"
                  secureTextEntry
                />
                <MainButton
                  title={
                    busy
                      ? "處理中…"
                      : authMode === "login"
                        ? "登入"
                        : "登記並登入"
                  }
                  onPress={authenticate}
                  disabled={busy}
                />
                <MainButton
                  outline
                  title={authMode === "login" ? "建立新帳戶" : "已有帳戶？登入"}
                  onPress={() =>
                    setAuthMode(authMode === "login" ? "register" : "login")
                  }
                />
              </Card>
              <Text style={{ color: C.muted, marginTop: 14, lineHeight: 20 }}>
                此版本供本機及測試網絡使用；正式營運前須完成司機派單、保險及付款服務。
              </Text>
            </>
          ) : (
            <>
              {tab === "首頁" && (
                <>
                  {bookingStep === "home" && (
                    <ImageBackground
                      source={require("@/assets/images/hong-kong-night-sedan.png")}
                      resizeMode="cover"
                      imageStyle={{ borderRadius: 22 }}
                      style={{
                        height: 380,
                        marginTop: 16,
                        justifyContent: "flex-end",
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          justifyContent: "flex-end",
                          padding: 20,
                          borderRadius: 22,
                          backgroundColor: "rgba(0,0,0,0.27)",
                        }}
                      >
                        <Text
                          style={{
                            color: C.green2,
                            fontSize: 12,
                            letterSpacing: 3,
                            fontWeight: "800",
                          }}
                        >
                          香港專業代駕
                        </Text>
                        <Text
                          style={{
                            color: C.ink,
                            fontSize: 30,
                            fontWeight: "900",
                            lineHeight: 38,
                            marginTop: 8,
                          }}
                        >
                          今晚放鬆，安全返屋企
                        </Text>
                        <Text
                          style={{
                            color: "#ECECEC",
                            marginTop: 8,
                            lineHeight: 20,
                          }}
                        >
                          專業司機到你所在地，代你駕駛自己架車。
                        </Text>
                        <MainButton
                          title="立即叫代駕"
                          onPress={() => {
                            setScheduled(false);
                            setSelecting("pickup");
                            setBookingStep("route");
                            scrollRef.current?.scrollTo({
                              y: 0,
                              animated: true,
                            });
                          }}
                        />
                        <MainButton
                          title="預約代駕"
                          outline
                          onPress={() => {
                            setScheduled(true);
                            setBookingStep("route");
                            scrollRef.current?.scrollTo({
                              y: 0,
                              animated: true,
                            });
                          }}
                        />
                      </View>
                    </ImageBackground>
                  )}
                  {bookingStep === "home" && (
                    <Card>
                      {section("安心代駕")}
                      <Text
                        style={{ color: C.muted, marginTop: 8, lineHeight: 22 }}
                      >
                        司機駕駛你自己架車。選接車及目的地、揀已登記車輛，再查看測試報價。
                      </Text>
                      <Text
                        style={{ color: C.green, marginTop: 10, fontSize: 12 }}
                      >
                        目前只可建立測試訂單，未接通真實司機派單或收款。
                      </Text>
                    </Card>
                  )}
                  {bookingStep === "route" && (
                    <>
                      <MainButton
                        title="返回首頁"
                        outline
                        onPress={() => setBookingStep("home")}
                      />
                      <Text
                        style={{
                          color: C.ink,
                          fontSize: 27,
                          fontWeight: "900",
                          marginTop: 24,
                        }}
                      >
                        去邊度？我哋幫你揸。
                      </Text>
                      <Text
                        style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}
                      >
                        司機到你所在地，代你駕駛自己架車。
                      </Text>
                      <PassengerMap
                        pickup={pickupPoint}
                        destination={destinationPoint}
                        selecting={selecting}
                        showUserLocation={locationAllowed}
                        onSelect={onMapSelect}
                        onRoute={(km, duration) => {
                          setRoute({ km, minutes: duration });
                          setMinutes(Math.max(1, Math.ceil(duration)));
                        }}
                      />
                      <Card>
                        {section("行程資料")}
                        <Text style={{ color: C.muted, marginTop: 10 }}>
                          地圖選點：
                        </Text>
                        <Choice
                          items={["pickup", "destination"] as const}
                          value={selecting}
                          onChange={setSelecting}
                          display={(v) =>
                            v === "pickup" ? "接車位置" : "目的地"
                          }
                        />
                        <Field
                          label="接車地點"
                          value={pickup}
                          onChangeText={(value) => {
                            setPickup(value);
                            setPickupPoint(null);
                            setRoute(null);
                          }}
                          hint="請輸入香港接車地址"
                        />
                        <PassengerAddressSearch
                          kind="pickup"
                          onSelect={(address, point) => {
                            setPickup(address);
                            setPickupPoint(point);
                            setRoute(null);
                          }}
                        />
                        <Pressable
                          onPress={useMyLocation}
                          disabled={locating}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 11,
                            gap: 7,
                          }}
                        >
                          {locating ? (
                            <ActivityIndicator size="small" color={C.green2} />
                          ) : (
                            <Ionicons
                              name="locate-outline"
                              size={18}
                              color={C.green2}
                            />
                          )}
                          <Text style={{ color: C.green2, fontWeight: "700" }}>
                            {locating ? "正在定位" : "使用目前 GPS 位置"}
                          </Text>
                        </Pressable>
                        <Field
                          label="目的地"
                          value={destination}
                          onChangeText={(value) => {
                            setDestination(value);
                            setDestinationPoint(null);
                            setRoute(null);
                          }}
                          hint="請輸入香港目的地"
                        />
                        <PassengerAddressSearch
                          kind="destination"
                          onSelect={(address, point) => {
                            setDestination(address);
                            setDestinationPoint(point);
                            setRoute(null);
                          }}
                        />
                        {locations.length > 0 && (
                          <>
                            <Text style={{ color: C.muted, marginTop: 15 }}>
                              常用地址作目的地
                            </Text>
                            <Choice
                              items={locations.map((item) => item.id)}
                              value={
                                locations.find(
                                  (item) => item.address === destination,
                                )?.id || 0
                              }
                              onChange={(id) => {
                                const item = locations.find((x) => x.id === id);
                                if (item) {
                                  setDestination(item.address);
                                  setDestinationPoint(
                                    item.latitude != null &&
                                      item.longitude != null
                                      ? {
                                          latitude: item.latitude,
                                          longitude: item.longitude,
                                        }
                                      : null,
                                  );
                                  setRoute(null);
                                }
                              }}
                              display={(id) =>
                                locations.find((x) => x.id === id)?.label || ""
                              }
                            />
                          </>
                        )}
                        <Text
                          style={{
                            color: C.ink,
                            fontWeight: "700",
                            fontSize: 13,
                            marginTop: 16,
                          }}
                        >
                          出發時間
                        </Text>
                        <Choice
                          items={["即時", "預約"] as const}
                          value={scheduled ? "預約" : "即時"}
                          onChange={(v) => setScheduled(v === "預約")}
                        />
                        {scheduled && (
                          <Field
                            label="預約日期時間（香港時間）"
                            value={scheduledAt}
                            onChangeText={setScheduledAt}
                            hint="YYYY-MM-DD HH:mm"
                            autoCapitalize="none"
                          />
                        )}
                      </Card>
                      <MainButton
                        title="下一步：選擇車輛"
                        onPress={() => {
                          if (
                            pickup.trim().length < 2 ||
                            destination.trim().length < 2 ||
                            pickup.trim() === destination.trim()
                          )
                            return notice("請填寫不同的香港接車地點及目的地");
                          if (scheduled && !scheduledIso(scheduledAt))
                            return notice("請填寫有效的未來預約時間");
                          setBookingStep("vehicle");
                          scrollRef.current?.scrollTo({ y: 0, animated: true });
                        }}
                      />
                    </>
                  )}
                  {bookingStep === "vehicle" && (
                    <>
                      <MainButton
                        title="返回修改路線"
                        outline
                        onPress={() => setBookingStep("route")}
                      />
                      <Card>
                        {section("選擇你架車")}
                        {vehicles.length === 0 ? (
                          <>
                            <Text style={{ color: C.muted, marginTop: 12 }}>
                              未有已儲存車輛。先登記車牌、車款及保險資料。
                            </Text>
                            <MainButton
                              title="登記車輛"
                              outline
                              onPress={() => setTab("我的")}
                            />
                          </>
                        ) : (
                          <Choice
                            items={vehicles.map((item) => item.id)}
                            value={vehicleId}
                            onChange={setVehicleId}
                            display={(id) => {
                              const item = vehicles.find((x) => x.id === id);
                              return item
                                ? `${item.plate} · ${item.make} ${item.model}`
                                : "";
                            }}
                          />
                        )}
                        {chosenVehicle && (
                          <Text style={{ color: C.muted, marginTop: 10 }}>
                            {chosenVehicle.transmission === "auto"
                              ? "自動波"
                              : "手動波"}{" "}
                            · 保險到期 {chosenVehicle.insurance_expiry}
                          </Text>
                        )}
                      </Card>
                      <Card>
                        {section("預計車資")}
                        {route ? (
                          <Text style={{ color: C.green2, marginTop: 10 }}>
                            地圖路線：約 {route.km.toFixed(1)} 公里，約{" "}
                            {Math.ceil(route.minutes)} 分鐘
                          </Text>
                        ) : (
                          <Text style={{ color: C.muted, marginTop: 10 }}>
                            未有可用路線時間，請手動選擇測試預計車程。
                          </Text>
                        )}
                        <Choice
                          items={[15, 30, 45, 60, 90] as const}
                          value={minutes}
                          onChange={(n) => {
                            setMinutes(n);
                            setRoute(null);
                          }}
                          display={(n) => `${n} 分鐘`}
                        />
                        <Check
                          value={night}
                          onChange={setNight}
                          text={`深夜附加費（測試 +HK$${pricing?.night_hkd ?? 60}）`}
                        />
                        <Text
                          style={{
                            marginTop: 16,
                            fontSize: 29,
                            fontWeight: "900",
                            color: C.green,
                          }}
                        >
                          HK$ {fare ?? "—"}
                        </Text>
                        <Text
                          style={{
                            color: C.muted,
                            fontSize: 12,
                            lineHeight: 18,
                          }}
                        >
                          測試報價：最低 HK${pricing?.minimum_hkd ?? 200}，每 15
                          分鐘 HK${pricing?.per_15_minutes_hkd ?? 60}。
                          {route
                            ? "時間由地圖路線提供；"
                            : "時間由你手動選擇；"}
                          正式收費及路線須後續核實。
                        </Text>
                        <Text
                          style={{
                            marginTop: 15,
                            color: C.ink,
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          付款方式（未接駁收款）
                        </Text>
                        <Choice
                          items={["cash", "fps"] as const}
                          value={payment}
                          onChange={setPayment}
                          display={(v) => (v === "cash" ? "現金" : "轉數快")}
                        />
                        <Text
                          style={{ color: C.muted, marginTop: 9, fontSize: 12 }}
                        >
                          信用卡付款尚未接駁。
                        </Text>
                      </Card>
                      <Card>
                        {section("授權及保險")}
                        <Check
                          value={authorized}
                          onChange={setAuthorized}
                          text="我是車主，或已獲車主授權代駕司機駕駛此車。"
                        />
                        <Check
                          value={insured}
                          onChange={setInsured}
                          text="我已確認車輛保險容許收費代駕安排，並明白平台目前未核實保單。"
                        />
                        <MainButton
                          title="查看訂單資料"
                          onPress={() => {
                            const invalid = validateOrder();
                            if (invalid) return notice(invalid);
                            setConfirming(true);
                            setBookingStep("review");
                            scrollRef.current?.scrollTo({
                              y: 0,
                              animated: true,
                            });
                          }}
                        />
                        <Text
                          style={{
                            color: C.muted,
                            fontSize: 11,
                            lineHeight: 18,
                            marginTop: 11,
                          }}
                        >
                          目前只會建立後端測試訂單；不會通知真實司機或扣款。
                        </Text>
                      </Card>
                    </>
                  )}
                  {bookingStep === "review" && confirming && (
                    <Card>
                      {section("確認代駕")}
                      <Row label="接車" value={pickup} />
                      <Row label="目的地" value={destination} />
                      <Row
                        label="車輛"
                        value={
                          chosenVehicle
                            ? `${chosenVehicle.plate} · ${chosenVehicle.make} ${chosenVehicle.model}`
                            : "—"
                        }
                      />
                      <Row
                        label="時間"
                        value={scheduled ? scheduledAt : "即時"}
                      />
                      <Row
                        label="預計車程"
                        value={`${minutes} 分鐘${route ? "（地圖路線）" : "（手動測試）"}`}
                      />
                      <Row label="預計車資" value={`HK$ ${fare}`} />
                      <Row
                        label="付款"
                        value={`${payment === "cash" ? "現金" : "轉數快"}（待付款）`}
                      />
                      <Text
                        style={{
                          color: C.muted,
                          marginTop: 12,
                          lineHeight: 20,
                        }}
                      >
                        你已確認車主授權及保險聲明。訂單建立後狀態為「等待安排司機」，不代表已派單。
                      </Text>
                      <MainButton
                        title={busy ? "建立中…" : "確認建立測試訂單"}
                        onPress={createOrder}
                        disabled={busy}
                      />
                      <MainButton
                        title="返回修改"
                        outline
                        onPress={() => {
                          setConfirming(false);
                          setBookingStep("vehicle");
                        }}
                      />
                    </Card>
                  )}
                </>
              )}
              {tab === "我的行程" && (
                <>
                  <Text
                    style={{
                      color: C.ink,
                      fontSize: 27,
                      fontWeight: "900",
                      marginTop: 24,
                    }}
                  >
                    我的行程
                  </Text>
                  <Text style={{ color: C.muted, marginTop: 7 }}>
                    實際資料來自乘客後端；司機資訊待正式接駁。
                  </Text>
                  <Card>
                    {section(`進行中及預約（${active.length}）`)}
                    {active.length === 0 && (
                      <Text style={{ color: C.muted, marginTop: 12 }}>
                        目前沒有進行中的代駕訂單。
                      </Text>
                    )}
                    {active.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedId(item.id)}
                        style={{
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: C.border,
                        }}
                      >
                        <Text style={{ color: C.ink, fontWeight: "800" }}>
                          {item.pickup} → {item.destination}
                        </Text>
                        <Text
                          style={{
                            color: C.green2,
                            marginTop: 5,
                            fontWeight: "700",
                          }}
                        >
                          {statuses[item.status] || item.status}
                        </Text>
                        <Text
                          style={{ color: C.muted, fontSize: 12, marginTop: 3 }}
                        >
                          {item.trip_type === "scheduled" ? "預約" : "即時"} ·{" "}
                          {item.plate}
                        </Text>
                      </Pressable>
                    ))}
                  </Card>
                  <Card>
                    {section(`過往及所有訂單（${bookings.length}）`)}
                    {bookings.length === 0 && (
                      <Text style={{ color: C.muted, marginTop: 12 }}>
                        你仲未有行程紀錄。
                      </Text>
                    )}
                    {bookings.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedId(item.id)}
                        style={{
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: C.border,
                        }}
                      >
                        <Text style={{ color: C.ink, fontWeight: "700" }}>
                          #{item.id} {item.pickup} → {item.destination}
                        </Text>
                        <Text
                          style={{ color: C.muted, fontSize: 12, marginTop: 4 }}
                        >
                          {statuses[item.status] || item.status} ·{" "}
                          {new Date(item.created_at).toLocaleDateString(
                            "zh-HK",
                          )}
                        </Text>
                      </Pressable>
                    ))}
                  </Card>
                  {selected && (
                    <Card>
                      {section(`訂單 #${selected.id}`)}
                      <Text
                        style={{
                          color: C.green2,
                          fontWeight: "800",
                          marginTop: 10,
                        }}
                      >
                        {statuses[selected.status] || selected.status}
                      </Text>
                      <Row label="接車" value={selected.pickup} />
                      <Row label="目的地" value={selected.destination} />
                      <Row
                        label="車輛"
                        value={`${selected.plate} · ${selected.make} ${selected.model}`}
                      />
                      <Row
                        label="出發"
                        value={
                          selected.trip_type === "scheduled" &&
                          selected.scheduled_at
                            ? new Date(selected.scheduled_at).toLocaleString(
                                "zh-HK",
                              )
                            : "即時"
                        }
                      />
                      <Row
                        label="預計車程"
                        value={`${selected.estimate_minutes} 分鐘（手動測試）`}
                      />
                      <Row
                        label="預計車資"
                        value={`HK$ ${selected.fare_hkd}（測試）`}
                      />
                      <Row
                        label="付款"
                        value={`${selected.payment_method === "cash" ? "現金" : "轉數快"} · 未付款`}
                      />
                      <Text
                        style={{
                          color: C.muted,
                          marginTop: 12,
                          lineHeight: 20,
                          fontSize: 12,
                        }}
                      >
                        司機姓名、相片、評分、到達時間及 GPS
                        位置，須待真實司機後端接通；本版本沒有虛構司機資料。正式付款前不會產生電子收據。
                      </Text>
                      {events.map((event, index) => (
                        <Text
                          key={`${event.created_at}-${index}`}
                          style={{ color: C.muted, marginTop: 8, fontSize: 12 }}
                        >
                          {new Date(event.created_at).toLocaleString("zh-HK")} ·{" "}
                          {event.event}
                        </Text>
                      ))}
                      {selected.status === "awaiting_arrangement" && (
                        <MainButton
                          title={busy ? "處理中…" : "取消此測試訂單"}
                          outline
                          onPress={() => cancelOrder(selected.id)}
                          disabled={busy}
                        />
                      )}
                    </Card>
                  )}
                </>
              )}
              {tab === "我的" && (
                <>
                  <Text
                    style={{
                      color: C.ink,
                      fontSize: 27,
                      fontWeight: "900",
                      marginTop: 24,
                    }}
                  >
                    我的帳戶
                  </Text>
                  <Card>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 13,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: C.mist,
                          padding: 15,
                          borderRadius: 100,
                        }}
                      >
                        <Ionicons
                          name="person-outline"
                          size={25}
                          color={C.green}
                        />
                      </View>
                      <View>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 17,
                            color: C.ink,
                          }}
                        >
                          {customer.name}
                        </Text>
                        <Text
                          style={{ color: C.muted, marginTop: 4, fontSize: 12 }}
                        >
                          {customer.email}
                        </Text>
                      </View>
                    </View>
                    <MainButton title="登出" outline onPress={logout} />
                    <MainButton
                      title="永久刪除帳戶"
                      outline
                      onPress={confirmDeleteAccount}
                      disabled={busy}
                    />
                  </Card>
                  <Card>
                    {section("已儲存車輛")}
                    {vehicles.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => editVehicle(item)}
                        style={{
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: C.border,
                        }}
                      >
                        <Text style={{ fontWeight: "800", color: C.ink }}>
                          {item.plate} · {item.make} {item.model}
                        </Text>
                        <Text style={{ color: C.muted, marginTop: 4 }}>
                          {item.transmission === "auto" ? "自動波" : "手動波"} ·
                          保險到期 {item.insurance_expiry} · 點按編輯
                        </Text>
                      </Pressable>
                    ))}
                    <Text
                      style={{
                        color: C.green,
                        marginTop: 17,
                        fontWeight: "800",
                      }}
                    >
                      {editingVehicle ? "編輯車輛" : "新增車輛"}
                    </Text>
                    <Field
                      label="車牌號碼"
                      value={vehicleForm.plate}
                      onChangeText={(v) => vehiclePatch("plate", v)}
                      hint="例如 AB1234"
                      autoCapitalize="characters"
                    />
                    <Field
                      label="汽車品牌"
                      value={vehicleForm.make}
                      onChangeText={(v) => vehiclePatch("make", v)}
                      hint="例如 Toyota"
                    />
                    <Field
                      label="型號"
                      value={vehicleForm.model}
                      onChangeText={(v) => vehiclePatch("model", v)}
                      hint="例如 Corolla"
                    />
                    <Text
                      style={{
                        color: C.ink,
                        fontWeight: "700",
                        fontSize: 13,
                        marginTop: 16,
                      }}
                    >
                      波箱
                    </Text>
                    <Choice
                      items={["auto", "manual"] as const}
                      value={vehicleForm.transmission}
                      onChange={(v) => vehiclePatch("transmission", v)}
                      display={(v) => (v === "auto" ? "自動波" : "手動波")}
                    />
                    <Field
                      label="特殊駕駛要求"
                      value={vehicleForm.requirements}
                      onChangeText={(v) => vehiclePatch("requirements", v)}
                      hint="如有請填寫"
                    />
                    <Field
                      label="現有車輛損傷"
                      value={vehicleForm.existing_damage}
                      onChangeText={(v) => vehiclePatch("existing_damage", v)}
                      hint="如有請描述"
                    />
                    <Field
                      label="保險公司"
                      value={vehicleForm.insurance_company}
                      onChangeText={(v) => vehiclePatch("insurance_company", v)}
                      hint="車輛保險公司"
                    />
                    <Field
                      label="保單參考"
                      value={vehicleForm.insurance_reference}
                      onChangeText={(v) =>
                        vehiclePatch("insurance_reference", v)
                      }
                      hint="只在可信測試環境填寫"
                    />
                    <Field
                      label="保險到期日"
                      value={vehicleForm.insurance_expiry}
                      onChangeText={(v) => vehiclePatch("insurance_expiry", v)}
                      hint="YYYY-MM-DD"
                      autoCapitalize="none"
                    />
                    <MainButton
                      title={busy ? "儲存中…" : "儲存車輛"}
                      onPress={saveVehicle}
                      disabled={busy}
                    />
                    {editingVehicle && (
                      <MainButton
                        title="取消編輯"
                        outline
                        onPress={() => {
                          setEditingVehicle(null);
                          setVehicleForm(emptyVehicle);
                        }}
                      />
                    )}
                  </Card>
                  <Card>
                    {section("常用地址")}
                    {locations.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: C.border,
                        }}
                      >
                        <Text style={{ color: C.ink, fontWeight: "700" }}>
                          {item.label}
                        </Text>
                        <Text style={{ color: C.muted }}>{item.address}</Text>
                      </View>
                    ))}
                    <Field
                      label="地址名稱"
                      value={locationLabel}
                      onChangeText={setLocationLabel}
                      hint="例如屋企"
                    />
                    <Field
                      label="香港地址"
                      value={locationAddress}
                      onChangeText={setLocationAddress}
                      hint="請輸入地址"
                    />
                    <MainButton
                      title="儲存常用地址"
                      outline
                      onPress={saveLocation}
                      disabled={busy}
                    />
                  </Card>
                  <Card>
                    {section("付款及支援")}
                    <Text
                      style={{ color: C.muted, marginTop: 10, lineHeight: 21 }}
                    >
                      現金及轉數快只作付款方式記錄，未有收款服務。信用卡設定、客服渠道、私隱政策及服務條款，須正式營運前提供核准內容及服務資料。
                    </Text>
                    <MainButton
                      title="查看行程紀錄"
                      outline
                      onPress={() => setTab("我的行程")}
                    />
                  </Card>
                  <PassengerInfo />
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {customer && (
        <View
          style={{
            flexDirection: "row",
            backgroundColor: C.white,
            borderTopWidth: 1,
            borderColor: C.border,
            paddingBottom: Platform.OS === "ios" ? 8 : 4,
          }}
        >
          {(["首頁", "我的行程", "我的"] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
              onPress={() => {
                setTab(item);
                setConfirming(false);
              }}
              style={{
                flex: 1,
                paddingVertical: 13,
                alignItems: "center",
                gap: 3,
              }}
            >
              <Ionicons
                name={
                  item === "首頁"
                    ? "home-outline"
                    : item === "我的行程"
                      ? "calendar-outline"
                      : "person-outline"
                }
                size={21}
                color={tab === item ? C.green : C.muted}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: tab === item ? C.green : C.muted,
                  fontWeight: "800",
                }}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
