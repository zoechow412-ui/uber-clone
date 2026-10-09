import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Platform } from "react-native";
import { View, Text } from "react-native";
import { useEffect, useRef } from "react";
import type { PassengerMapProps } from "./passenger-map";

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
        backgroundColor: "#E7F2ED",
      }}
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
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
          <Marker coordinate={pickup} title="接車位置" pinColor="#176E54" />
        )}
        {destination && (
          <Marker coordinate={destination} title="目的地" pinColor="#C87131" />
        )}
        {pickup && destination && directionsKey && (
          <MapViewDirections
            origin={pickup}
            destination={destination}
            apikey={directionsKey}
            strokeWidth={4}
            strokeColor="#103C31"
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
          backgroundColor: "rgba(255,255,255,0.92)",
          borderRadius: 10,
          paddingVertical: 7,
          paddingHorizontal: 12,
        }}
      >
        <Text
          style={{
            color: "#103C31",
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
