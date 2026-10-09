import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type Customer = { id: number; name: string; email: string };
export type Vehicle = {
  id: number;
  plate: string;
  make: string;
  model: string;
  transmission: "auto" | "manual";
  requirements: string;
  existing_damage: string;
  insurance_company: string;
  insurance_reference: string;
  insurance_expiry: string;
};
export type SavedLocation = {
  id: number;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};
export type Booking = {
  id: number;
  vehicle_id: number;
  pickup: string;
  destination: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  plate: string;
  make: string;
  model: string;
  trip_type: "now" | "scheduled";
  scheduled_at: string | null;
  estimate_minutes: number;
  estimate_source: "manual" | string;
  fare_hkd: number;
  night_surcharge: number;
  payment_method: "cash" | "fps";
  payment_status: string;
  status: string;
  created_at: string;
};
export type Pricing = {
  version: string;
  minimum_hkd: number;
  per_15_minutes_hkd: number;
  night_hkd: number;
  minutes_step: number;
  estimate_source: string;
  approved: boolean;
};
export type Point = { latitude: number; longitude: number };

const key = "anxin_passenger_session_v2";
const baseUrl = (
  process.env.EXPO_PUBLIC_PASSENGER_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8094" : "http://127.0.0.1:8094")
).replace(/\/$/, "");

export async function readSession(): Promise<string | null> {
  if (Platform.OS === "web")
    return typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}
export async function writeSession(token: string | null) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined")
      token ? localStorage.setItem(key, token) : localStorage.removeItem(key);
  } else if (token) await SecureStore.setItemAsync(key, token);
  else await SecureStore.deleteItemAsync(key);
}
export async function passengerApi<T>(
  path: string,
  token: string | null = null,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Error(
      `未能連接乘客服務。請啟動後端並檢查 EXPO_PUBLIC_PASSENGER_API_URL：${baseUrl}`,
    );
  }
  let result: any;
  try {
    result = await response.json();
  } catch {
    throw Error("服務回應格式不正確");
  }
  if (!response.ok) throw Error(result.error || `服務錯誤 ${response.status}`);
  return result as T;
}
