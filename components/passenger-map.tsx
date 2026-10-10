import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export type PassengerMapProps = {
  pickup?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  selecting?: "pickup" | "destination";
  onSelect?: (point: { latitude: number; longitude: number }) => void;
  onRoute?: (distanceKm: number, durationMinutes: number) => void;
  showUserLocation?: boolean;
};
export function PassengerMap(_props: PassengerMapProps) {
  return (
    <View
      style={{
        height: 194,
        backgroundColor: "#1C1C1E",
        marginTop: 17,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="map-outline" color="#C9A96B" size={46} />
      <Text style={{ color: "#FFFFFF", fontWeight: "800", marginTop: 10 }}>
        香港地圖
      </Text>
      <Text style={{ color: "#A5A5A5", fontSize: 12, marginTop: 5 }}>
        網頁測試版可手動輸入地址；手機版可地圖選點
      </Text>
    </View>
  );
}
