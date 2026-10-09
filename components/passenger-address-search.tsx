import { Text } from "react-native";
import type { AddressSearchProps } from "./passenger-address-search.native";

export function PassengerAddressSearch(_props: AddressSearchProps) {
  return (
    <Text style={{ color: "#687670", fontSize: 12, marginTop: 7 }}>
      網頁測試版請手動輸入地址；手機版可設定 Google Places 搜尋。
    </Text>
  );
}
