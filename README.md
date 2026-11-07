# 營養師臨床與研發專業工具包 (Dietitian Pro Suite)

> **版權宣告所有權人：richardmimic / 營養吳理**  
> 專為臨床營養師、營養諮詢機構、保健食品配方研發師打造的一體化分析與規劃套件。

---

## 🚀 部署至 GitHub Pages（100% 成功、杜絕空白頁）

本專案已完全編譯並內嵌為**純靜態 HTML**，放在 `/docs` 資料夾中。

### 📌 啟用 GitHub Pages 步驟：
1. 將專案程式碼 **git add .**、**git commit** 並 **git push** 到 GitHub。
2. 在您的 GitHub 儲存庫頁面點選 **`Settings`（設定）**。
3. 左側選單點選 **`Pages`**。
4. 在 **「Build and deployment」** 底下的 **「Source」**：
   - 選擇 **`Deploy from a branch`**。
5. 下方選單：
   - **Branch**：選擇 **`main`**（或 `master`）。
   - **Folder**：選擇 **`/docs`**（最推薦；若選 `/ (root)` 系統也已內建自動轉址保護）。
6. 點擊 **`Save`（儲存）**。
7. 約等待 30 秒至 1 分鐘，重新整理頁面即可看到網址：
   `https://<你的GitHub帳號>.github.io/<儲存庫名稱>/`

---

## 💻 本地直接開啟（離線即開即用）

根目錄附帶一個完全自包含、單一檔案的靜態 HTML：
- **`dietitian_pro_suite.html`**
- **使用方式**：直接用滑鼠點擊兩下，即可在任何瀏覽器（Chrome、Edge、Safari、Firefox）離線離網正常運作，包含完整的食品資料庫檢索、DRIs 比對與營養處方功能。

---

## 🛠️ 開發與重新打包

若您有修改原始碼（位於 `src/`），只需執行：
```bash
npm install
npm run build
```
指令會自動重新編譯並同步更新 `/docs/index.html`、`/docs/404.html` 與 `dietitian_pro_suite.html`。
