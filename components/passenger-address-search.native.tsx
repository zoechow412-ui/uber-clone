import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Platform, Text, View } from "react-native";
import type { Point } from "@/lib/passenger-api";

export type AddressSearchProps = {
  kind: "pickup" | "destination";
  onSelect: (address: string, point: Point) => void;
};
export function PassengerAddressSearch({ kind, onSelect }: AddressSearchProps) {
  const key =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_PLACES_IOS_KEY
      : process.env.EXPO_PUBLIC_GOOGLE_PLACES_ANDROID_KEY;
  if (!key)
    return (
      <Text style={{ color: "#687670", fontSize: 12, marginTop: 7 }}>
        地址搜尋未設定；可手動輸入或在地圖選點。
      </Text>
    );
  return (
    <View style={{ minHeight: 56, marginTop: 12, zIndex: 20 }}>
      <GooglePlacesAutocomplete
        placeholder={kind === "pickup" ? "搜尋香港接車地址" : "搜尋香港目的地"}
        fetchDetails
        debounce={300}
        query={{ key, language: "zh-HK", components: "country:hk" }}
        onPress={(item, details) => {
          const position = details?.geometry?.location;
          if (position)
            onSelect(item.description, {
              latitude: position.lat,
              longitude: position.lng,
            });
        }}
        styles={{
          textInput: {
            height: 50,
            backgroundColor: "#F7F9F8",
            borderColor: "#E3EAE5",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 13,
            fontSize: 15,
          },
          listView: {
            backgroundColor: "#FFFFFF",
            borderColor: "#E3EAE5",
            borderWidth: 1,
            borderRadius: 12,
          },
        }}
        enablePoweredByContainer={false}
      />
    </View>
  );
}
