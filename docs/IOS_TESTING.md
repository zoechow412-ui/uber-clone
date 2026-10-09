# 安心代駕 — iPhone 測試版（Expo SDK 57）

本分支沿用現有乘客版 app/passenger.tsx，保留香港接車地圖、車牌／保險表格及本機測試訂單。尚未接入真實司機、派單及付款功能，不能作實際商業叫車使用。

## 1. 下載並檢查

需要 Node.js 22.13 或更新版本。

```bash
git clone https://github.com/zoechow412-ui/uber-clone.git
cd uber-clone
git switch upgrade/expo57-ios-preview-20261009
npm ci
npx expo-doctor
npx tsc --noEmit
npx expo export --platform ios
```

## 2. 直接安裝到指定 iPhone（ad hoc 內部測試）

需要 Expo 帳戶、Apple Developer Program 會員資格及登記該 iPhone。

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli device:create
npx eas-cli build --platform ios --profile ios-internal
```

建置完成後，EAS 會提供安裝連結，只有已登記且納入簽名檔的 iPhone 可以安裝。新加裝置須更新簽名檔並重新建置。Apple 密碼及私鑰切勿提交到 GitHub。

## 3. TestFlight（多人測試）

需要 Apple Developer Program、App Store Connect App 設定及 EAS 初始化。

```bash
npx eas-cli build --platform ios --profile ios-testflight
npx eas-cli submit --platform ios --latest
```

再到 App Store Connect 分發 TestFlight 測試版。外部測試可能要經 Apple Beta App Review。

## 4. 現有限制

- SDK 大版本升級需要先通過 GitHub Actions 的依賴、TypeScript 及 iOS JS bundle 檢查，之後再做 iPhone 真機 native build 測試。
- 未有 Expo Project ID、Apple 憑證及登記裝置時，不能在 GitHub 單靠推送原始碼直接產生可安裝的 IPA。
- 目前只建立本機測試單，不支援實際派單、司機定位、支付、推播或準確行車時間車資。
- 先完成測試，確認可正常啟動，再將升級分支合併至 main。
