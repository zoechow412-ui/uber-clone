import MapView, { Marker } from "react-native-maps";
import { View, Text } from "react-native";
import type { PassengerMapProps } from "./passenger-map";

export function PassengerMap({ latitude, longitude, onSelect }: PassengerMapProps) {
  const hasLocation = typeof latitude === "number" && typeof longitude === "number";
  return <View style={{ height: 228, borderRadius: 20, overflow: "hidden", marginTop: 17, backgroundColor: "#E7F2ED" }}>
    <MapView
      style={{ flex: 1 }}
      key={hasLocation ? `${latitude!.toFixed(4)}-${longitude!.toFixed(4)}` : "hk"}
      initialRegion={{ latitude: hasLocation ? latitude! : 22.2819, longitude: hasLocation ? longitude! : 114.1588, latitudeDelta: hasLocation ? 0.012 : 0.07, longitudeDelta: hasLocation ? 0.012 : 0.07 }}
      onPress={e => onSelect?.(e.nativeEvent.coordinate)}
      showsCompass
      showsBuildings
    >
      {hasLocation && <Marker
        coordinate={{ latitude: latitude!, longitude: longitude! }}
        title="接車位置"
        description="目前選擇的上車點"
        pinColor="#176E54"
      />}
    </MapView>
    <View style={{ position: "absolute", left: 10, bottom: 10, right: 10, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 }}>
      <Text style={{ color: "#103C31", fontSize: 11, fontWeight: "700", textAlign: "center" }}>
        點按地圖選擇接車位置 · 未提供真實路線／車資
      </Text>
    </View>
  </View>;
}
