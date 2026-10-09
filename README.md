# 安心代駕｜香港代駕乘客版 iPhone 測試程式

此專案沿用 [Ryde / Uber Clone](https://github.com/sanidhyy/uber-clone) 的 Expo / React Native 模板，保留原項目 MIT 授權。本分支已將 Expo 升級至 **SDK 57**，以供 iPhone 測試準備。

**目前是本機開發測試 App，不是真正派單服務。** 不要用作真實預約或收費。

## 乘客版現有功能

- 乘客畫面：`app/passenger.tsx`，預設啟動後直接開啟
- GPS 定位、Apple Maps 選擇上車點，亦可手動輸入地址
- 起點、目的地、車款、車牌、波箱、保險及車主授權欄位
- 即時或預約、本機模擬車資、建立及取消測試訂單
- 訂單只保存在本機，**無真實派單、付款或跨手機同步**

## iPhone 安裝

完整指引：[iOS 測試及 TestFlight 步驟](docs/IOS_TESTING.md)

需要 Node.js 22.13+：

```bash
npm ci
npx expo-doctor
npx tsc --noEmit
npx expo export --platform ios
```

Apple Developer Program、Expo 登入及 EAS Build 簽名設定，仍需由有權限嘅帳戶持有人完成。iOS ad hoc 測試用 `ios-internal`；TestFlight 用 `ios-testflight`。

## 版本與驗收

本升級由 Expo SDK 51 跨至 SDK 57、React 19.2、React Native 0.86，包含 NativeWind 4 樣式遷移。GitHub Actions 檢查將驗證依賴、TypeScript 同 iOS JavaScript 打包，但 **唔代替原生 iPhone 安裝及實測**。請先完成檢查和真機測試，再合併到 main。
