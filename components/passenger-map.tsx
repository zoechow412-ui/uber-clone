import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export type PassengerMapProps = {
  latitude?: number;
  longitude?: number;
  onSelect?: (point: { latitude: number; longitude: number }) => void;
};
export function PassengerMap(_props: PassengerMapProps) {
  return <View style={{
    height: 194, backgroundColor: "#E7F2ED", marginTop: 17,
    borderRadius: 20, justifyContent: "center", alignItems: "center",
  }}>
    <Ionicons name="map-outline" color="#176E54" size={46}/>
    <Text style={{ color: "#103C31", fontWeight: "800", marginTop: 10 }}>香港地圖</Text>
    <Text style={{ color: "#687670", fontSize: 12, marginTop: 5 }}>網頁測試版暫未提供地圖點選，可手動輸入地址</Text>
  </View>;
}
