# 生動有趣的地震預警介紹網頁 — 建置計畫（二版修正）

## 1. 專案定位

| 面向 | 規格 |
|------|------|
| **受眾** | 大學生（修過 1 年地震學課程），具備 P/S 波、走時曲線、規模定義等基礎知識 |
| **D 區內容深度** | 假設受眾已掌握基礎原理，D 區聚焦於**進階應用層面**：系統設計權衡、演算法比較（傳統 vs ML）、誤報/漏報的系統性原因、AI/LLM 的模型架構細節 |
| **使用情境** | 課堂投影引導 ＋ 學生課後自學瀏覽。投影模式下講師操作電腦，學生觀看；自學模式下學生獨立操作所有互動模組 |
| **核心目標** | 分層涵蓋地震預警原理、臺灣系統演進數據、AI/LLM 新技術導入 |
| **互動深度** | 高度互動 — 含波形圈選、參數調整、流程可視化 |
| **語言** | 繁體中文為主，支援一鍵切換英文 |
| **裝置支援** | 現代桌面瀏覽器（Chrome / Edge / Firefox），僅桌面不支援觸控 |

---

## 2. 資訊架構

```
首頁（Landing）— Phase 1 即有純連結版
├── 簡介楔子（Why EEW? 30 秒 hook + 引導至閱讀區 D 或互動區）
├── 互動模擬入口卡片 × 3（A/B/C，附難度標示與前置知識連結→D 區）
└── 時間軸：臺灣 EEW 演進（102s → 7s）
    ▸ 數據引用來源：CWA 公開年報、Chen et al. (2019)、Su et al. (2025)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. 地震波偵測 × 定位 × 規模估算（手動流程模擬）
   ├── 預設情境場景載入（5 組預設參數，引用已知地震的真實定位資料）
   ├── 合成波形產生器（選情境 → 動態生成三分量波形）
   ├── P 波 / S 波挑選（滑鼠點擊標記到時，十字線 + 時間戳）
   ├── 即時定位解算（至少 3 站走時交會，非線性最小二乘法迭代求解）
   │   ▸ 座標系統：經緯度 (WGS84)，繪圖時投影轉換至 Web Mercator
   ├── 規模估算（振幅→ML / Mw 公式即時計算）
   └── 比對「標準答案」與誤差分析（誤差數值顯示）
       ▸ 定位誤差閾值：相對誤差 < 5% 或絕對誤差 < 15 km
       ▸ 標準解來源：scenarios.json 中的參考定位引用已知地震事件（CWA 地震報告），
         非開發者自行設定，確保獨立驗證性

B. EEW 流程時間軸模擬（自動化 EEW pipeline 動畫）
   ├── 測站密度滑桿（10–200 站）
   │   ▸ 測站分佈模型：以 CWA 真實測站座標為基礎，分層抽樣
   │     10 站時優先保留花東地區測站（高地震密度區），
   │     200 站時均勻覆蓋全臺。密度增加時依優先序逐步加入內陸測站
   ├── 動畫播放：地震發生 → P 波到各站 → 定位 → 規模算 → 預估震度 → 發布
   │   ▸ 動畫時間標尺：使用固定參考速度（基於典型 EEW 實測延遲），
   │     不受模組 A 使用者操作影響；可調播放速度（0.5× / 1× / 2×）
   ├── 盲區半徑即時更新（半透明圓形疊加）
   └── 對照表：發布時效 vs 測站數量

C. 多 Agent 協作儀表板模擬
   ├── .rep 事件觸發流程可視化（固定 JSON 結構模擬）
   ├── Agent 卡片（my_agent / seismo / seismo_agent / secondary）
   │   ▸ 使用 SVG 繪製節點流程圖（僅 4 節點，DOM 開銷極低，
   │     原生支援 hover/click 事件委派，不需自行實作 hit-testing）
   ├── 各階段延遲統計柱狀圖（每階段一個中位數延遲值，
   │   各階段內的隨機波動以常態分佈 ±15% 模擬；非整個資料集常態分佈）
   └── 日報產出模擬

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D. 深度閱讀區（進階知識庫，假設讀者已具備地震學基礎）
   ├── 地震預警系統的設計權衡（盲區 vs 可靠度、測站密度 vs 成本）
   ├── 傳統演算法 vs 機器學習震度預估（比較與權衡）
   ├── 科技極限的系統性原因（雙地震誤報／漏報的物理限制、海嘯預警）
   └── AI/LLM 技術細節（SeisWav2Vec 架構、對比學習、LEM Transformer、
       多 Agent 協作流程設計）
       ▸ D 區所有內容在 Phase 2 完成撰寫，供 Phase 3–5 開發時引用
```

