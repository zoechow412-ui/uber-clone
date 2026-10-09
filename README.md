# 安心代駕｜乘客 App

本專案直接沿用 [Ryde — Uber Clone](https://github.com/sanidhyy/uber-clone) 的 React Native / Expo 原始碼。預設入口是香港乘客版，服務模式為代駕司機駕駛乘客自己的車輛。保留原有 Ryde 程式碼供後續參考；現階段沒有司機工作台或管理後台入口。

## 已可操作

- Expo SDK 57、iOS／Android 原生地圖選點、GPS 權限及手動地址輸入。設定平台專用 Google Places／Directions Key 後，手機版可搜尋香港地址及顯示路線；未設定時仍可落單測試。
- 電郵密碼登入；車輛、保險資料及常用地址儲存於乘客 API 的 SQLite 資料庫，依帳戶限制讀寫。
- 即時／預約代駕、訂單確認、後端測試報價、現金／轉數快待付款、建立／查看／取消測試訂單。
- 收費測試公式由後端設定：最低 HK$200、每 15 分鐘 HK$60、深夜加 HK$60。無路線時間時須由乘客手動選擇時間，畫面會標明測試報價。

**服務尚未正式營運。**訂單雖儲存在後端，但沒有真實司機派單、即時司機位置、線上付款、保單核保或電子收據。訂單狀態會停留「等待安排司機」，除非乘客取消。請勿把測試訂單當作已預約真實代駕。

## 本機啟動

需要 Node.js 24 或更新版本、pnpm 11。於專案根目錄執行：

```powershell
pnpm install --frozen-lockfile
pnpm api
```

另開終端機：

```powershell
pnpm exec expo start --web --port 8081
```

瀏覽器打開 Expo 顯示的網址，建立測試乘客帳戶。API 預設為 `http://127.0.0.1:8094`，SQLite 檔案位於 `backend/data/passenger.sqlite`，已加入 Git 忽略清單。測試資料會持久保存；不要把此本機資料庫當成可公開上線的服務。可設定 `SEED_DEMO=1` 建立 `customer@demo.local`／`DemoPass123!` 測試帳戶，僅限非 production 環境。

## 手機預覽

電腦和手機連同一個 Wi-Fi。先將 `.env.example` 複製為 `.env`，把 `EXPO_PUBLIC_PASSENGER_API_URL` 改成電腦區域網絡 IP，例如 `http://192.168.1.100:8094`。啟動 API 前設 `API_HOST=0.0.0.0`，再執行 `pnpm api`。手機網頁若使用區域網絡網址，亦要把 `CORS_ORIGIN` 設為該網頁完整 origin。保持 API 只在可信任的本機網絡使用，正式服務必須改用 HTTPS 與受管伺服器。

```powershell
pnpm exec expo start --go --lan
```

安裝符合 SDK 57 的 Expo Go，掃描終端機 QR Code。iPhone 的 Expo Go 須與 Expo CLI 登入同一個 Expo 帳戶。Android 模擬器如沒有設定環境變數，可使用預設 `http://10.0.2.2:8094`。實體手機一定要用區域網絡 IP，不可用 `127.0.0.1` 指向電腦。

## 選用地圖服務

`app.config.js` 會從 `GOOGLE_MAPS_ANDROID_KEY`、`GOOGLE_MAPS_IOS_KEY` 注入原生地圖建置設定。手機地址搜尋和路線分別使用 `EXPO_PUBLIC_GOOGLE_PLACES_ANDROID_KEY`／`IOS_KEY` 及 `EXPO_PUBLIC_GOOGLE_DIRECTIONS_ANDROID_KEY`／`IOS_KEY`。未提供 Key 時不呼叫這些付費 API；地圖選點及手動測試報價仍可用。Google Key 應限制 Android package／簽名或 iOS bundle ID；`EXPO_PUBLIC_` 值會進 App bundle，不能當作秘密。Google 地圖相關服務可能收費，請先自行確認配額及啟用條件。Map ID 目前不需要。

## 驗證

```powershell
pnpm typecheck
pnpm test:passenger
pnpm exec expo export --platform web --output-dir dist-web
pnpm exec expo export --platform android --output-dir dist-android
```

網頁預覽不可代替 iPhone／Android 實機地圖與定位驗證。正式上線仍須完成伺服器部署、安全防護、付款、派單、保險／法律核實、客服、私隱政策與服務條款。
