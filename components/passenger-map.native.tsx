import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Platform } from "react-native";
import { View, Text } from "react-native";
import { useEffect, useRef } from "react";
import type { PassengerMapProps } from "./passenger-map";

const darkMap = [
  { elementType: "geometry", stylers: [{ color: "#202124" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#B8B4AA" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#202124" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#363638" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#29292B" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0C2234" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

export function PassengerMap({
  pickup,
  destination,
  selecting = "pickup",
  onSelect,
  onRoute,
  showUserLocation = false,
}: PassengerMapProps) {
  const mapRef = useRef<MapView>(null);
  useEffect(() => {
    if (pickup)
      mapRef.current?.animateToRegion(
        { ...pickup, latitudeDelta: 0.035, longitudeDelta: 0.035 },
        450,
      );
  }, [pickup?.latitude, pickup?.longitude]);
  const directionsKey =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_IOS_KEY
      : process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_ANDROID_KEY;
  return (
    <View
      style={{
        height: 228,
        borderRadius: 20,
        overflow: "hidden",
        marginTop: 17,
        backgroundColor: "#1C1C1E",
      }}
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        userInterfaceStyle="dark"
        customMapStyle={darkMap}
        initialRegion={{
          latitude: 22.2819,
          longitude: 114.1588,
          latitudeDelta: 0.07,
          longitudeDelta: 0.07,
        }}
        onPress={(e) => onSelect?.(e.nativeEvent.coordinate)}
        showsCompass
        showsBuildings
        showsUserLocation={showUserLocation}
      >
        {pickup && (
          <Marker coordinate={pickup} title="接車位置" pinColor="#C9A96B" />
        )}
        {destination && (
          <Marker coordinate={destination} title="目的地" pinColor="#E37E79" />
        )}
        {pickup && destination && directionsKey && (
          <MapViewDirections
            origin={pickup}
            destination={destination}
            apikey={directionsKey}
            strokeWidth={4}
            strokeColor="#C9A96B"
            onReady={(result) => onRoute?.(result.distance, result.duration)}
          />
        )}
      </MapView>
      <View
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          right: 10,
          backgroundColor: "rgba(20,20,21,0.94)",
          borderRadius: 10,
          paddingVertical: 7,
          paddingHorizontal: 12,
        }}
      >
        <Text
          style={{
            color: "#E1C686",
            fontSize: 11,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          點按地圖選擇{selecting === "pickup" ? "接車位置" : "目的地"}
          {directionsKey
            ? " · 已設定路線 API"
            : " · 未有路線 API，車資以手動時間試算"}
        </Text>
      </View>
    </View>
  );
}