---

## 3. 技術架構

### 3.0 架構總覽

```
┌──────────────────────────────────────────────────────┐
│                    使用者瀏覽器                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │           SPA 應用（hash-based routing）          │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  共享層 (Shared Layer)                       │ │ │
│  │  │  ├── i18n (自製 JSON key-value 模組)         │ │ │
│  │  │  ├── appState (單一狀態樹，router 為 source  │ │ │
│  │  │  │    of truth；appState.currentRoute 僅鏡像)│ │ │
│  │  │  ├── WaveformEngine (合成波形引擎，波形資料   │ │ │
│  │  │  │   保留在 engine 內部，appState 僅存 meta) │ │ │
│  │  │  └── EventBus (模組間通訊)                   │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │ │
│  │  │ 模組 A   │ │ 模組 B   │ │ 模組 C   │ │  D   │ │ │
│  │  │(picking) │ │(timeline)│ │(dashboard│ │(read)│ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│    純前端部署，無後端、無資料庫                        │
│    輸出至 GitHub Pages (gh-pages branch)               │
└──────────────────────────────────────────────────────┘
```

### 3.1 技術選型（確定）

| 層級 | 選項 | 理由 |
|------|------|------|
| **框架** | Vanilla JS + Canvas API | 高度互動不需 Virtual DOM；Canvas 直接操作避免 React 與 Canvas 的狀態同步成本 |
| **CSS** | 純 CSS + CSS Variables | 無建置步驟，i18n 切換搭配 `data-lang` attribute + flex 容器處理文字長度差異 |
| **i18n** | 自製輕量 i18n 模組（JSON key-value） | 僅中/英兩個語系 |
| **波形引擎** | 前端合成（分段波型疊加：P 波 + S 波 + 雜訊 + 衰減包絡） | 可控變因，無需真實資料 |
| **字體** | 純系統字型 `system-ui, "Microsoft JhengHei", "PingFang TC", sans-serif`，`font-display: swap` | 零外部請求，所有平台均有對應字型 |
| **部署** | GitHub Pages（gh-pages branch） | 零維運 |

> 不使用 Noto Sans TC — 該字體非 Windows 內建，若要使用需要 Google Fonts 請求，違反離線要求。改為系統內建字型（Microsoft JhengHei / PingFang TC / system-ui）。

### 3.2 關鍵互動技術細節

**A — 波形圈選**
- **雙層 Canvas 方案**：底層 Canvas A 繪製波形曲線（靜態，僅情境切換時重繪）；上層透明 Canvas B 繪製十字線、選取框、時間戳（動態，每幀清除 + 重繪）。避免全幅清除殘影問題
- 效能優化：mousemove handler 與 requestAnimationFrame 配對，每秒最多重繪標記層 60 次，波形層不因滑鼠移動而重繪
- 點擊標記 P 波 / S 波到時（十字線 + 時間戳）
- 選取後自動繪製走時曲線與定位交會
- 高 DPI 螢幕：`canvas.width = clientWidth * devicePixelRatio` 確保清晰

**B — 時間軸模擬**
- requestAnimationFrame 驅動動畫播放
- 模組 B 的動畫使用**獨立時間基準**（`elapsedTime = performance.now() - startTime`），恢復播放時重新計算 `startTime`，避免暫存 `currentTime` 造成的時間基準偏移
- 測站密度以 slider 控制（10–200 站），分佈模型見 §2B
- 盲區以半透明圓形疊加在地圖示意上
- **雙層 Canvas**（非 OffscreenCanvas）：地圖底層（靜態線條）+ 動態疊加層（測站、波前、盲區），不依賴 OffscreenCanvas 以確保 Firefox 相容性

**C — 多 Agent 儀表板**
- **SVG 繪製節點流程圖**（僅 4 節點，DOM 開銷低；原生支援滑鼠事件，不需自行實作 hit-testing）
- 節點狀態動畫（idle → processing → done → error）
- 延遲柱狀圖：**每階段一個中位數值**，階段內的隨機波動以常態分佈模擬（μ=0, σ=±15%），數據在每次進入模組時重新生成

