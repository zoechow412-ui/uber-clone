import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Topic = "privacy" | "terms" | "support";
const content: Record<Topic, { title: string; body: string }> = {
  privacy: {
    title: "私隱政策（測試版）",
    body: "乘客帳戶、車輛、保險參考、常用地址及訂單會儲存在目前設定的乘客後端，用於登入及測試落單。此版本未提供帳戶自助刪除及正式私隱查詢渠道；請勿輸入真實身份證號碼或完整保單文件。正式私隱政策及資料保留安排須營運前公布。",
  },
  terms: {
    title: "服務條款（測試版）",
    body: "本版本只供開發及測試。建立訂單不代表已接受真實代駕服務，亦不會通知司機或扣款。測試收費不可作正式報價。乘客須確認自己有權授權駕駛車輛，並自行核對相關保險適用性；平台尚未完成核保。正式服務條款須營運前公布。",
  },
  support: {
    title: "聯絡客服",
    body: "正式客服渠道尚未開通。此測試版不可用於即時代駕或緊急求助。",
  },
};
export function PassengerInfo() {
  const [topic, setTopic] = useState<Topic | null>(null);
  return (
    <View
      style={{
        marginTop: 14,
        padding: 18,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E3EAE5",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "900", color: "#16231F" }}>
        服務資訊
      </Text>
      {(["privacy", "terms", "support"] as const).map((item) => (
        <Pressable
          key={item}
          onPress={() => setTopic(topic === item ? null : item)}
          accessibilityRole="button"
          style={{
            paddingVertical: 13,
            borderBottomWidth: 1,
            borderBottomColor: "#E3EAE5",
          }}
        >
          <Text style={{ color: "#103C31", fontWeight: "700" }}>
            {content[item].title}
          </Text>
        </Pressable>
      ))}
      {topic && (
        <Text style={{ color: "#687670", lineHeight: 21, marginTop: 12 }}>
          {content[topic].body}
        </Text>
      )}
    </View>
  );
}
