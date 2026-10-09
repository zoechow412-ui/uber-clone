import { Ionicons } from "@expo/vector-icons";
import { PassengerMap } from "@/components/passenger-map";
import * as Location from "expo-location";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBooking, advanceBooking, initialState, type Booking } from "@/lib/designated-driver";
import { useDesignatedDriver } from "@/store/designated-driver";

type Tab = "叫代駕" | "我的行程" | "我的";
const C = {
  green: "#103C31", green2: "#176E54", mist: "#E7F2ED",
  bg: "#F7F9F8", ink: "#16231F", muted: "#687670",
  border: "#E3EAE5", white: "#FFFFFF", danger: "#B23A37",
};
const STATUSES: Record<Booking["status"], string> = {
  requested: "等候安排司機",
  accepted: "司機已接單",
  arrived: "司機已到達",
  driving: "代駕途中",
  completed: "行程完成",
  cancelled: "已取消",
};
const today = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};
function notice(message: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(message);
  } else {
    Alert.alert("安心代駕", message);
  }
}
function Card({ children }: { children: ReactNode }) {
  return <View style={{ marginTop: 14, padding: 18, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border }}>{children}</View>;
}
function Field({ label, value, onChangeText, hint, autoCapitalize = "sentences" }: {
  label: string; value: string; onChangeText: (s: string) => void; hint: string;
  autoCapitalize?: "none" | "sentences" | "characters";
}) {
  return <View style={{ marginTop: 15 }}>
    <Text style={{ color: C.ink, fontWeight: "600", fontSize: 13, marginBottom: 8 }}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={hint}
      autoCapitalize={autoCapitalize}
      placeholderTextColor="#9BA9A1"
      style={{ paddingHorizontal: 13, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: C.border, fontSize: 16, color: C.ink, backgroundColor: C.bg }}
    />
  </View>;
}
function MainButton({ title, onPress, disabled = false, outline = false }: { title: string; onPress: () => void; disabled?: boolean; outline?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{
    minHeight: 53, borderRadius: 14, marginTop: 15, alignItems: "center", justifyContent: "center",
    backgroundColor: disabled ? "#B6C5BC" : outline ? C.white : C.green,
    borderWidth: outline ? 1 : 0, borderColor: C.green,
  }}>
    <Text style={{ fontWeight: "800", color: outline ? C.green : C.white, fontSize: 16 }}>{title}</Text>
  </Pressable>;
}
function Choice<T extends string | number>({ items, value, onChange, display }: {
  items: readonly T[]; value: T; onChange: (n: T) => void; display?: (n: T) => string;
}) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
    {items.map(item => <Pressable
      key={String(item)} onPress={() => onChange(item)}
      accessibilityRole="button" accessibilityState={{ selected: value === item }}
      style={{ paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12, backgroundColor: value === item ? C.mist : C.bg, borderWidth: 1, borderColor: value === item ? C.green2 : C.border }}
    ><Text style={{ fontWeight: "700", color: value === item ? C.green : C.muted }}>{display ? display(item) : String(item)}</Text></Pressable>)}
  </View>;
}
function Check({ value, onChange, text }: { value: boolean; onChange: (v: boolean) => void; text: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 15, gap: 10 }}>
    <Ionicons name={value ? "checkbox" : "square-outline"} size={23} color={C.green2} />
    <Text style={{ color: C.ink, fontSize: 13, lineHeight: 21, flex: 1 }}>{text}</Text>
  </Pressable>;
}