### 3.3 模組間資料流與狀態管理

**Router 為 source of truth**
- `router.js` 管理當前路由，`appState.currentRoute` 僅作為唯讀鏡像供其他模組參考
- 路由變更時 router 更新 URL hash → 觸發 `appState.set({ currentRoute: newRoute })` → 各模組透過 subscribe 得知

**單一狀態樹 (appState)**

```js
{
  // router 鏡像（唯讀，實際 source of truth 在 router.js）
  currentRoute: '#module-a',

  // 語系
  locale: 'zh-TW',

  // 模組 A 狀態（僅存 meta data，波形資料保留在 WaveformEngine 內部）
  picking: {
    scenarioId: 'scenario_01',
    stations: [
      {
        id: 'ST01',
        // 座標單位：經度, 緯度 (WGS84)
        lon: 121.5, lat: 25.0,
        // waveform 僅存 meta，實際 Float32Array 保留在 engine
        waveformMeta: { sampleRate: 100, length: 3000, snr: 15 },
        pickedP: null | 1234,    // 單位 ms
        pickedS: null | 2345,
        trueP: 1200,             // 標準解 P 到時 (ms)
        trueS: 2300              // 標準解 S 到時 (ms)
      }
    ],
    locationResult: { lon, lat, depthKm, errorKm } | null,
    magnitudeResult: { ml, mw } | null
  },

  // 模組 B 狀態
  timeline: {
    stationCount: 50,
    isPlaying: false,
    elapsedTime: 0,             // 動畫已播放時間 (ms)
    phase: 'idle'               // idle | detecting | locating | magnitude | warning | done
  },

  // 模組 C 狀態
  agentDashboard: {
    repEvent: { id, time, magnitude, depth } | null,
    agentStates: {
      my_agent: 'idle',
      seismo: 'idle',
      seismo_agent: 'idle',
      secondary: 'idle'
    },
    latencyData: []             // 每次進入重新生成
  }
}
```

**資料流規則**
1. 模組 A/B/C **不能直接修改**其他模組的狀態區塊
2. 模組切換時：離開模組 → 暫存狀態至 appState → rAF loop 停止 → 進入新模組 → 從 appState 恢復
3. 動畫恢復邏輯：模組 B 暫存 `elapsedTime`（而非 `currentTime`）。恢復時 `startTime = performance.now() - elapsedTime`，確保動畫速度與基準一致
4. EventBus 用於跨模組通知。通知**必須在 appState 同步更新完成後才發出**。如需傳遞最小結果摘要（如定位完成事件的座標 + 規模），EventBus 允許承載輕量 payload（< 256 bytes），避免接收方另行讀取 appState 造成 race condition

**模組 A 與 B 的邊界定義**
- 模組 A = **手動流程**：使用者圈選 P/S 波 → 即時定位 → 規模計算。目的：理解定位與規模估算的原理
- 模組 B = **自動化 EEW pipeline**：測站密度影響整體時效的宏觀動畫。目的：理解系統層級的效能限制與盲區
- 兩者無資料依賴關係，可獨立操作。模組 B 使用**固定時間標尺**（基於典型 EEW 實測延遲），不參考模組 A 的真實演算時間，消除循環依賴

---

## 4. 視覺風格方向

| 項目 | 方向 |
|------|------|
| **配色** | 深色太空主題（地震儀風格），輔以高對比警示色（紅/橙），僅深色主題 |
| **字體** | 純系統字型 `system-ui, "Microsoft JhengHei", "PingFang TC", sans-serif`；`font-display: swap`。無外部字體請求 |
| **佈局** | 滿版寬 + 左右兩欄（互動區可切換全螢幕），投影模式時自動切換全螢幕 |
| **圖標** | 自製簡約 SVG icon，配合震波／雷達／節點風格 |
| **Loading** | 模擬地震波形 Canvas 動畫作為 loading |

> 不使用 Noto Sans TC — 非系統內建。不使用 OffscreenCanvas — Firefox 相容性考量。

---

## 5. 開發階段

