import { Text } from "react-native";
import type { PaymentProps } from "@/types/type";

// The original Ryde Stripe sheet is native-only. The active passenger flow records
// cash/FPS as pending and does not invoke this legacy component.
export function Payment(_props: PaymentProps) {
  return <Text>網頁版未接駁信用卡付款。</Text>;
}
