# 安心代駕｜iPhone 乘客版（開發測試）

本專案建基於原 [Ryde Uber Clone](https://github.com/sanidhyy/uber-clone)，保留 MIT 授權。**目前只測試乘客 App**，啟動時會直接進入 `app/passenger.tsx`。

## 技術版本

- **Expo SDK 57** / React Native **0.86.3** / React **19.2.3**
- **Node.js 22.13+**
- 使用 `npm` 安裝依賴；已刪除 SDK 51 時代的 `bun.lockb`、`pnpm-lock.yaml`，不要復用舊 lockfile。
- 本程式碼已配置待測試；尚未聲稱通過完整原生 iOS 編譯或 App Store 審查。

## 乘客版已提供

- 即時或預約代駕、手動輸入上車點／目的地
- iPhone 原生地圖（Apple Maps）按地圖選接車位置，以及前景 GPS 定位
- 車牌、車款、波箱、車況及測試保險資料
- 依手動指定時間試算的**示範**車費
- 建立、查看、取消**本機測試**訂單

**未完成真實營運功能：** 真正司機配對及派單、線上會員、實際路線／車費、跨設備資料、實際付款、通知、核保。不能視為真實代駕預約。測試時勿填真實證件或保單號碼。

## A. 先檢查 iPhone JavaScript Bundle（Windows 或 Mac）

```sh
git clone https://github.com/zoechow412-ui/uber-clone.git
cd uber-clone
npm install --legacy-peer-deps
npx expo install --fix
npx expo-doctor@latest
npx expo export --platform ios --clear
```

若 `expo install --fix` 更新 package.json，請一併儲存由本機產生的 lockfile，並重新檢查。舊 Uber 範例路由仍在原始碼供參考；本測試版只開放乘客流程。

## B. 用 iPhone 即時測試（最快）

```sh
npx expo start --clear
```

在 iPhone 開啟與 SDK 57 相容的 Expo Go，連接同一 Wi-Fi，用 Expo CLI 的 QR Code 開啟 App。若 App Store Expo Go 尚未包含 SDK 57，可以依 Expo 官方指引使用 `eas go` 安裝對應版本，或建立下方獨立測試 Build。Expo Go 只用於開發測試，不等於可獨立安裝嘅正式 App。

## C. 真正可安裝嘅 iPhone 測試版（EAS Build）

先登入 Expo：

```sh
npx eas-cli@latest login
npx eas-cli@latest init
```

**iOS Simulator（模擬器，不需 Apple Developer 會員）**

```sh
npx eas-cli@latest build --platform ios --profile ios-simulator
```

**實體 iPhone（需 Apple Developer Program 及登記測試裝置）**

```sh
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile ios-preview
```

EAS 會指引登入 Apple、產生憑證及配對裝置。建置成功後，將 EAS 產生嘅 iOS 安裝連結在已登記 iPhone 上打開。

**透過 TestFlight 測試（需 Apple Developer Program + App Store Connect）**

```sh
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

上載完成後，於 App Store Connect → TestFlight 分配測試用戶。未取得 Apple 簽署憑證前無法直接生成可安裝於個人 iPhone 的正式 IPA。

## iOS 設定

- App 名稱：安心代駕
- Bundle ID：`hk.anxin.designateddriver`
- 只申請使用期間前景定位權限；不申請背景追蹤
- 已配置 EAS `ios-simulator`、`ios-preview`、`production` profile
- 預設為乘客測試頁；無需要 Google Maps Key、Stripe 或 Clerk 才能測試本機叫車表單

## 上線前重要事項

接受有償代駕前，需要另外確認香港法例及商業保險適用範圍。正式營運亦需要實際司機管理系統、資料儲存、支付及安全保障；本版本未包含。