### Phase 1 — 基礎架構 + Landing 雛形
- [ ] 專案 scaffold（index.html、CSS 架構、i18n 模組）
- [ ] hash-based SPA 路由 router（含 404 回退），作為 source of truth
- [ ] appState 實作（immutable update pattern + subscribe）
- [ ] EventBus 實作（序列化發送，支援輕量 payload）
- [ ] Landing 頁純連結雛形（三個互動模組的入口 + D 區入口）
- [ ] 字體載入策略（純系統字型，無外部請求）

### Phase 2 — 深度閱讀區 D（內容先行）
- [ ] 四區摺疊卡片：設計權衡 / 傳統 vs ML / 科技極限 / AI/LLM
- [ ] 各區內容撰寫（Phase 2 完成，供 Phase 3–5 引用）
- [ ] 各區 i18n 中英對照
- [ ] 各區底部連結指向對應互動模組

### Phase 3 — 互動模組 A（波形 × 定位 × 規模）
- [ ] 合成波形引擎（P/S 波疊加 + 衰減 + 雜訊 + 可調 SNR 3–30dB）
- [ ] 5 組預設情境參數（引用 CWA 地震報告之真實事件定位資料）
- [ ] 雙層 Canvas 波形繪製（底層波形 + 上層標記層）
- [ ] 滑鼠點擊標記 P/S 波到時
- [ ] 定位交會演算法（非線性最小二乘法 / Geiger's method，≥3 站）
- [ ] 規模估算（ML / Mw）
- [ ] 比對與誤差展示（絕對誤差 km + 相對誤差 %）

### Phase 4 — 互動模組 B（EEW 時間軸）
- [ ] 測站分佈模型（以 CWA 真實測站座標為基礎，分層抽樣）
- [ ] 測站密度滑桿（10–200）
- [ ] 動畫播放引擎（雙層 Canvas：靜態地圖底層 + 動態疊加層）
- [ ] 獨立時間基準（elapsedTime 模式，無循環依賴）
- [ ] 播放速度控制（0.5× / 1× / 2×）
- [ ] 盲區視覺化
- [ ] 發布時效 vs 測站數量對照表

### Phase 5 — 互動模組 C（多 Agent 儀表板）
- [ ] Agent 節點流程繪製（SVG，4 節點）
- [ ] 狀態機與動畫（idle → processing → done → error）
- [ ] 延遲統計圖表（每階段中位數 + 常態波動 ±15%）
- [ ] 日報產出模擬

### Phase 6 — 首頁 Landing 美化
- [ ] 簡介楔子（Why EEW?）
- [ ] 互動模擬入口卡片 × 3（替換 Phase 1 純連結版）
- [ ] 臺灣 EEW 演進時間軸（102s → 7s，附數據引用）
- [ ] 卡片附難度標示與前置知識連結（→ D 區）

### Phase 7 — 整合與部署
- [ ] 全站 i18n 完成（所有文字 key 覆蓋）
- [ ] 效能調校（Chrome DevTools Performance panel 錄製分析）
- [ ] GitHub Pages 部署確認

---

## 6. 檔案結構

```
/
├── index.html              # SPA 入口
├── css/
│   ├── reset.css
│   ├── variables.css       # CSS Variables（深色主題）
│   ├── layout.css          # 主版型（含 data-lang 切換）
│   └── components.css      # 元件樣式
├── js/
│   ├── app.js              # 初始化
│   ├── i18n.js             # i18n 模組
│   ├── router.js           # hash-based SPA router（source of truth）
│   ├── appState.js         # 單一狀態樹（getState / setState / subscribe）
│   ├── eventBus.js         # 模組間事件通知（序列化，支援輕量 payload）
│   ├── waveform-engine.js  # 合成波形產生器（波形資料保留於 engine 內部）
│   ├── scenarios.json      # 5 組預設情境參數 + 引用來源標示
│   ├── modules/
│   │   ├── picking.js      # 模組 A：波形圈選
│   │   ├── location.js     # 模組 A：非線性定位演算
│   │   ├── magnitude.js    # 模組 A：規模估算
│   │   ├── eew-timeline.js # 模組 B：時間軸
│   │   ├── agent-dash.js   # 模組 C：Agent 儀表板（SVG）
│   │   └── readings.js     # 模組 D：深度閱讀
│   └── utils/
│       ├── canvas.js       # Canvas 共用工具（dpr 適配、雙層管理）
│       ├── math.js         # 地震學公式（走時、ML/Mw、Geiger's method）
│       └── animation.js    # 動畫輔助（rAF loop 管理、elapsedTime）
├── i18n/
│   ├── zh-TW.json
│   └── en.json
├── assets/
│   └── icons/              # SVG 圖標
├── PLAN.md
└── README.md
```