export default function Passenger() {
  const { data, update } = useDesignatedDriver();
  const [tab, setTab] = useState<Tab>("叫代駕");
  const [pickup, setPickup] = useState("中環蘭桂坊");
  const [destination, setDestination] = useState("九龍塘");
  const [plate, setPlate] = useState("AB1234");
  const [vehicle, setVehicle] = useState("Toyota Corolla");
  const [transmission, setTransmission] = useState<"自動波" | "手動波">("自動波");
  const [condition, setCondition] = useState("車況正常（測試資料）");
  const [policy, setPolicy] = useState("DEMO-POLICY-001");
  const [expiry, setExpiry] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  });
  const [insured, setInsured] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(today() + " 20:00");
  const [minutes, setMinutes] = useState(45);
  const [night, setNight] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"現金" | "轉數快">("現金");
  const [locating, setLocating] = useState(false);
  const [mapPoint, setMapPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const estimate = Math.max(200, Math.ceil(minutes / 15) * 60) + (night ? 60 : 0);
  const selected = data.bookings.find(b => b.id === selectedId) ?? null;
  const active = useMemo(() => data.bookings.filter(b => !["completed", "cancelled"].includes(b.status)), [data.bookings]);

  async function useMyLocation() {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        notice("未獲定位權限，可以直接手動輸入上車地址。");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const matches = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude, longitude: position.coords.longitude,
      });
      const address = matches[0];
      const formatted = address
        ? [address.streetNumber, address.street, address.district, address.city].filter(Boolean).join(" ")
        : position.coords.latitude.toFixed(5) + ", " + position.coords.longitude.toFixed(5);
      setPickup(formatted);
      setMapPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      notice("目前無法取得定位，請手動輸入地址。");
    } finally {
      setLocating(false);
    }
  }
  async function selectOnMap(point: { latitude: number; longitude: number }) {
    setMapPoint(point);
    try {
      const results = await Location.reverseGeocodeAsync(point);
      const addr = results[0];
      setPickup(addr ? [addr.streetNumber, addr.street, addr.district, addr.city].filter(Boolean).join(" ") : `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`);
    } catch {
      setPickup(`${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`);
    }
  }
  function order() {
    try {
      const booking = createBooking({
        pickup, destination, plate, vehicle, transmission, condition,
        insuranceReference: policy, insuranceExpiry: expiry,
        insuranceConfirmed: insured, authorization: authorized,
        tripType: isScheduled ? "預約" : "即時",
        scheduledAt: isScheduled ? scheduledAt : "即時出發",
        estimatedFare: estimate, estimatedMinutes: minutes,
        nightSurcharge: night, paymentMethod,
      });
      update({ ...data, bookings: [booking, ...data.bookings] });
      setSelectedId(booking.id);
      setTab("我的行程");
      notice("已建立本機測試訂單。現時未連接真實司機派單或付款服務。");
    } catch (error) {
      notice(error instanceof Error ? error.message : "資料有誤，請檢查。");
    }
  }
  function cancel(booking: Booking) {
    try {
      const changed = advanceBooking(booking, "cancelled");
      update({ ...data, bookings: data.bookings.map(b => b.id === booking.id ? changed : b) });
    } catch (error) {
      notice(error instanceof Error ? error.message : "此行程暫時無法取消，請聯絡客服。");
    }
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 11, backgroundColor: C.white, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View>
        <Text style={{ fontSize: 21, fontWeight: "900", color: C.green }}>安心代駕</Text>
        <Text style={{ color: C.muted, marginTop: 2, fontSize: 12 }}>由司機駕駛你自己架車</Text>
      </View>
      <View style={{ paddingHorizontal: 10, paddingVertical: 7, backgroundColor: C.mist, borderRadius: 99 }}>
        <Text style={{ fontSize: 11, color: C.green, fontWeight: "800" }}>乘客測試版</Text>
      </View>
    </View>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 17, paddingBottom: 26 }}>
        {tab === "叫代駕" && <>
          <Text style={{ color: C.ink, fontSize: 27, fontWeight: "900", marginTop: 24 }}>去邊度？我哋幫你揸。</Text>
          <Text style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>司機上門接你同你架車，安全送到目的地。</Text>
          <PassengerMap latitude={mapPoint?.latitude} longitude={mapPoint?.longitude} onSelect={selectOnMap}/>
          <Card>
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink }}>行程資料</Text>
            <Field label="司機到場接車位置" value={pickup} onChangeText={setPickup} hint="請輸入接車地址"/>
            <Pressable onPress={useMyLocation} disabled={locating} style={{ flexDirection: "row", alignItems: "center", marginTop: 11, gap: 7 }}>
              {locating ? <ActivityIndicator size="small" color={C.green2} /> : <Ionicons name="locate-outline" size={18} color={C.green2}/>}
              <Text style={{ color: C.green2, fontWeight: "700" }}>{locating ? "正在取得你的位置" : "使用目前 GPS 位置"}</Text>
            </Pressable>
            <Field label="目的地" value={destination} onChangeText={setDestination} hint="請輸入目的地"/>
            <Text style={{ color: C.ink, fontWeight: "700", fontSize: 13, marginTop: 16 }}>出發時間</Text>
            <Choice items={["即時", "預約"] as const} value={isScheduled ? "預約" : "即時"} onChange={v => setIsScheduled(v === "預約")}/>
            {isScheduled && <Field label="預約日期時間" value={scheduledAt} onChangeText={setScheduledAt} hint="YYYY-MM-DD HH:mm" autoCapitalize="none"/>}
          </Card>
          <Card>
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink }}>你架車嘅資料</Text>
            <Field label="車牌號碼" value={plate} onChangeText={setPlate} hint="例如 AB1234" autoCapitalize="characters"/>
            <Field label="車款" value={vehicle} onChangeText={setVehicle} hint="例如 Toyota Corolla"/>
            <Text style={{ color: C.ink, fontWeight: "700", fontSize: 13, marginTop: 16 }}>波箱類型</Text>
            <Choice items={["自動波", "手動波"] as const} value={transmission} onChange={setTransmission}/>
            <Field label="車況及原有損傷" value={condition} onChangeText={setCondition} hint="例如車身已有刮痕"/>
          </Card>
          <Card>
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink }}>車資試算</Text>
            <Text style={{ marginTop: 12, fontSize: 13, color: C.muted }}>預計行車時間（手動選擇，非 GPS 路線估價）</Text>
            <Choice items={[15, 30, 45, 60, 90] as const} value={minutes} onChange={setMinutes} display={n => n + " 分鐘"}/>
            <Check value={night} onChange={setNight} text="深夜附加費（示範 +HK$60）"/>
            <Text style={{ marginTop: 16, fontSize: 29, fontWeight: "900", color: C.green }}>HK$ {estimate}</Text>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>示範算法：最低 HK$200，每 15 分鐘 HK$60。實際價格及行車時間待正式接駁路線服務後確認。</Text>
            <Text style={{ marginTop: 15, color: C.ink, fontSize: 13, fontWeight: "700" }}>付款方式（測試版不會收錢）</Text>
            <Choice items={["現金", "轉數快"] as const} value={paymentMethod} onChange={setPaymentMethod}/>
          </Card>
          <Card>
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.ink }}>保險及授權確認</Text>
            <Field label="保單參考（只填測試資料）" value={policy} onChangeText={setPolicy} hint="DEMO-POLICY-001"/>
            <Field label="保險到期日" value={expiry} onChangeText={setExpiry} hint="YYYY-MM-DD" autoCapitalize="none"/>
            <Check value={insured} onChange={setInsured} text="我已確認適用保險容許此類收費代駕安排，並了解平台正式營運前仍須核實。"/>
            <Check value={authorized} onChange={setAuthorized} text="我是車主，或已獲車主授權代駕司機駕駛此車。"/>
            <MainButton title="確認代駕訂單（測試）" onPress={order}/>
            <Text style={{ color: C.muted, fontSize: 11, lineHeight: 18, marginTop: 11 }}>目前僅建立本機測試訂單；不會派遣真實司機、不會扣款，亦不代表平台已核保。請勿輸入真實身份及保單資料。</Text>
          </Card>
        </>}
        {tab === "我的行程" && <>
          <Text style={{ color: C.ink, fontSize: 27, fontWeight: "900", marginTop: 24 }}>我的行程</Text>
          <Text style={{ color: C.muted, marginTop: 7 }}>查看預約狀態及過往行程。</Text>
          <Card>
            <Text style={{ color: C.ink, fontSize: 17, fontWeight: "900" }}>進行中（{active.length}）</Text>
            {active.length === 0 && <Text style={{ marginTop: 13, color: C.muted }}>目前沒有進行中的代駕訂單。</Text>}
            {active.map(b => <Pressable onPress={() => setSelectedId(b.id)} key={b.id} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.ink, fontWeight: "800" }}>{b.pickup} → {b.destination}</Text>
              <Text style={{ color: C.green2, marginTop: 6, fontWeight: "700" }}>{STATUSES[b.status]}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{b.tripType} · {b.plate}</Text>
            </Pressable>)}
          </Card>
          <Card>
            <Text style={{ color: C.ink, fontSize: 17, fontWeight: "900" }}>所有行程（{data.bookings.length}）</Text>
            {data.bookings.length === 0 && <Text style={{ color: C.muted, marginTop: 12 }}>你仲未有行程紀錄。</Text>}
            {data.bookings.map(b => <Pressable key={b.id} onPress={() => setSelectedId(b.id)} style={{ paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.ink, fontWeight: "700" }}>{b.pickup} → {b.destination}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{STATUSES[b.status]} · {new Date(b.createdAt).toLocaleDateString("zh-HK")}</Text>
            </Pressable>)}
          </Card>
          {selected && <Card>
            <Text style={{ fontSize: 17, fontWeight: "900", color: C.ink }}>訂單詳情</Text>
            <Text style={{ marginTop: 12, fontWeight: "800", color: C.green2 }}>{STATUSES[selected.status]}</Text>
            <Text style={{ marginTop: 8, color: C.ink }}>{selected.pickup} → {selected.destination}</Text>
            <Text style={{ marginTop: 6, color: C.muted }}>車牌：{selected.plate} · {selected.vehicle}</Text>
            <Text style={{ marginTop: 6, color: C.muted }}>時間：{selected.scheduledAt}</Text>
            <Text style={{ marginTop: 6, color: C.muted }}>試算車費：HK$ {selected.estimatedFare ?? "未記錄"}</Text>
            <Text style={{ marginTop: 6, color: C.muted }}>付款：{selected.paymentMethod ?? "未設定"}（未收款）</Text>
            <Text style={{ marginTop: 10, color: C.muted, fontSize: 12 }}>訂單僅保存在本機。司機及位置資料未接駁，狀態不會自動變更。</Text>
            {["requested", "accepted", "arrived"].includes(selected.status) && <MainButton title="取消此測試訂單" outline onPress={() => cancel(selected)}/>}
          </Card>}
        </>}
        {tab === "我的" && <>
          <Text style={{ color: C.ink, fontSize: 27, fontWeight: "900", marginTop: 24 }}>我的帳戶</Text>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
              <View style={{ backgroundColor: C.mist, padding: 15, borderRadius: 100 }}><Ionicons name="person-outline" size={25} color={C.green}/></View>
              <View><Text style={{ fontWeight: "800", fontSize: 17, color: C.ink }}>乘客測試帳戶</Text><Text style={{ color: C.muted, marginTop: 4, fontSize: 12 }}>此版本無需登入</Text></View>
            </View>
          </Card>
          <Card>
            <Text style={{ color: C.ink, fontSize: 18, fontWeight: "900" }}>我嘅車輛</Text>
            <Text style={{ color: C.muted, marginTop: 11 }}>{plate} · {vehicle} · {transmission}</Text>
            <MainButton title="編輯車輛資料" outline onPress={() => setTab("叫代駕")}/>
          </Card>
          <Card>
            <Text style={{ color: C.ink, fontSize: 18, fontWeight: "900" }}>測試版說明</Text>
            <Text style={{ color: C.muted, lineHeight: 21, marginTop: 10 }}>只提供乘客功能。暫未接入真正會員登入、司機派單、路線計算、網上付款、保險核保或跨手機訂單同步。</Text>
            <MainButton title="清除本機測試訂單" outline onPress={() => {
              if (Platform.OS === "web") {
                if (typeof window !== "undefined" && window.confirm("確定清除所有本機測試訂單？")) { update(initialState()); setSelectedId(null); }
              } else Alert.alert("清除測試訂單", "確定要清除本機測試紀錄？", [{ text: "取消" }, { text: "清除", style: "destructive", onPress: () => { update(initialState()); setSelectedId(null); } }]);
            }}/>
          </Card>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
    <View style={{ flexDirection: "row", paddingTop: 9, paddingBottom: 7, borderTopColor: C.border, borderTopWidth: 1, backgroundColor: C.white }}>
      {([{ tab: "叫代駕", icon: "navigate-outline" }, { tab: "我的行程", icon: "receipt-outline" }, { tab: "我的", icon: "person-outline" }] as const).map(item =>
        <Pressable key={item.tab} onPress={() => setTab(item.tab)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.tab }} style={{ flex: 1, alignItems: "center", paddingVertical: 5, gap: 4 }}>
          <Ionicons name={item.icon} size={23} color={tab === item.tab ? C.green2 : "#91A29A"}/>
          <Text style={{ fontSize: 11, fontWeight: "700", color: tab === item.tab ? C.green2 : "#91A29A" }}>{item.tab}</Text>
        </Pressable>
      )}
    </View>
  </SafeAreaView>;
}
