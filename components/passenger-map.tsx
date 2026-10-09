import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export type PassengerMapProps = {
  latitude?: number;
  longitude?: number;
  onSelect?: (point: { latitude: number; longitude: number }) => void;
};

const HONG_KONG = {
  latitude: 22.2802,
  longitude: 114.1577,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export function PassengerMap({ latitude, longitude, onSelect }: PassengerMapProps) {
  if (Platform.OS === "web") {
    return (
      <View style={{ height: 194, backgroundColor: "#E7F2ED", marginTop: 17, borderRadius: 20, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="map-outline" color="#176E54" size={46} />
        <Text style={{ color: "#103C31", fontWeight: "800", marginTop: 10 }}>香港地圖</Text>
        <Text style={{ color: "#687670", fontSize: 12, marginTop: 5 }}>網頁預覽可手動輸入地址；iPhone 版支援地圖選點</Text>
      </View>
    );
  }

  const selected = latitude != null && longitude != null
    ? { latitude, longitude }
    : null;

  return (
    <View style={{ marginTop: 17, borderRadius: 20, overflow: "hidden", height: 240, backgroundColor: "#E7F2ED" }}>
      <MapView
        style={{ width: "100%", height: "100%" }}
        initialRegion={HONG_KONG}
        onPress={(event) => {
          const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;
          onSelect?.({ latitude: lat, longitude: lng });
        }}
        mapType="standard"
        accessibilityLabel="接車地點地圖，按地圖選擇上車位置"
      >
        {selected && <Marker coordinate={selected} title="接車位置" />}
      </MapView>
      <View pointerEvents="none" style={{ position: "absolute", bottom: 11, alignSelf: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 12, paddingVertical: 7 }}>
        <Text style={{ color: "#103C31", fontSize: 12, fontWeight: "700" }}>按地圖選擇接車位置</Text>
      </View>
    </View>
  );
}