---

## 7. 邊界條件與錯誤處理

| 情境 | 處理方式 |
|------|----------|
| 瀏覽器不支援 Canvas | 顯示降級提示文字，引導更換現代瀏覽器 |
| 使用者未圈選 P/S 波即按計算 | 按鈕 disabled，提示「請先標記 P 波與 S 波到時」 |
| 僅標記一站即要求定位 | 提示「至少需要 3 個測站資料」，計算按鈕保持 disabled |
| 波形 SNR 過低（< 3dB）導致 P/S 波無法辨識 | 波形生成時提示 SNR 值，若低於閾值顯示「訊噪比過低，建議調整 SNR」 |
| i18n 切換時動態內容 — DOM 部分 | 使用 `data-lang` attribute + CSS flex 容器搭配 `flex-shrink: 0` 與 `min-width` 避免 layout shift |
| i18n 切換時動態內容 — Canvas 部分 | 標記層 Canvas 觸發完整重繪（十字線、時間戳文字），波形底層不重算；文字長度不同時自動縮放字型大小 |
| i18n JSON 載入失敗（檔案損壞／路徑錯誤） | 以內建 fallback 字串顯示（中/英各一份最小集合硬編碼在 js 中），console.error 記錄 |
| 合成波形參數超出合理範圍 | slider 限制邊界（P/S 時差 0.5–10s，SNR 3–30dB），超出時 clamp 至最近有效值 |
| 合成波形參數組合產生無意義結果 | 參數組合校驗（如 P 到時 > S 到時 → 自動交換），無效組合提示使用者調整 |
| 動畫播放中被切換頁面 | 停止 rAF loop → 暫存 `elapsedTime` 至 appState → 返回時以 `performance.now() - elapsedTime` 重建時間基準 |
| 定位結果發散或誤差 > 100 km | 顯示「定位發散，請檢查 P/S 波標記是否正確」，不清除已標記到時 |
| Canvas 記憶體使用過高 | 頁面切換時釋放非作用中模組的 Canvas 實體，保留不超過 3 組雙層 Canvas |
| 路由 hash 無法匹配（404） | 顯示 router fallback 頁面，附「返回首頁」按鈕 |
| 字體載入失敗 | 純系統字型，無外部請求，因此無載入失敗問題 |
| 定位誤差數值異常（> 100 km） | 判定為發散，顯示警告而非地圖座標，引導重新圈選 |
| 多模組並行操作的 race condition | EventBus 序列化處理（先進先出），appState 更新採用不可變模式；EventBus signal 發出前確保 appState 已同步 |

---

## 8. 驗收標準

- [ ] 首頁能在 3 秒內完成初次載入（使用 PerformanceObserver 測量 First Contentful Paint，排除開發者工具干擾）
- [ ] 波形圈選延遲 < 8ms（`performance.now()` 測量 mousemove handler + 標記層 Canvas 重繪總時間，連續 100 次取 P99，排除 GC 暫停期間）
- [ ] i18n 切換不需重新載入頁面，定位結果不清除，無 layout shift
- [ ] 所有互動模組在 Chrome / Edge / Firefox 最新版正常運作
- [ ] 定位誤差展示數值正確：與 `scenarios.json` 中的標準解相比，**相對誤差 < 5% 或絕對誤差 < 15km**；標準解引用 CWA 地震報告，非開發者自行設定
- [ ] 多 Agent 儀表板動畫流暢無卡頓（Chrome DevTools Performance panel 錄製 10 秒，無連續 dropped frame）
- [ ] 可離線瀏覽（全靜態，無外部 API 依賴，無任何外部字型請求，無 Google Fonts）
- [ ] Canvas 高 DPI 繪圖清晰（`devicePixelRatio` 處理後，截圖文字無模糊）
- [ ] 動畫恢復播放時速度正常（elapsedTime 模式驗證：暫停 5 秒後恢復，動畫位置與連續播放差異 < 100ms）
