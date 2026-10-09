import { useMemo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  acceptBooking,
  advanceBooking,
  createBooking,
  initialState,
  type Booking,
  type Driver,
} from "@/lib/designated-driver";
import { useDesignatedDriver } from "@/store/designated-driver";

type Tab = "叫代駕" | "行程" | "司機" | "我的";
const blue = "#0286FF";
const green = "#0CC25F";
const ink = "#151A1E";
const muted = "#717B83";
const border = "#E6E9EC";
const canvas = "#F6F8FA";
const tabs: { label: Tab; icon: ComponentProps<typeof Ionicons>["name"] }[] = [
  { label: "叫代駕", icon: "navigate-outline" },
  { label: "行程", icon: "receipt-outline" },
  { label: "司機", icon: "car-sport-outline" },
  { label: "我的", icon: "person-outline" },
];
const statusLabel: Record<Booking["status"], string> = {
  requested: "等候管理確認",
  accepted: "司機已接單",
  arrived: "現場核對中",
  driving: "行程進行中",
  completed: "行程已完成",
  cancelled: "已取消",
};
const initialDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const notify = (message: string) => {
  if (Platform.OS === "web") globalThis.alert?.(message);
  else Alert.alert("安心代駕", message);
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "sentences" | "characters";
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: muted, fontSize: 13, marginBottom: 7 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A9AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          color: ink,
          backgroundColor: "#F6F8FA",
          borderRadius: 13,
          borderWidth: 1,
          borderColor: border,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontSize: 16,
        }}
      />
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 50,
        paddingHorizontal: 16,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: disabled ? "#C9D1D8" : secondary ? "#EFF6FF" : blue,
        marginTop: 14,
      }}
    >
      <Text
        style={{
          color: secondary && !disabled ? blue : "white",
          fontSize: 16,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: "white",
          borderRadius: 18,
          padding: 17,
          marginTop: 14,
          borderWidth: 1,
          borderColor: border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function MapPreview() {
  return (
    <View
      accessibilityLabel="香港地圖示意"
      style={{
        height: 204,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#E8EEF1",
        marginTop: 16,
      }}
    >
      <View
        style={{
          position: "absolute",
          width: "120%",
          height: 20,
          backgroundColor: "#D3E4EB",
          top: 132,
          left: -20,
          transform: [{ rotate: "-12deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: "120%",
          height: 13,
          backgroundColor: "#D4E2E8",
          top: 55,
          left: -20,
          transform: [{ rotate: "17deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 14,
          height: "150%",
          backgroundColor: "#F8FAF8",
          top: -34,
          left: 96,
          transform: [{ rotate: "22deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 11,
          height: "150%",
          backgroundColor: "#F8FAF8",
          top: -34,
          right: 89,
          transform: [{ rotate: "-20deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 104,
          height: 45,
          backgroundColor: "#D6E9D5",
          borderRadius: 18,
          top: 16,
          right: 25,
          transform: [{ rotate: "-12deg" }],
        }}
      />
      <Text
        style={{
          position: "absolute",
          top: 17,
          left: 17,
          color: "#667A83",
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        中環　金鐘　灣仔
      </Text>
      <View
        style={{
          position: "absolute",
          left: "27%",
          top: "48%",
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: blue,
          borderWidth: 3,
          borderColor: "white",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "26%",
          top: "42%",
          width: 1,
          height: 71,
          borderLeftWidth: 2,
          borderColor: blue,
          borderStyle: "dashed",
          transform: [{ rotate: "-40deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "59%",
          top: "67%",
          width: 21,
          height: 21,
          borderRadius: 11,
          backgroundColor: green,
          borderWidth: 4,
          borderColor: "white",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          backgroundColor: "white",
          paddingVertical: 7,
          paddingHorizontal: 10,
          borderRadius: 99,
        }}
      >
        <Text style={{ color: muted, fontSize: 11 }}>
          地圖示意 · 確認接車點後顯示路線
        </Text>
      </View>
    </View>
  );
}

export default function AnxinDemo() {
  const { data, update } = useDesignatedDriver();
  const [tab, setTab] = useState<Tab>("叫代駕");
  const [pickup, setPickup] = useState("中環德輔道中");
  const [destination, setDestination] = useState("尖沙咀廣東道");
  const [plate, setPlate] = useState("AB1234");
  const [vehicle, setVehicle] = useState("Toyota Corolla");
  const [transmission, setTransmission] = useState<"自動波" | "手動波">(
    "自動波",
  );
  const [condition, setCondition] = useState("車燈正常，右後門有舊刮痕");
  const [insuranceReference, setInsuranceReference] =
    useState("DEMO-POLICY-001");
  const [insuranceExpiry, setInsuranceExpiry] = useState(
    `${new Date().getFullYear() + 1}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
  );
  const [insuranceConfirmed, setInsuranceConfirmed] = useState(false);
  const [authorization, setAuthorization] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(`${initialDate()} 20:00`);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    data.bookings.find((booking) => booking.id === selectedId) ?? null;
  const driver =
    data.drivers.find((item) => item.id === "demo-driver") ??
    initialState().drivers[0];
  const activeBookings = useMemo(
    () =>
      data.bookings.filter(
        (booking) => !["completed", "cancelled"].includes(booking.status),
      ),
    [data.bookings],
  );
  const patch = (next: typeof data) => update(next);
  const setDriver = (change: (current: Driver) => Driver) => {
    const exists = data.drivers.some((item) => item.id === "demo-driver");
    patch({
      ...data,
      drivers: exists
        ? data.drivers.map((item) =>
            item.id === "demo-driver" ? change(item) : item,
          )
        : [...data.drivers, change(initialState().drivers[0])],
    });
  };
  const create = () => {
    try {
      const booking = createBooking({
        pickup,
        destination,
        plate,
        vehicle,
        transmission,
        condition,
        insuranceReference,
        insuranceExpiry,
        insuranceConfirmed,
        authorization,
        tripType: scheduled ? "預約" : "即時",
        scheduledAt: scheduled ? scheduledAt : "即時出發",
      });
      patch({ ...data, bookings: [booking, ...data.bookings] });
      setSelectedId(booking.id);
      setTab("行程");
      notify("測試預約已送出，等待管理端確認司機。");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "資料無效，請檢查後再試。",
      );
    }
  };
  const advance = (next: Booking["status"]) => {
    if (!selected) return;
    try {
      const changed = advanceBooking(selected, next);
      patch({
        ...data,
        bookings: data.bookings.map((booking) =>
          booking.id === changed.id ? changed : booking,
        ),
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "未能更新行程。");
    }
  };
  const check = (
    key:
      | "plateChecked"
      | "conditionChecked"
      | "insuranceChecked"
      | "keysReturned"
      | "customerConfirmed",
  ) => {
    if (!selected) return;
    patch({
      ...data,
      bookings: data.bookings.map((booking) =>
        booking.id === selected.id
          ? { ...booking, [key]: !booking[key] }
          : booking,
      ),
    });
  };
  const renderSwitch = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
  ) => (
    <View
      key={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 9,
      }}
    >
      <Text style={{ color: ink, fontSize: 14, flex: 1, paddingRight: 10 }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: green }}
      />
    </View>
  );
  const checklist = (
    label: string,
    value: boolean,
    key:
      | "plateChecked"
      | "conditionChecked"
      | "insuranceChecked"
      | "keysReturned"
      | "customerConfirmed",
  ) => (
    <Pressable
      key={key}
      onPress={() => check(key)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
      }}
    >
      <View
        style={{
          width: 23,
          height: 23,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: value ? green : "#AAB3BA",
          backgroundColor: value ? green : "white",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 11,
        }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>
          {value ? "✓" : ""}
        </Text>
      </View>
      <Text style={{ color: ink, fontSize: 14, flex: 1 }}>{label}</Text>
    </Pressable>
  );
  const routeCard = (booking: Booking) => (
    <Pressable
      key={booking.id}
      onPress={() => setSelectedId(booking.id)}
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: ink,
            fontWeight: "700",
            fontSize: 15,
            flex: 1,
            marginRight: 10,
          }}
        >
          {booking.pickup} → {booking.destination}
        </Text>
        <Text style={{ color: blue, fontSize: 12, fontWeight: "700" }}>
          {statusLabel[booking.status]}
        </Text>
      </View>
      <Text style={{ color: muted, fontSize: 12, marginTop: 6 }}>
        {booking.tripType} · {booking.scheduledAt} · {booking.plate} ·{" "}
        {booking.vehicle}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: canvas }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                color: ink,
                fontSize: 18,
                fontWeight: "800",
                letterSpacing: 0.3,
              }}
            >
              安心代駕
            </Text>
            <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
              安心揸你架車，送你返屋企
            </Text>
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person-outline" size={20} color={ink} />
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20 }}
          >
            {tab === "叫代駕" && (
              <>
                <Text
                  style={{
                    color: ink,
                    fontSize: 27,
                    lineHeight: 34,
                    fontWeight: "800",
                    marginTop: 8,
                  }}
                >
                  你想去邊？
                </Text>
                <Text style={{ color: muted, marginTop: 5, fontSize: 14 }}>
                  由專業司機駕駛你的車，安全送你到目的地。
                </Text>
                <MapPreview />
                <Card style={{ marginTop: 15 }}>
                  <Text style={{ color: ink, fontSize: 17, fontWeight: "800" }}>
                    行程資料
                  </Text>
                  <Field
                    label="接車地點"
                    value={pickup}
                    onChangeText={setPickup}
                    placeholder="輸入接車地址"
                  />
                  <Field
                    label="目的地"
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="輸入目的地"
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#F2F4F6",
                      borderRadius: 12,
                      padding: 4,
                      marginTop: 14,
                    }}
                  >
                    {([false, true] as const).map((isScheduled) => (
                      <Pressable
                        key={String(isScheduled)}
                        onPress={() => setScheduled(isScheduled)}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          padding: 10,
                          borderRadius: 9,
                          backgroundColor:
                            scheduled === isScheduled ? "white" : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            color: scheduled === isScheduled ? blue : muted,
                            fontWeight: "700",
                          }}
                        >
                          {isScheduled ? "預約時間" : "即時叫車"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {scheduled && (
                    <Field
                      label="預約日期及時間"
                      value={scheduledAt}
                      onChangeText={setScheduledAt}
                      placeholder="YYYY-MM-DD HH:mm"
                    />
                  )}
                </Card>
                <Card>
                  <Text style={{ color: ink, fontSize: 17, fontWeight: "800" }}>
                    你的車輛
                  </Text>
                  <Field
                    label="車牌號碼"
                    value={plate}
                    onChangeText={setPlate}
                    placeholder="例如：AB1234"
                    autoCapitalize="characters"
                  />
                  <Field
                    label="車款"
                    value={vehicle}
                    onChangeText={setVehicle}
                    placeholder="輸入車款"
                  />
                  <View style={{ flexDirection: "row", gap: 9, marginTop: 13 }}>
                    {(["自動波", "手動波"] as const).map((gear) => (
                      <Pressable
                        key={gear}
                        onPress={() => setTransmission(gear)}
                        style={{
                          flex: 1,
                          borderRadius: 11,
                          borderWidth: 1,
                          borderColor: transmission === gear ? blue : border,
                          backgroundColor:
                            transmission === gear ? "#EFF6FF" : "white",
                          alignItems: "center",
                          padding: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: transmission === gear ? blue : ink,
                            fontWeight: "700",
                          }}
                        >
                          {gear}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Field
                    label="車況及現有損傷"
                    value={condition}
                    onChangeText={setCondition}
                    placeholder="描述車況"
                  />
                </Card>
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 5,
                    }}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={21}
                      color={blue}
                    />
                    <Text
                      style={{
                        color: ink,
                        fontSize: 17,
                        fontWeight: "800",
                        marginLeft: 8,
                      }}
                    >
                      保險及授權
                    </Text>
                  </View>
                  <Field
                    label="保單參考編號（測試資料）"
                    value={insuranceReference}
                    onChangeText={setInsuranceReference}
                    placeholder="例如：DEMO-001"
                    autoCapitalize="characters"
                  />
                  <Field
                    label="保險到期日（YYYY-MM-DD）"
                    value={insuranceExpiry}
                    onChangeText={setInsuranceExpiry}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                  />
                  {renderSwitch(
                    "已確認保險公司承保收費代駕及司機",
                    insuranceConfirmed,
                    setInsuranceConfirmed,
                  )}
                  {renderSwitch(
                    "我是車主或已獲車主授權",
                    authorization,
                    setAuthorization,
                  )}
                  <ActionButton title="確認行程資料" onPress={create} />
                  <Text
                    style={{
                      color: muted,
                      fontSize: 11,
                      lineHeight: 16,
                      marginTop: 9,
                    }}
                  >
                    開發測試流程不會查核真實保單、收費或派遣司機。請勿輸入真實個人及保單資料。
                  </Text>
                </Card>
              </>
            )}

            {tab === "行程" && (
              <>
                <Text
                  style={{
                    color: ink,
                    fontSize: 27,
                    fontWeight: "800",
                    marginTop: 8,
                  }}
                >
                  我的行程
                </Text>
                <Text style={{ color: muted, marginTop: 5 }}>
                  查看司機接單及行程狀態。
                </Text>
                <Card>
                  <Text style={{ color: ink, fontSize: 17, fontWeight: "800" }}>
                    進行中 · {activeBookings.length}
                  </Text>
                  {activeBookings.length ? (
                    activeBookings.map(routeCard)
                  ) : (
                    <Text style={{ color: muted, marginTop: 12 }}>
                      暫時未有行程。返到「叫代駕」開始預約。
                    </Text>
                  )}
                </Card>
                <Card>
                  <Text style={{ color: ink, fontSize: 17, fontWeight: "800" }}>
                    行程紀錄 · {data.bookings.length}
                  </Text>
                  {data.bookings.length ? (
                    data.bookings.map(routeCard)
                  ) : (
                    <Text style={{ color: muted, marginTop: 12 }}>
                      完成的行程會顯示喺呢度。
                    </Text>
                  )}
                </Card>
                {selected && (
                  <Card>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{ color: ink, fontSize: 17, fontWeight: "800" }}
                      >
                        行程詳情
                      </Text>
                      <Text
                        style={{ color: blue, fontSize: 12, fontWeight: "700" }}
                      >
                        {statusLabel[selected.status]}
                      </Text>
                    </View>
                    <Text
                      style={{ color: ink, fontWeight: "700", marginTop: 13 }}
                    >
                      {selected.pickup} → {selected.destination}
                    </Text>
                    <Text style={{ color: muted, fontSize: 13, marginTop: 7 }}>
                      {selected.plate} · {selected.vehicle} ·{" "}
                      {selected.transmission}
                    </Text>
                    <Text style={{ color: muted, fontSize: 13, marginTop: 4 }}>
                      保險到期：{selected.insuranceExpiry}
                    </Text>
                    {selected.status === "driving" && <MapPreview />}
                    {selected.events.map((event, index) => (
                      <Text
                        key={`${event.at}-${index}`}
                        style={{ color: muted, fontSize: 12, marginTop: 10 }}
                      >
                        {new Date(event.at).toLocaleString("zh-HK")} ·{" "}
                        {event.action}
                      </Text>
                    ))}
                  </Card>
                )}
              </>
            )}

            {tab === "司機" && (
              <>
                <Text
                  style={{
                    color: ink,
                    fontSize: 27,
                    fontWeight: "800",
                    marginTop: 8,
                  }}
                >
                  司機工作台
                </Text>
                <Text style={{ color: muted, marginTop: 5 }}>
                  接單、到場核對及完成行程。
                </Text>
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{ color: ink, fontSize: 16, fontWeight: "800" }}
                      >
                        {driver.name}
                      </Text>
                      <Text
                        style={{
                          color: driver.approved ? green : muted,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {driver.approved ? "管理端已批准" : "等候管理端批准"}
                      </Text>
                    </View>
                    <Switch
                      value={driver.online}
                      onValueChange={(value) =>
                        setDriver((current) => ({ ...current, online: value }))
                      }
                      disabled={!driver.approved}
                      trackColor={{ true: green }}
                    />
                  </View>
                  {!driver.approved && (
                    <Text style={{ color: muted, fontSize: 12, marginTop: 10 }}>
                      司機需先由管理端批准，才可以切換上線。
                    </Text>
                  )}
                </Card>
                <Card>
                  <Text style={{ color: ink, fontSize: 17, fontWeight: "800" }}>
                    可接預約
                  </Text>
                  {data.bookings.filter(
                    (booking) => booking.status === "requested",
                  ).length ? (
                    data.bookings
                      .filter((booking) => booking.status === "requested")
                      .map((booking) => (
                        <View
                          key={booking.id}
                          style={{
                            borderTopWidth: 1,
                            borderColor: border,
                            marginTop: 12,
                            paddingTop: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: ink,
                              fontSize: 15,
                              fontWeight: "700",
                            }}
                          >
                            {booking.pickup} → {booking.destination}
                          </Text>
                          <Text
                            style={{ color: muted, fontSize: 12, marginTop: 6 }}
                          >
                            {booking.tripType} · {booking.scheduledAt}
                          </Text>
                          <Text
                            style={{ color: muted, fontSize: 12, marginTop: 5 }}
                          >
                            {booking.plate} · {booking.vehicle} ·{" "}
                            {booking.transmission}
                          </Text>
                          <ActionButton
                            title="接取訂單"
                            onPress={() => {
                              try {
                                update(
                                  acceptBooking(
                                    data,
                                    booking.id,
                                    "demo-driver",
                                  ),
                                );
                                setSelectedId(booking.id);
                              } catch (error) {
                                notify(
                                  error instanceof Error
                                    ? error.message
                                    : "暫時未能接單",
                                );
                              }
                            }}
                            disabled={!driver.approved || !driver.online}
                          />
                        </View>
                      ))
                  ) : (
                    <Text style={{ color: muted, marginTop: 12 }}>
                      暫時無待接訂單。
                    </Text>
                  )}
                </Card>
                {selected &&
                  !["completed", "cancelled"].includes(selected.status) && (
                    <Card>
                      <Text
                        style={{ color: ink, fontSize: 17, fontWeight: "800" }}
                      >
                        現場核對 · {selected.plate}
                      </Text>
                      <Text
                        style={{ color: muted, fontSize: 12, marginTop: 5 }}
                      >
                        {selected.vehicle} · 保險到期 {selected.insuranceExpiry}
                      </Text>
                      {selected.status === "accepted" && (
                        <ActionButton
                          title="已到達接車地點"
                          onPress={() => advance("arrived")}
                        />
                      )}
                      {selected.status === "arrived" && (
                        <>
                          {checklist(
                            "實車車牌與預約資料一致",
                            selected.plateChecked,
                            "plateChecked",
                          )}
                          {checklist(
                            "已與客人共同檢查車況及記錄損傷",
                            selected.conditionChecked,
                            "conditionChecked",
                          )}
                          {checklist(
                            "已核實保險到期日及代駕保障",
                            selected.insuranceChecked,
                            "insuranceChecked",
                          )}
                          <ActionButton
                            title="核對完成，開始行程"
                            onPress={() => advance("driving")}
                            disabled={
                              !selected.plateChecked ||
                              !selected.conditionChecked ||
                              !selected.insuranceChecked
                            }
                          />
                        </>
                      )}
                      {selected.status === "driving" && (
                        <>
                          <MapPreview />
                          {checklist(
                            "已安全停車並交還車匙",
                            selected.keysReturned,
                            "keysReturned",
                          )}
                          {checklist(
                            "客人確認行程完成",
                            selected.customerConfirmed,
                            "customerConfirmed",
                          )}
                          <ActionButton
                            title="完成行程"
                            onPress={() => advance("completed")}
                            disabled={
                              !selected.keysReturned ||
                              !selected.customerConfirmed
                            }
                          />
                        </>
                      )}
                    </Card>
                  )}
              </>
            )}

            {tab === "我的" && (
              <>
                <Text
                  style={{
                    color: ink,
                    fontSize: 27,
                    fontWeight: "800",
                    marginTop: 8,
                  }}
                >
                  我的帳戶
                </Text>
                <Text style={{ color: muted, marginTop: 5 }}>
                  安心代駕 · 開發測試模式
                </Text>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        backgroundColor: "#EAF4FF",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="person" color={blue} size={25} />
                    </View>
                    <View style={{ marginLeft: 13 }}>
                      <Text
                        style={{ color: ink, fontSize: 16, fontWeight: "800" }}
                      >
                        測試用戶
                      </Text>
                      <Text
                        style={{ color: muted, fontSize: 12, marginTop: 4 }}
                      >
                        本機資料，不需註冊或登入
                      </Text>
                    </View>
                  </View>
                </Card>
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Ionicons name="settings-outline" color={blue} size={20} />
                    <Text
                      style={{
                        color: ink,
                        fontSize: 17,
                        fontWeight: "800",
                        marginLeft: 8,
                      }}
                    >
                      營運管理
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: muted,
                      fontSize: 12,
                      lineHeight: 18,
                      marginTop: 3,
                    }}
                  >
                    本機測試司機批准及訂單管理；正式版需管理員帳戶、伺服器及權限控制。
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 14,
                    }}
                  >
                    <View>
                      <Text style={{ color: ink, fontWeight: "700" }}>
                        {driver.name}
                      </Text>
                      <Text
                        style={{ color: muted, fontSize: 12, marginTop: 4 }}
                      >
                        駕駛資格及文件由管理端核實
                      </Text>
                    </View>
                    <Switch
                      value={driver.approved}
                      onValueChange={(value) =>
                        setDriver((current) => ({
                          ...current,
                          approved: value,
                          online: value ? current.online : false,
                        }))
                      }
                      trackColor={{ true: green }}
                    />
                  </View>
                  <Text
                    style={{
                      color: driver.approved ? green : muted,
                      fontSize: 12,
                      marginTop: 7,
                    }}
                  >
                    {driver.approved ? "已批准接單" : "待管理端批准"}
                  </Text>
                </Card>
                <Card>
                  <Text style={{ color: ink, fontSize: 17, fontWeight: "800" }}>
                    測試版範圍
                  </Text>
                  <Text
                    style={{
                      color: muted,
                      fontSize: 13,
                      lineHeight: 20,
                      marginTop: 9,
                    }}
                  >
                    訂單和司機狀態只保存在這部手機。尚未連接真實派單、定位、導航、付款、保險公司核保或多裝置同步。請勿輸入真實保單及個人資料。
                  </Text>
                </Card>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    Alert.alert(
                      "清除測試資料",
                      "清除這部手機上的訂單及司機狀態？",
                      [
                        { text: "取消", style: "cancel" },
                        {
                          text: "清除",
                          style: "destructive",
                          onPress: () => {
                            patch(initialState());
                            setSelectedId(null);
                            setTab("叫代駕");
                          },
                        },
                      ],
                    )
                  }
                  style={{ alignSelf: "center", padding: 16, marginTop: 8 }}
                >
                  <Text style={{ color: "#A14040", fontSize: 13 }}>
                    清除本機測試資料
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: border,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 4 : 8,
          }}
        >
          {tabs.map((item) => {
            const active = tab === item.label;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(item.label)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 6,
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={active ? blue : "#8A949B"}
                />
                <Text
                  style={{
                    color: active ? blue : "#8A949B",
                    fontSize: 11,
                    fontWeight: active ? "700" : "500",
                    marginTop: 3,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
