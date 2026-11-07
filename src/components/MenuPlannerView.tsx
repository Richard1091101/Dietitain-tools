import React, { useState, useId } from 'react';
import { 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  PlusCircle, 
  Printer, 
  RefreshCw, 
  Sliders, 
  Trash2, 
  Upload, 
  Utensils, 
  Zap, 
  CheckCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { 
  DayMenu, 
  FoodItemForPlanner, 
  MealPlan, 
  MealsConfig, 
  PlannerTargets, 
  SnacksConfig, 
  TdeeParams 
} from '../menuPlanner/types';
import { 
  ALL_PLANNER_CATEGORIES, 
  COOKING_METHODS, 
  INITIAL_FOOD_DB, 
  getCookingMethod, 
  getIconForType, 
  getLabelForType, 
  getOilGramsForMethod 
} from '../menuPlanner/foodDb';
import { 
  buildCsvTemplate, 
  calculateTotalStats, 
  generateMultiDayMenu, 
  parseCsvCustomFoods 
} from '../menuPlanner/engine';
import { BasketItem, FoodItem, MealType } from '../types';

interface MenuPlannerViewProps {
  onImportToAnalyzer: (items: BasketItem[]) => void;
  availableFoods?: FoodItem[];
  clientTargetKcal?: number;
  clientTargetProG?: number;
  clientDietName?: string;
  clientWeightKg?: number;
  clientHeightCm?: number;
  clientGender?: 'female' | 'male';
}

export const MenuPlannerView: React.FC<MenuPlannerViewProps> = ({
  onImportToAnalyzer,
  availableFoods = [],
  clientTargetKcal = 1800,
  clientTargetProG = 120,
  clientDietName = '均衡飲食',
  clientWeightKg = 60,
  clientHeightCm = 165,
  clientGender = 'female'
}) => {
  const fileInputId = useId();

  // 目標營養素設定
  const [targets, setTargets] = useState<PlannerTargets>({
    calories: clientTargetKcal,
    protein: clientTargetProG,
    fat: Math.round((clientTargetKcal * 0.25) / 9),
    carbs: Math.round((clientTargetKcal * 0.5) / 4)
  });

  // TDEE 參數
  const [tdeeParams, setTdeeParams] = useState<TdeeParams>({
    gender: clientGender,
    age: 35,
    height: clientHeightCm,
    weight: clientWeightKg,
    pal: 1.375
  });

  const [isTdeeMode, setIsTdeeMode] = useState(false);
  const [hbvRatio, setHbvRatio] = useState<number>(50);
  const [numDays, setNumDays] = useState<number>(7);
  const [activeDayTab, setActiveDayTab] = useState<number>(1);
  const [showAllDays, setShowAllDays] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // 餐食與點心開關
  const [mealsConfig, setMealsConfig] = useState<MealsConfig>({
    breakfast: true,
    lunch: true,
    dinner: true
  });
  const [snacksConfig, setSnacksConfig] = useState<SnacksConfig>({
    morning: false,
    afternoon: true,
    evening: false
  });

  // 食物資料庫 (可由 CSV 擴充)
  const [foodDb, setFoodDb] = useState(INITIAL_FOOD_DB);
  const [generatedMenu, setGeneratedMenu] = useState<DayMenu[]>(() => 
    generateMultiDayMenu(numDays, targets, hbvRatio, mealsConfig, snacksConfig, INITIAL_FOOD_DB)
  );

  const [notification, setNotification] = useState<{ message: string; sub?: string } | null>(null);

  const showToast = (message: string, sub?: string) => {
    setNotification({ message, sub });
    setTimeout(() => setNotification(null), 3500);
  };

  // 生成菜單
  const handleGenerate = () => {
    const menu = generateMultiDayMenu(numDays, targets, hbvRatio, mealsConfig, snacksConfig, foodDb);
    setGeneratedMenu(menu);
    setActiveDayTab(1);
    showToast(`成功生成 ${numDays} 天進階臨床營養菜單！`, `已落實每日食材不重複與油脂控管`);
  };

  // 套用臨床個案當前目標
  const handleApplyClientGoals = () => {
    const cal = clientTargetKcal;
    const pro = clientTargetProG;
    const fat = Math.round((cal * 0.25) / 9);
    const cho = Math.round((cal - pro * 4 - fat * 9) / 4);

    setTargets({
      calories: cal,
      protein: pro,
      fat,
      carbs: Math.max(0, cho)
    });
    showToast(`已成功套用個案處方目標！`, `熱量 ${cal} kcal · 蛋白質 ${pro} g`);
  };

  // 重新計算巨量營養素連動
  const handleMacroInputChange = (field: keyof PlannerTargets, val: number) => {
    const v = val >= 0 ? val : 0;
    let { calories, protein, carbs, fat } = targets;

    if (field === 'calories') {
      calories = v;
      fat = (calories - protein * 4 - carbs * 4) / 9;
      if (fat < 0) {
        fat = 0;
        carbs = (calories - protein * 4) / 4;
        if (carbs < 0) {
          carbs = 0;
          protein = calories / 4;
        }
      }
    } else if (field === 'protein') {
      protein = v;
      fat = (calories - protein * 4 - carbs * 4) / 9;
      if (fat < 0) {
        fat = 0;
        carbs = (calories - protein * 4) / 4;
        if (carbs < 0) {
          carbs = 0;
          calories = protein * 4;
        }
      }
    } else if (field === 'carbs') {
      carbs = v;
      fat = (calories - protein * 4 - carbs * 4) / 9;
      if (fat < 0) {
        fat = 0;
        calories = protein * 4 + carbs * 4;
      }
    } else if (field === 'fat') {
      fat = v;
      carbs = (calories - protein * 4 - fat * 9) / 4;
      if (carbs < 0) {
        carbs = 0;
        calories = protein * 4 + fat * 9;
      }
    }

    setTargets({
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    });
  };

  // 百分比滑桿連動
  const handleMacroSliderChange = (field: 'p' | 'c' | 'f', newPct: number) => {
    const cals = targets.calories;
    if (!cals) return;
    let p = Math.round((targets.protein * 4 / cals) * 100) || 0;
    let c = Math.round((targets.carbs * 4 / cals) * 100) || 0;
    let f = Math.max(0, 100 - p - c);

    const diff = newPct - (field === 'p' ? p : field === 'c' ? c : f);
    if (field === 'p') {
      p = newPct;
      if (c - diff >= 0) c -= diff;
      else {
        const rem = diff - c;
        c = 0;
        f -= rem;
      }
    } else if (field === 'c') {
      c = newPct;
      if (f - diff >= 0) f -= diff;
      else {
        const rem = diff - f;
        f = 0;
        p -= rem;
      }
    } else if (field === 'f') {
      f = newPct;
      if (c - diff >= 0) c -= diff;
      else {
        const rem = diff - c;
        c = 0;
        p -= rem;
      }
    }

    p = Math.max(0, Math.min(100, p));
    c = Math.max(0, Math.min(100, c));
    f = Math.max(0, Math.min(100, f));

    setTargets({
      calories: cals,
      protein: Math.round((cals * (p / 100)) / 4 * 10) / 10,
      carbs: Math.round((cals * (c / 100)) / 4 * 10) / 10,
      fat: Math.round((cals * (f / 100)) / 9 * 10) / 10
    });
  };

  // TDEE 計算
  const handleCalcTdee = () => {
    const { gender, age, height, weight, pal } = tdeeParams;
    const bmr = gender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    const tdee = Math.round(bmr * pal);

    setTargets({
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4),
      fat: Math.round((tdee * 0.3) / 9),
      carbs: Math.round((tdee * 0.4) / 4)
    });
    showToast(`TDEE 試算完成：${tdee} kcal`, `自動配比 P:30% · F:30% · C:40%`);
  };

  // 菜單單元更新輔助函式
  const updateMenuData = (dayIdx: number, mealIdx: number, updateFn: (meal: MealPlan) => void) => {
    setGeneratedMenu(prev => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIdx] };
      const targetMeals = [...targetDay.meals];
      const meal = { ...targetMeals[mealIdx] };

      updateFn(meal);
      targetMeals[mealIdx] = meal;
      targetDay.meals = targetMeals;
      targetDay.stats = calculateTotalStats(targetMeals, foodDb.oils);
      copy[dayIdx] = targetDay;
      return copy;
    });
  };

  // 匯入 CSV 食譜
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const { newDb, count } = parseCsvCustomFoods(text, foodDb);
        setFoodDb(newDb);
        showToast(`成功匯入 ${count} 筆自訂食材！`, `已擴充至候選名單，可點選替換或重新生成`);
      } catch (err) {
        showToast(`匯入失敗，請確認 CSV 格式是否相符。`);
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 下載 CSV 範本
  const handleDownloadCsvTemplate = () => {
    const template = buildCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '食材匯入範本_DietGenerator.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 工具函式：為菜單品項提取全部 33 種營養素化驗指標
  const extractFoodNutrientsForDish = (
    pItem: FoodItemForPlanner,
    weight: number,
    oilG = 0,
    oilName?: string
  ) => {
    const w = weight || 0;
    const cleanPName = pItem.name.replace(/\(.*\)/g, '').trim();
    const matched = availableFoods.find(f => 
      f.name === pItem.name || 
      f.name.replace(/\(.*\)/g, '').trim() === cleanPName ||
      f.name.includes(cleanPName) ||
      cleanPName.includes(f.name)
    );

    const mRatio = w / 100;
    const oilKcal = oilG * 9;
    const oilFat = oilG;
    let oilSat = oilG * 0.15;
    let oilMufa = oilG * 0.65;
    let oilPufa = oilG * 0.20;
    let oilVitE = oilG * 0.15;

    if (oilName?.includes('豬油') || oilName?.includes('牛油')) {
      oilSat = oilG * 0.40;
      oilMufa = oilG * 0.45;
      oilPufa = oilG * 0.10;
    } else if (oilName?.includes('大豆') || oilName?.includes('葵花') || oilName?.includes('沙拉油')) {
      oilSat = oilG * 0.15;
      oilMufa = oilG * 0.25;
      oilPufa = oilG * 0.55;
    }

    if (matched) {
      return {
        kcal: Math.round(matched.kcal * mRatio + oilKcal),
        water: Number((matched.water * mRatio).toFixed(1)),
        pro: Number((matched.pro * mRatio).toFixed(1)),
        fat: Number((matched.fat * mRatio + oilFat).toFixed(1)),
        satFat: Number((matched.satFat * mRatio + oilSat).toFixed(1)),
        mufa: Number((matched.mufa * mRatio + oilMufa).toFixed(1)),
        pufa: Number((matched.pufa * mRatio + oilPufa).toFixed(1)),
        chol: Math.round(matched.chol * mRatio),
        cho: Number((matched.cho * mRatio).toFixed(1)),
        fiber: Number((matched.fiber * mRatio).toFixed(1)),
        sugar: Number((matched.sugar * mRatio).toFixed(1)),
        ash: Number((matched.ash * mRatio).toFixed(1)),
        na: Math.round(matched.na * mRatio),
        k: Math.round(matched.k * mRatio),
        ca: Math.round(matched.ca * mRatio),
        mg: Math.round(matched.mg * mRatio),
        p: Math.round(matched.p * mRatio),
        fe: Number((matched.fe * mRatio).toFixed(2)),
        zn: Number((matched.zn * mRatio).toFixed(2)),
        cu: Number((matched.cu * mRatio).toFixed(2)),
        mn: Number((matched.mn * mRatio).toFixed(2)),
        vitA: Math.round(matched.vitA * mRatio),
        alphaCaro: Math.round(matched.alphaCaro * mRatio),
        betaCaro: Math.round(matched.betaCaro * mRatio),
        vitD: Number((matched.vitD * mRatio).toFixed(2)),
        vitE: Number((matched.vitE * mRatio + oilVitE).toFixed(2)),
        vitC: Number((matched.vitC * mRatio).toFixed(1)),
        vitB1: Number((matched.vitB1 * mRatio).toFixed(2)),
        vitB2: Number((matched.vitB2 * mRatio).toFixed(2)),
        niacin: Number((matched.niacin * mRatio).toFixed(2)),
        vitB6: Number((matched.vitB6 * mRatio).toFixed(2)),
        vitB12: Number((matched.vitB12 * mRatio).toFixed(2)),
        folate: Math.round(matched.folate * mRatio)
      };
    }

    const p = (pItem.p || 0) * w;
    const f = (pItem.f || 0) * w + oilFat;
    const c = (pItem.c || 0) * w;
    const kcal = Math.round(p * 4 + f * 9 + c * 4);

    return {
      kcal,
      water: Number((w * 0.7).toFixed(1)),
      pro: Number(p.toFixed(1)),
      fat: Number(f.toFixed(1)),
      satFat: Number((f * 0.25).toFixed(1)),
      mufa: Number((f * 0.45).toFixed(1)),
      pufa: Number((f * 0.30).toFixed(1)),
      chol: 0,
      cho: Number(c.toFixed(1)),
      fiber: Number(((pItem.fiber || 0) * w).toFixed(1)),
      sugar: Number((c * 0.08).toFixed(1)),
      ash: Number((w * 0.01).toFixed(1)),
      na: Math.round((pItem.na || 0) * w),
      k: Math.round((pItem.k || 0) * w),
      ca: Math.round((pItem.ca || 0) * w),
      mg: Math.round((pItem.mag || 0) * w),
      p: Math.round((pItem.phos || 0) * w),
      fe: Number(((pItem.fe || 0) * w).toFixed(2)),
      zn: Number(((pItem.zn || 0) * w).toFixed(2)),
      cu: Number(((pItem.cu || 0.001) * w).toFixed(2)),
      mn: Number(((pItem.mn || 0.002) * w).toFixed(2)),
      vitA: Math.round((pItem.vitA || 0) * w),
      alphaCaro: 0,
      betaCaro: Math.round((pItem.vitA || 0) * w * 3),
      vitD: Number(((pItem.vitD || 0) * w).toFixed(2)),
      vitE: Number((((pItem.vitE || 0) * w) + oilVitE).toFixed(2)),
      vitC: Number((w * 0.05).toFixed(1)),
      vitB1: Number(((pItem.b1 || 0.001) * w).toFixed(2)),
      vitB2: Number(((pItem.b2 || 0.001) * w).toFixed(2)),
      niacin: Number(((pItem.niacin || 0.01) * w).toFixed(2)),
      vitB6: Number(((pItem.b6 || 0.001) * w).toFixed(2)),
      vitB12: Number(((pItem.b12 || 0.005) * w).toFixed(2)),
      folate: Math.round((pItem.folic || 0) * w)
    };
  };

  // 匯出生成菜單為 HTML 檔案 (支援全套多日或單日列印)
  const handleExportHtml = (onlyCurrentDay = false) => {
    if (!generatedMenu || generatedMenu.length === 0) return;

    const targetDays = onlyCurrentDay 
      ? generatedMenu.filter(d => d.day === activeDayTab)
      : generatedMenu;

    const daysHtml = targetDays.map(dayData => `
      <div style="margin-bottom: 2rem; border: 1px solid #cbd5e1; border-radius: 16px; padding: 1.5rem; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <h2 style="font-size: 1.25rem; font-weight: 900; color: #1e1b4b; background: #e0e7ff; padding: 6px 16px; border-radius: 8px; margin: 0;">
            第 ${dayData.day} 天菜單 (目標：${targets.calories} kcal)
          </h2>
          <span style="font-size: 0.85rem; font-weight: bold; color: #047857; background: #d1fae5; padding: 4px 12px; border-radius: 9999px;">
            實得 ${dayData.stats.calories} kcal · PRO ${Math.round(dayData.stats.p)}g
          </span>
        </div>

        <div style="padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; font-size: 0.85rem; margin-bottom: 1.25rem;">
          <div><span style="color:#64748b;">熱量：</span><b>${dayData.stats.calories}</b> kcal</div>
          <div><span style="color:#64748b;">蛋白質：</span><b>${Math.round(dayData.stats.p)}</b> g</div>
          <div><span style="color:#64748b;">脂肪：</span><b>${Math.round(dayData.stats.f)}</b> g</div>
          <div><span style="color:#64748b;">碳水：</span><b>${Math.round(dayData.stats.c)}</b> g</div>
          <div><span style="color:#64748b;">纖維：</span><b>${Math.round(dayData.stats.fiber)}</b> g</div>
          <div><span style="color:#64748b;">鈉：</span><b>${Math.round(dayData.stats.na)}</b> mg</div>
          <div><span style="color:#64748b;">鉀：</span><b>${Math.round(dayData.stats.k)}</b> mg</div>
          <div><span style="color:#64748b;">鈣：</span><b>${Math.round(dayData.stats.ca)}</b> mg</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${dayData.meals.map(meal => `
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #fafafa;">
              <h3 style="font-size: 0.95rem; font-weight: bold; margin-top: 0; margin-bottom: 8px; color: ${meal.isMain ? '#4338ca' : '#ea580c'}; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 4px;">
                ${meal.name}
              </h3>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem; line-height: 1.7;">
                ${meal.isMain ? `
                  ${meal.carb ? `<li>🌾 <b>[${meal.carb.method || '一般'}]</b> ${meal.carb.item.name} <span style="color:#64748b;">- ${meal.carb.weight}g ${meal.carb.oil > 0 ? `(用油 ${meal.carb.oil}g)` : ''}</span></li>` : ''}
                  ${meal.protein ? `<li>🐟 <b>[${meal.protein.method || '一般'}]</b> ${meal.protein.item.name} <span style="color:#64748b;">- ${meal.protein.weight}g ${meal.protein.oil > 0 ? `(用油 ${meal.protein.oil}g)` : ''}</span></li>` : ''}
                  ${meal.side ? `<li>🍳 <b>[${meal.side.method || '一般'}]</b> ${meal.side.item.name} <span style="color:#64748b;">- ${meal.side.weight}g ${meal.side.oil > 0 ? `(用油 ${meal.side.oil}g)` : ''}</span></li>` : ''}
                  ${meal.veggie ? `<li>🥬 <b>[${meal.veggie.method || '一般'}]</b> ${meal.veggie.item.name} <span style="color:#64748b;">- ${meal.veggie.weight}g ${meal.veggie.oil > 0 ? `(用油 ${meal.veggie.oil}g)` : ''}</span></li>` : ''}
                  ${meal.extra ? meal.extra.map(ex => `<li>🍽️ <b>[加選]</b> ${ex.name} <span style="color:#64748b;">- ${ex.weight}g</span></li>`).join('') : ''}
                ` : `
                  ${meal.items ? meal.items.map(it => `<li>🍪 <b>[點心]</b> ${it.name} <span style="color:#64748b;">- ${it.weight}g</span></li>`).join('') : ''}
                `}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>臨床客製化營養菜單 (${targetDays.length}天計畫)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f1f5f9; color: #1e293b; padding: 2rem; max-width: 1000px; margin: 0 auto; }
    h1 { font-size: 1.8rem; margin-bottom: 0.25rem; text-align: center; color: #0f172a; }
    .subtitle { text-align: center; color: #64748b; margin-bottom: 2rem; font-size: 0.95rem; }
    .print-btn { display: block; margin: 0 auto 1.5rem auto; background: #059669; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ 列印或存為 PDF</button>
  <h1>📊 臨床客製化營養菜單計畫</h1>
  <div class="subtitle">
    處方型態：${clientDietName} · 目標：${targets.calories} kcal / PRO ${targets.protein}g · 計畫共 ${targetDays.length} 天<br/>
    <span style="display: inline-block; margin-top: 6px; color: #059669; font-weight: bold; font-size: 0.9rem;">版權宣告所有人：richardmimic / 營養吳理</span>
  </div>
  ${daysHtml}
  <footer style="text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #64748b; line-height: 1.6;">
    由 營養師專業臨床工具包 (Dietitian Pro Suite) 生成 · 衛福部 TFDA 資料庫依歸<br/>
    <b>版權宣告所有人：richardmimic / 營養吳理</b> (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = onlyCurrentDay 
      ? `臨床菜單_第${activeDayTab}天_${new Date().toISOString().slice(0, 10)}.html`
      : `臨床菜單_${targetDays.length}天計畫_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 匯出生成菜單為 CSV 試算表 (包含全部 33 種營養素，相容 Microsoft Excel)
  const handleExportCsv = (onlyCurrentDay = false) => {
    if (!generatedMenu || generatedMenu.length === 0) return;

    const targetDays = onlyCurrentDay 
      ? generatedMenu.filter(d => d.day === activeDayTab)
      : generatedMenu;

    const metaHeaderRows = [
      ["【臨床客製化營養菜單計畫 (全33項營養素)】"],
      ["版權宣告所有人", "richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"],
      ["臨床處方型態", clientDietName],
      ["目標熱量", `${targets.calories} kcal`],
      ["目標蛋白質", `${targets.protein} g`],
      ["計畫天數", `${targetDays.length} 天`],
      ["匯出時間", `${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}`],
      ["資料來源", "台灣衛生福利部食品藥物管理署 (TFDA) 食品營養成分資料庫"],
      []
    ];

    const headers = [
      "天數", "餐別", "料理類別", "食材品名", "烹調方式", "食用重量(g)", "烹調用油品項", "用油量(g)",
      "熱量(kcal)", "水分(g)", "粗蛋白質(g)", "粗脂肪(g)", "飽和脂肪(g)", "單元不飽和(g)", "多元不飽和(g)", "膽固醇(mg)",
      "總碳水化合物(g)", "膳食纖維(g)", "糖質總量(g)", "灰分(g)", "鈉(mg)", "鉀(mg)", "鈣(mg)", "鎂(mg)", "磷(mg)",
      "鐵(mg)", "鋅(mg)", "銅(mg)", "錳(mg)", "維生素A(ug RAE)", "α-胡蘿蔔素(ug)", "β-胡蘿蔔素(ug)",
      "維生素D(ug)", "維生素E(mg)", "維生素C(mg)", "維生素B1(mg)", "維生素B2(mg)", "菸鹼素(mg NE)", "維生素B6(mg)", "維生素B12(ug)", "葉酸(mcg)"
    ];

    const rows: (string | number)[][] = [];

    targetDays.forEach(dayData => {
      // 每一天的計畫摘要標題
      rows.push([
        `第 ${dayData.day} 天菜單計畫`,
        `目標熱量: ${targets.calories} kcal`,
        `目標蛋白: ${targets.protein} g`,
        `實際熱量: ${dayData.stats.calories} kcal`,
        `實際蛋白質: ${Math.round(dayData.stats.p)} g`,
        `實際脂肪: ${Math.round(dayData.stats.f)} g`,
        `實際碳水: ${Math.round(dayData.stats.c)} g`,
        `纖維: ${Math.round(dayData.stats.fiber)} g`,
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);

      dayData.meals.forEach(meal => {
        const mealOil = meal.oilName || '烹調植物油';
        if (meal.isMain) {
          const dishes = [
            { cat: '主食澱粉', dish: meal.carb },
            { cat: '主菜蛋白質', dish: meal.protein },
            { cat: '副菜配菜', dish: meal.side },
            { cat: '蔬菜時蔬', dish: meal.veggie }
          ];

          dishes.forEach(({ cat, dish }) => {
            if (dish) {
              const n = extractFoodNutrientsForDish(dish.item, dish.weight, dish.oil, mealOil);
              rows.push([
                `第 ${dayData.day} 天`,
                meal.name,
                cat,
                `"${dish.item.name.replace(/"/g, '""')}"`,
                dish.method || '一般烹調',
                dish.weight,
                (dish.oil || 0) > 0 ? `"${mealOil.replace(/"/g, '""')}"` : '無額外用油',
                dish.oil || 0,
                n.kcal, n.water, n.pro, n.fat, n.satFat, n.mufa, n.pufa, n.chol,
                n.cho, n.fiber, n.sugar, n.ash, n.na, n.k, n.ca, n.mg, n.p,
                n.fe, n.zn, n.cu, n.mn, n.vitA, n.alphaCaro, n.betaCaro,
                n.vitD, n.vitE, n.vitC, n.vitB1, n.vitB2, n.niacin, n.vitB6, n.vitB12, n.folate
              ]);
            }
          });

          if (meal.extra && meal.extra.length > 0) {
            meal.extra.forEach(ex => {
              const n = extractFoodNutrientsForDish(ex, ex.weight, ex.oil || 0, '無額外用油');
              rows.push([
                `第 ${dayData.day} 天`,
                meal.name,
                '加選配料',
                `"${ex.name.replace(/"/g, '""')}"`,
                ex.method || '搭配',
                ex.weight,
                '無額外用油',
                0,
                n.kcal, n.water, n.pro, n.fat, n.satFat, n.mufa, n.pufa, n.chol,
                n.cho, n.fiber, n.sugar, n.ash, n.na, n.k, n.ca, n.mg, n.p,
                n.fe, n.zn, n.cu, n.mn, n.vitA, n.alphaCaro, n.betaCaro,
                n.vitD, n.vitE, n.vitC, n.vitB1, n.vitB2, n.niacin, n.vitB6, n.vitB12, n.folate
              ]);
            });
          }
        } else if (meal.items && meal.items.length > 0) {
          meal.items.forEach(it => {
            const n = extractFoodNutrientsForDish(it, it.weight, 0, '無用油');
            rows.push([
              `第 ${dayData.day} 天`,
              meal.name,
              '點心輕食',
              `"${it.name.replace(/"/g, '""')}"`,
              '即食',
              it.weight,
              '無用油',
              0,
              n.kcal, n.water, n.pro, n.fat, n.satFat, n.mufa, n.pufa, n.chol,
              n.cho, n.fiber, n.sugar, n.ash, n.na, n.k, n.ca, n.mg, n.p,
              n.fe, n.zn, n.cu, n.mn, n.vitA, n.alphaCaro, n.betaCaro,
              n.vitD, n.vitE, n.vitC, n.vitB1, n.vitB2, n.niacin, n.vitB6, n.vitB12, n.folate
            ]);
          });
        }
      });

      // 當日加總統計列 (全日營養總計)
      rows.push([
        `第 ${dayData.day} 天 總計`,
        "【全日營養加總】",
        "-", "-", "-", "-", "-", "-",
        dayData.stats.calories,
        "-",
        Math.round(dayData.stats.p),
        Math.round(dayData.stats.f),
        "-", "-", "-", "-",
        Math.round(dayData.stats.c),
        Math.round(dayData.stats.fiber),
        "-", "-",
        Math.round(dayData.stats.na),
        Math.round(dayData.stats.k),
        Math.round(dayData.stats.ca),
        Math.round(dayData.stats.mag),
        Math.round(dayData.stats.phos),
        Number(dayData.stats.fe.toFixed(1)),
        Number(dayData.stats.zn.toFixed(1)),
        Number((dayData.stats.cu || 0).toFixed(2)),
        Number((dayData.stats.mn || 0).toFixed(2)),
        Math.round(dayData.stats.vitA),
        "-", "-",
        Number((dayData.stats.vitD || 0).toFixed(1)),
        Number((dayData.stats.vitE || 0).toFixed(1)),
        "-",
        Number((dayData.stats.b1 || 0).toFixed(2)),
        Number((dayData.stats.b2 || 0).toFixed(2)),
        Number((dayData.stats.niacin || 0).toFixed(1)),
        Number((dayData.stats.b6 || 0).toFixed(2)),
        Number((dayData.stats.b12 || 0).toFixed(2)),
        Math.round(dayData.stats.folic)
      ]);
      rows.push([]); // 空行隔開不同日
    });

    const csvContent = "\uFEFF" + [
      ...metaHeaderRows.map(r => r.join(",")),
      headers.join(","),
      ...rows.map(e => e.join(",")),
      [],
      ["* 菜單由營養師專業臨床工具包生成 · 版權宣告所有人：richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"]
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = onlyCurrentDay 
      ? `臨床客製化菜單_第${activeDayTab}天_${new Date().toISOString().slice(0, 10)}.csv`
      : `臨床客製化菜單_${targetDays.length}天計畫_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 一鍵將特定天數的菜單匯入「飲食評估與分析記錄」
  const handleImportDayToAnalyzer = (dayIdx: number) => {
    const dayData = generatedMenu[dayIdx];
    if (!dayData) return;

    const basketItems: BasketItem[] = [];

    dayData.meals.forEach((m) => {
      let mealType: MealType = 'lunch';
      if (m.name.includes('早') && !m.name.includes('點')) mealType = 'breakfast';
      else if (m.name.includes('午') && !m.name.includes('點')) mealType = 'lunch';
      else if (m.name.includes('晚') && !m.name.includes('點')) mealType = 'dinner';
      else mealType = 'snack';

      const convertToFoodItem = (
        pItem: FoodItemForPlanner, 
        weight: number, 
        methodDesc?: string, 
        oilGrams?: number, 
        oilName?: string
      ) => {
        // 嘗試在完整食物資料庫 (TFDA 2,213項或離線精選庫) 中比對同名食材以提取實驗室化驗數據
        const cleanPName = pItem.name.replace(/\(.*\)/g, '').trim();
        const matchedFood = availableFoods.find(f => 
          f.name === pItem.name || 
          f.name.replace(/\(.*\)/g, '').trim() === cleanPName ||
          f.name.includes(cleanPName) ||
          cleanPName.includes(f.name)
        );

        // 各大類臨床常模參考值 (每 100g 估算值，確保無一營養素為 0)
        const getClinicalFallbacks = () => {
          const t = pItem.type || '';
          if (t === 'proteins' || t === 'sides') {
            return {
              vitB1: 0.18,
              vitB2: 0.28,
              niacin: 7.2,
              vitB6: 0.45,
              vitB12: Number(((pItem.b12 || 0.015) * 100).toFixed(2)),
              vitE: 0.6,
              cu: 0.12,
              mn: 0.06
            };
          }
          if (t === 'carbs' || t === 'snackCarbs') {
            return {
              vitB1: 0.16,
              vitB2: 0.05,
              niacin: 2.2,
              vitB6: 0.24,
              vitB12: Number(((pItem.b12 || 0) * 100).toFixed(2)),
              vitE: 0.4,
              cu: 0.22,
              mn: 1.15
            };
          }
          if (t === 'veggies') {
            return {
              vitB1: 0.09,
              vitB2: 0.13,
              niacin: 1.1,
              vitB6: 0.19,
              vitB12: Number(((pItem.b12 || 0) * 100).toFixed(2)),
              vitE: 1.3,
              cu: 0.12,
              mn: 0.36
            };
          }
          if (t === 'dairy' || t === 'fruits') {
            return {
              vitB1: 0.06,
              vitB2: 0.22,
              niacin: 0.6,
              vitB6: 0.08,
              vitB12: Number(((pItem.b12 || 0.005) * 100).toFixed(2)),
              vitE: 0.3,
              cu: 0.06,
              mn: 0.04
            };
          }
          return {
            vitB1: 0.10,
            vitB2: 0.12,
            niacin: 1.8,
            vitB6: 0.18,
            vitB12: Number(((pItem.b12 || 0.002) * 100).toFixed(2)),
            vitE: 0.5,
            cu: 0.10,
            mn: 0.15
          };
        };

        const fb = getClinicalFallbacks();

        const itemFood: FoodItem = {
          id: `planner_${pItem.name}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: pItem.name,
          catName: pItem.type ? getLabelForType(pItem.type) : '菜單食材',
          kcal: matchedFood ? matchedFood.kcal : Math.round(((pItem.p * 4) + (pItem.c * 4) + (pItem.f * 9)) * 100),
          water: matchedFood ? matchedFood.water : 75,
          pro: Number((pItem.p * 100).toFixed(1)),
          fat: Number((pItem.f * 100).toFixed(1)),
          satFat: matchedFood ? matchedFood.satFat : Number((pItem.f * 30).toFixed(1)),
          mufa: matchedFood ? matchedFood.mufa : Number((pItem.f * 40).toFixed(1)),
          pufa: matchedFood ? matchedFood.pufa : Number((pItem.f * 30).toFixed(1)),
          chol: matchedFood ? matchedFood.chol : 0,
          cho: Number((pItem.c * 100).toFixed(1)),
          fiber: Number((pItem.fiber * 100).toFixed(1)),
          sugar: matchedFood ? matchedFood.sugar : 0,
          ash: matchedFood ? matchedFood.ash : 1,
          na: Math.round(pItem.na * 100),
          k: Math.round(pItem.k * 100),
          ca: Math.round(pItem.ca * 100),
          mg: Math.round(pItem.mag * 100),
          p: Math.round(pItem.phos * 100),
          fe: Number((pItem.fe * 100).toFixed(1)),
          zn: Number((pItem.zn * 100).toFixed(1)),
          cu: matchedFood ? matchedFood.cu : (pItem.cu ? Number((pItem.cu * 100).toFixed(2)) : fb.cu),
          mn: matchedFood ? matchedFood.mn : (pItem.mn ? Number((pItem.mn * 100).toFixed(2)) : fb.mn),
          folate: matchedFood ? matchedFood.folate : Math.round(pItem.folic * 100),
          vitA: Math.round(pItem.vitA * 100),
          alphaCaro: matchedFood ? matchedFood.alphaCaro : 0,
          betaCaro: matchedFood ? matchedFood.betaCaro : 0,
          vitD: matchedFood ? matchedFood.vitD : Number(((pItem.vitD || 0) * 100).toFixed(2)),
          vitE: matchedFood ? matchedFood.vitE : (pItem.vitE ? Number((pItem.vitE * 100).toFixed(1)) : fb.vitE),
          vitB1: matchedFood ? matchedFood.vitB1 : (pItem.b1 ? Number((pItem.b1 * 100).toFixed(2)) : fb.vitB1),
          vitB2: matchedFood ? matchedFood.vitB2 : (pItem.b2 ? Number((pItem.b2 * 100).toFixed(2)) : fb.vitB2),
          niacin: matchedFood ? matchedFood.niacin : (pItem.niacin ? Number((pItem.niacin * 100).toFixed(1)) : fb.niacin),
          vitB6: matchedFood ? matchedFood.vitB6 : (pItem.b6 ? Number((pItem.b6 * 100).toFixed(2)) : fb.vitB6),
          vitB12: matchedFood ? matchedFood.vitB12 : (pItem.b12 ? Number((pItem.b12 * 100).toFixed(2)) : fb.vitB12),
          vitC: matchedFood ? matchedFood.vitC : 5,
          icon: getIconForType(pItem.type),
          note: methodDesc ? `烹調: ${methodDesc}` : ''
        };

        const cOilGrams = Number(oilGrams) || 0;
        const cOilName = cOilGrams > 0 ? (oilName || '橄欖油 (高單元不飽和 MUFA)') : '無用油 / 不額外加油';

        basketItems.push({
          id: itemFood.id,
          food: itemFood,
          portionGrams: weight,
          mealType,
          date: new Date().toISOString().slice(0, 10),
          note: methodDesc ? `${methodDesc}${cOilGrams > 0 ? ` (烹調油: ${cOilName.split(' ')[0]} ${cOilGrams}g)` : ''}` : undefined,
          cookingOilName: cOilName,
          cookingOilGrams: cOilGrams
        });
      };

      if (m.isMain) {
        const mealOil = m.oilName || '橄欖油 (高單元不飽和 MUFA)';
        if (m.carb && m.carb.weight > 0) convertToFoodItem(m.carb.item, m.carb.weight, m.carb.method, m.carb.oil, mealOil);
        if (m.protein && m.protein.weight > 0) convertToFoodItem(m.protein.item, m.protein.weight, m.protein.method, m.protein.oil, mealOil);
        if (m.side && m.side.weight > 0) convertToFoodItem(m.side.item, m.side.weight, m.side.method, m.side.oil, mealOil);
        if (m.veggie && m.veggie.weight > 0) convertToFoodItem(m.veggie.item, m.veggie.weight, m.veggie.method, m.veggie.oil, mealOil);
        if (m.extra) {
          m.extra.forEach(ex => {
            if (ex.weight > 0) convertToFoodItem(ex, ex.weight, ex.method, ex.oil, mealOil);
          });
        }
      } else if (m.items) {
        m.items.forEach(it => {
          if (it.weight > 0) convertToFoodItem(it, it.weight, it.method, it.oil, m.oilName);
        });
      }
    });

    onImportToAnalyzer(basketItems);
    showToast(`已將第 ${dayData.day} 天菜單 (${basketItems.length} 項食材) 匯入飲食評估！`, `可前往「飲食分析評估」工具進行詳細 DRIs 比對`);
  };

  const cCal = targets.calories || 1;
  const pPct = Math.round((targets.protein * 4 / cCal) * 100) || 0;
  const cPct = Math.round((targets.carbs * 4 / cCal) * 100) || 0;
  const fPct = Math.max(0, 100 - pPct - cPct);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-full">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-11/12 bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold">{notification.message}</p>
            {notification.sub && <p className="text-[10px] text-emerald-300">{notification.sub}</p>}
          </div>
        </div>
      )}

      {/* Generator Tool Sub-Header */}
      <div className="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>進階臨床營養菜單生成器</span>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold border border-indigo-200">
                100% 離線運算
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">
              處方目標：{clientDietName} · {targets.calories} kcal · PRO {targets.protein}g
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleApplyClientGoals}
            className="touch-press text-[10px] text-indigo-700 hover:text-indigo-900 font-bold bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1 transition"
            title="帶入個案處方設定之目標熱量與蛋白質"
          >
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>帶入個案處方</span>
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`touch-press text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1 ${
              isSidebarOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>參數設定</span>
          </button>
        </div>
      </div>

      {/* Generator Main Layout */}
      <div className="p-3.5 space-y-3.5">
        {/* Expandable Parameters Panel */}
        {isSidebarOpen && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>菜單生成條件與營養素配比</span>
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsTdeeMode(false)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${!isTdeeMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  手動輸入
                </button>
                <button
                  onClick={() => setIsTdeeMode(true)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${isTdeeMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  TDEE 試算
                </button>
              </div>
            </div>

            {/* Days slider */}
            <div className="space-y-1 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>生成天數：</span>
                <span className="text-indigo-700 font-mono font-black">{numDays} 天菜單</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={numDays}
                onChange={(e) => setNumDays(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* TDEE Mode Panel */}
            {isTdeeMode && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setTdeeParams(prev => ({ ...prev, gender: 'male' }))}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${tdeeParams.gender === 'male' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      男性
                    </button>
                    <button
                      onClick={() => setTdeeParams(prev => ({ ...prev, gender: 'female' }))}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${tdeeParams.gender === 'female' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                      女性
                    </button>
                  </div>
                  <div className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400">年齡:</span>
                    <input
                      type="number"
                      value={tdeeParams.age}
                      onChange={(e) => setTdeeParams(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full text-right font-mono font-bold text-xs outline-none"
                    />
                    <span className="text-[10px] text-slate-400">歲</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400">身高:</span>
                    <input
                      type="number"
                      value={tdeeParams.height}
                      onChange={(e) => setTdeeParams(prev => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full text-right font-mono font-bold text-xs outline-none"
                    />
                    <span className="text-[10px] text-slate-400">cm</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400">體重:</span>
                    <input
                      type="number"
                      value={tdeeParams.weight}
                      onChange={(e) => setTdeeParams(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="w-full text-right font-mono font-bold text-xs outline-none"
                    />
                    <span className="text-[10px] text-slate-400">kg</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <select
                    value={tdeeParams.pal}
                    onChange={(e) => setTdeeParams(prev => ({ ...prev, pal: Number(e.target.value) }))}
                    className="flex-1 bg-white border border-slate-200 rounded p-1 text-[10px] font-bold text-slate-700 outline-none"
                  >
                    <option value={1.2}>1.2 - 幾乎不動</option>
                    <option value={1.375}>1.375 - 輕度活動 (每週運動1-3天)</option>
                    <option value={1.55}>1.55 - 中度活動 (每週運動3-5天)</option>
                    <option value={1.725}>1.725 - 高度活動 (每週運動6-7天)</option>
                  </select>
                  <button
                    onClick={handleCalcTdee}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] shadow-2xs"
                  >
                    計算 TDEE
                  </button>
                </div>
              </div>
            )}

            {/* Macro Goals & Sliders */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">單日總熱量目標：</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={targets.calories}
                    onChange={(e) => handleMacroInputChange('calories', Number(e.target.value))}
                    className="w-20 text-center font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg py-0.5 text-xs outline-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400">kcal</span>
                </div>
              </div>

              {/* Protein Slider */}
              <div className="space-y-1 bg-rose-50/60 p-2 rounded-xl border border-rose-200">
                <div className="flex justify-between text-[10px] font-bold text-rose-800">
                  <span>1. 蛋白質 (PRO)：{targets.protein}g</span>
                  <span>{pPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={pPct}
                  onChange={(e) => handleMacroSliderChange('p', parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Carbs Slider */}
              <div className="space-y-1 bg-amber-50/60 p-2 rounded-xl border border-amber-200">
                <div className="flex justify-between text-[10px] font-bold text-amber-800">
                  <span>2. 碳水化合物 (CHO)：{targets.carbs}g</span>
                  <span>{cPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={cPct}
                  onChange={(e) => handleMacroSliderChange('c', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Fat Slider */}
              <div className="space-y-1 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                  <span>3. 脂肪 (FAT)：{targets.fat}g</span>
                  <span>{fPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={fPct}
                  onChange={(e) => handleMacroSliderChange('f', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* HBV Protein Ratio */}
              <div className="space-y-1 bg-sky-50/60 p-2 rounded-xl border border-sky-200">
                <div className="flex justify-between text-[10px] font-bold text-sky-800">
                  <span>主菜及乳品佔比 (HBV 高生物價)：</span>
                  <span>{hbvRatio}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={hbvRatio}
                  onChange={(e) => setHbvRatio(parseInt(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Meal switches */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">正餐設定：</span>
                <div className="flex space-x-1">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((m, i) => (
                    <button
                      key={m}
                      onClick={() => setMealsConfig(prev => ({ ...prev, [m]: !prev[m] }))}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        mealsConfig[m] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {['早', '午', '晚'][i]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">點心加配：</span>
                <div className="flex space-x-1">
                  {(['morning', 'afternoon', 'evening'] as const).map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setSnacksConfig(prev => ({ ...prev, [s]: !prev[s] }))}
                      className={`flex-1 py-1 rounded text-[10px] font-bold ${
                        snacksConfig[s] ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {['早點', '午點', '晚點'][i]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons in panel */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleGenerate}
                className="touch-press w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1.5 transition"
              >
                <Utensils className="w-4 h-4" />
                <span>立即一鍵重新生成菜單</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  onClick={() => handleExportCsv(false)}
                  className="touch-press py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold flex items-center justify-center gap-1 shadow-2xs"
                  title="匯出生成之完整多日菜單為 CSV 試算表 (相容 Excel)"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                  <span>匯出菜單 CSV</span>
                </button>
                <button
                  onClick={() => handleExportHtml(false)}
                  className="touch-press py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 rounded-lg font-bold flex items-center justify-center gap-1 shadow-2xs"
                  title="匯出離線 HTML 菜單檔案"
                >
                  <Download className="w-3 h-3 text-indigo-700" />
                  <span>匯出 HTML</span>
                </button>
                <button
                  onClick={() => document.getElementById(fileInputId)?.click()}
                  className="touch-press py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3 text-sky-600" />
                  <span>匯入自訂 CSV</span>
                </button>
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="touch-press py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                  <span>下載 CSV 範本</span>
                </button>
                <input
                  type="file"
                  id={fileInputId}
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </div>
              <div className="text-center text-[9px] text-slate-400 font-medium pt-1">
                版權宣告所有人：richardmimic / 營養吳理
              </div>
            </div>
          </div>
        )}

        {/* Days Tab Selector & View Mode Switcher */}
        {generatedMenu && generatedMenu.length > 0 && (
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 gap-1 flex-wrap">
              <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
                {generatedMenu.map((d) => (
                  <button
                    key={d.day}
                    onClick={() => { setActiveDayTab(d.day); setShowAllDays(false); }}
                    className={`touch-press px-2.5 py-1 rounded-lg text-xs font-black transition flex-shrink-0 ${
                      !showAllDays && activeDayTab === d.day
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    第 {d.day} 天
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => handleExportCsv(false)}
                  className="touch-press text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1 shadow-2xs"
                  title="匯出多日菜單為 CSV 試算表 (相容 Excel)"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                  <span>匯出 CSV</span>
                </button>
                <button
                  onClick={() => handleExportHtml(false)}
                  className="touch-press text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition flex items-center gap-1 shadow-2xs"
                  title="匯出離線 HTML 菜單檔案"
                >
                  <Download className="w-3 h-3 text-indigo-700" />
                  <span>HTML</span>
                </button>
                <button
                  onClick={() => setShowAllDays(!showAllDays)}
                  className={`touch-press text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                    showAllDays ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {showAllDays ? '單日' : '全天'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render Generated Menu Day(s) */}
        {generatedMenu && generatedMenu.length > 0 && (
          <div className="space-y-4">
            {generatedMenu
              .filter(d => showAllDays || d.day === activeDayTab)
              .map((dayData, dIdx) => {
                const dayIndexInState = generatedMenu.findIndex(g => g.day === dayData.day);
                const isCalorieOk = Math.abs(dayData.stats.calories - targets.calories) <= 80;

                return (
                  <div key={dayData.day} className="space-y-3">
                    {/* Day Banner & Quick Import Button */}
                    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 shadow-md border border-indigo-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black">第 {dayData.day} 天菜單</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                            isCalorieOk ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {dayData.stats.calories} kcal / 目標 {targets.calories}k
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          P: {Math.round(dayData.stats.p)}g · F: {Math.round(dayData.stats.f)}g · C: {Math.round(dayData.stats.c)}g · 纖維 {Math.round(dayData.stats.fiber)}g
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <button
                          onClick={() => handleExportCsv(true)}
                          className="touch-press text-[10px] font-bold bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white px-2 py-1.5 rounded-xl border border-white/20 shadow-xs flex items-center gap-1 transition"
                          title="匯出此日菜單為 CSV 試算表 (包含全項 33 種營養素)"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>本日 CSV</span>
                        </button>
                        <button
                          onClick={() => handleExportHtml(true)}
                          className="touch-press text-[10px] font-bold bg-white/10 hover:bg-white/20 text-teal-300 hover:text-white px-2 py-1.5 rounded-xl border border-white/20 shadow-xs flex items-center gap-1 transition"
                          title="匯出此日菜單為獨立 HTML 檔案 (支援列印)"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>本日 HTML</span>
                        </button>
                        <button
                          onClick={() => handleImportDayToAnalyzer(dayIndexInState)}
                          className="touch-press text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition"
                          title="將此天菜單帶入飲食評估記錄進行 DRIs 分析"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>帶入飲食評估</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Daily Micro-nutrient Grid */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          <span>全日微量元素與電解質即時統計</span>
                        </span>
                        <span className="text-[9px] text-slate-400">依配料及烹調用油自動累計</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="text-[9px] text-slate-400">鈉 Na</div>
                          <div className="text-xs font-black font-mono text-slate-800">{Math.round(dayData.stats.na)} <span className="text-[8px] font-normal">mg</span></div>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="text-[9px] text-slate-400">鉀 K</div>
                          <div className="text-xs font-black font-mono text-slate-800">{Math.round(dayData.stats.k)} <span className="text-[8px] font-normal">mg</span></div>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="text-[9px] text-slate-400">磷 Phos</div>
                          <div className="text-xs font-black font-mono text-slate-800">{Math.round(dayData.stats.phos)} <span className="text-[8px] font-normal">mg</span></div>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="text-[9px] text-slate-400">鈣 Ca</div>
                          <div className="text-xs font-black font-mono text-slate-800">{Math.round(dayData.stats.ca)} <span className="text-[8px] font-normal">mg</span></div>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="text-[9px] text-slate-400">鎂 Mag</div>
                          <div className="text-xs font-black font-mono text-slate-800">{Math.round(dayData.stats.mag)} <span className="text-[8px] font-normal">mg</span></div>
                        </div>

                        <div className="bg-blue-50/60 p-1.5 rounded-lg border border-blue-100">
                          <div className="text-[9px] text-blue-700">Vit B12</div>
                          <div className="text-xs font-black font-mono text-blue-900">{dayData.stats.b12.toFixed(1)} <span className="text-[8px] font-normal">ug</span></div>
                        </div>
                        <div className="bg-amber-50/60 p-1.5 rounded-lg border border-amber-100">
                          <div className="text-[9px] text-amber-700">Vit A</div>
                          <div className="text-xs font-black font-mono text-amber-900">{Math.round(dayData.stats.vitA)} <span className="text-[8px] font-normal">ug</span></div>
                        </div>
                        <div className="bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                          <div className="text-[9px] text-emerald-700">葉酸</div>
                          <div className="text-xs font-black font-mono text-emerald-900">{Math.round(dayData.stats.folic)} <span className="text-[8px] font-normal">ug</span></div>
                        </div>
                        <div className="bg-purple-50/60 p-1.5 rounded-lg border border-purple-100">
                          <div className="text-[9px] text-purple-700">Vit D</div>
                          <div className="text-xs font-black font-mono text-purple-900">{dayData.stats.vitD.toFixed(1)} <span className="text-[8px] font-normal">ug</span></div>
                        </div>
                        <div className="bg-rose-50/60 p-1.5 rounded-lg border border-rose-100">
                          <div className="text-[9px] text-rose-700">鐵 Fe</div>
                          <div className="text-xs font-black font-mono text-rose-900">{dayData.stats.fe.toFixed(1)} <span className="text-[8px] font-normal">mg</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Meals Cards */}
                    <div className="space-y-3">
                      {dayData.meals.map((meal, mIdx) => {
                        const isMain = meal.isMain;

                        // Render dish row
                        const renderDishRow = (
                          dishKey: 'carb' | 'protein' | 'side' | 'veggie',
                          label: string,
                          icon: string,
                          dbCategory: keyof typeof foodDb
                        ) => {
                          const dish = meal[dishKey];
                          if (!dish) return null;

                          return (
                            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-1 flex-1 min-w-0 mr-2">
                                  <span>{icon}</span>
                                  {/* Cooking Method selector */}
                                  <select
                                    value={dish.method}
                                    onChange={(e) => {
                                      const newMethod = e.target.value;
                                      updateMenuData(dayIndexInState, mIdx, m => {
                                        if (m[dishKey]) {
                                          m[dishKey]!.method = newMethod;
                                          m[dishKey]!.oil = getOilGramsForMethod(newMethod);
                                        }
                                      });
                                    }}
                                    className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                                  >
                                    {!COOKING_METHODS.includes(dish.method) && (
                                      <option value={dish.method}>{dish.method}</option>
                                    )}
                                    {COOKING_METHODS.map(met => (
                                      <option key={met} value={met}>{met}</option>
                                    ))}
                                  </select>

                                  {/* Food selector */}
                                  <select
                                    value={dish.item.name}
                                    onChange={(e) => {
                                      const found = (foodDb[dbCategory] as FoodItemForPlanner[]).find(f => f.name === e.target.value);
                                      if (found) {
                                        updateMenuData(dayIndexInState, mIdx, m => {
                                          if (m[dishKey]) {
                                            m[dishKey]!.item = found;
                                          }
                                        });
                                      }
                                    }}
                                    className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 outline-none flex-1 truncate cursor-pointer"
                                  >
                                    {(foodDb[dbCategory] as FoodItemForPlanner[]).map(o => (
                                      <option key={o.name} value={o.name}>{o.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <input
                                    type="number"
                                    min="1"
                                    value={dish.weight || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      updateMenuData(dayIndexInState, mIdx, m => {
                                        if (m[dishKey]) {
                                          m[dishKey]!.weight = val;
                                        }
                                      });
                                    }}
                                    className="w-12 text-center font-bold font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500">g</span>
                                  <span className="text-[9px] text-slate-400 font-mono w-14 text-right">
                                    約 {(dish.weight / (dish.item.uW || 1)).toFixed(1).replace('.0', '')} {dish.item.unit}
                                  </span>
                                  <button
                                    onClick={() => {
                                      updateMenuData(dayIndexInState, mIdx, m => {
                                        m[dishKey] = null;
                                      });
                                    }}
                                    className="text-slate-300 hover:text-red-500 p-0.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Oil Row if oil > 0 */}
                              {dish.oil > 0 && (
                                <div className="flex items-center justify-end text-[10px] text-amber-700 space-x-1 font-mono">
                                  <span>💧 用油:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={dish.oil}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      updateMenuData(dayIndexInState, mIdx, m => {
                                        if (m[dishKey]) {
                                          m[dishKey]!.oil = val;
                                          m[dishKey]!.method = getCookingMethod(val, dishKey === 'carb' ? 'carbs' : dishKey === 'protein' ? 'proteins' : dishKey === 'side' ? 'sides' : 'veggies', m[dishKey]!.item.name)[0];
                                        }
                                      });
                                    }}
                                    className="w-10 text-right bg-amber-100/60 font-bold border border-amber-200 rounded px-1 py-0.2 outline-none"
                                  />
                                  <span>g</span>
                                  <span className="text-slate-400">({(dish.oil / 5).toFixed(1).replace('.0', '')} 茶匙 {meal.oilName || '油'})</span>
                                </div>
                              )}
                            </div>
                          );
                        };

                        if (!isMain) {
                          // Snack Card
                          return (
                            <div key={mIdx} className="bg-amber-50/50 rounded-2xl p-3 border border-amber-200 space-y-2">
                              <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                                <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                                  <span>🍪</span>
                                  <span>{meal.name}</span>
                                </span>
                                <span className="text-[10px] text-amber-700 font-bold">點心點選</span>
                              </div>

                              <div className="space-y-1.5">
                                {meal.items?.map((item, iIdx) => (
                                  <div key={iIdx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-amber-100 text-xs">
                                    <div className="flex items-center space-x-1.5 flex-1 min-w-0 mr-2">
                                      <span>{getIconForType(item.type)}</span>
                                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                        {getLabelForType(item.type)}
                                      </span>
                                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                                    </div>

                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <input
                                        type="number"
                                        min="1"
                                        value={item.weight || ''}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          updateMenuData(dayIndexInState, mIdx, m => {
                                            if (m.items && m.items[iIdx]) {
                                              m.items[iIdx].weight = val;
                                            }
                                          });
                                        }}
                                        className="w-12 text-center font-bold font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none"
                                      />
                                      <span className="text-[10px] font-bold text-slate-500">g</span>
                                      <span className="text-[9px] text-slate-400 font-mono w-14 text-right">
                                        約 {(item.weight / (item.uW || 1)).toFixed(1).replace('.0', '')} {item.unit}
                                      </span>
                                      <button
                                        onClick={() => {
                                          updateMenuData(dayIndexInState, mIdx, m => {
                                            m.items?.splice(iIdx, 1);
                                          });
                                        }}
                                        className="text-slate-300 hover:text-red-500 p-0.5"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {/* Add Snack Item */}
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    let found: FoodItemForPlanner | undefined;
                                    let fType: any = 'snackCarbs';

                                    for (const cat of ALL_PLANNER_CATEGORIES) {
                                      const match = (foodDb[cat.type] as FoodItemForPlanner[]).find(x => x.name === val);
                                      if (match) {
                                        found = match;
                                        fType = cat.type;
                                        break;
                                      }
                                    }

                                    if (found) {
                                      updateMenuData(dayIndexInState, mIdx, m => {
                                        if (!m.items) m.items = [];
                                        m.items.push({ ...found!, weight: found!.uW || 100, type: fType });
                                      });
                                    }
                                  }}
                                  className="w-full bg-amber-100/60 border border-dashed border-amber-300 rounded-xl p-1.5 text-xs font-bold text-amber-900 text-center outline-none cursor-pointer"
                                >
                                  <option value="" disabled>➕ 加入點心品項...</option>
                                  {ALL_PLANNER_CATEGORIES.map(grp => (
                                    <optgroup key={grp.type} label={grp.label}>
                                      {(foodDb[grp.type] as FoodItemForPlanner[]).map(o => (
                                        <option key={o.name} value={o.name}>{o.name}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        }

                        // Main Meal Card
                        return (
                          <div key={mIdx} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{meal.name}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                用油配比：{meal.oilName || '橄欖油'}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {renderDishRow('carb', '主食', '🌾', 'carbs')}
                              {renderDishRow('protein', '蛋白質', '🐟', 'proteins')}
                              {renderDishRow('side', '副菜', '🍳', 'sides')}
                              {renderDishRow('veggie', '蔬菜', '🥬', 'veggies')}

                              {/* Extra Items in Main Meal */}
                              {meal.extra?.map((item, iIdx) => (
                                <div key={iIdx} className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-1.5 flex-1 min-w-0 mr-2">
                                    <span>{getIconForType(item.type)}</span>
                                    <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                                      附餐
                                    </span>
                                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                                  </div>

                                  <div className="flex items-center space-x-1 flex-shrink-0">
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.weight || ''}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateMenuData(dayIndexInState, mIdx, m => {
                                          if (m.extra && m.extra[iIdx]) {
                                            m.extra[iIdx].weight = val;
                                          }
                                        });
                                      }}
                                      className="w-12 text-center font-bold font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-slate-500">g</span>
                                    <span className="text-[9px] text-slate-400 font-mono w-14 text-right">
                                      約 {(item.weight / (item.uW || 1)).toFixed(1).replace('.0', '')} {item.unit}
                                    </span>
                                    <button
                                      onClick={() => {
                                        updateMenuData(dayIndexInState, mIdx, m => {
                                          m.extra?.splice(iIdx, 1);
                                        });
                                      }}
                                      className="text-slate-300 hover:text-red-500 p-0.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Add Extra Item */}
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let found: FoodItemForPlanner | undefined;
                                  let fType: any = 'carbs';

                                  for (const cat of ALL_PLANNER_CATEGORIES) {
                                    const match = (foodDb[cat.type] as FoodItemForPlanner[]).find(x => x.name === val);
                                    if (match) {
                                      found = match;
                                      fType = cat.type;
                                      break;
                                    }
                                  }

                                  if (found) {
                                    updateMenuData(dayIndexInState, mIdx, m => {
                                      if (!m.extra) m.extra = [];
                                      m.extra.push({ ...found!, weight: found!.uW || 100, type: fType });
                                    });
                                  }
                                }}
                                className="w-full bg-slate-100 hover:bg-slate-200/80 border border-dashed border-slate-300 rounded-xl p-1.5 text-xs font-bold text-slate-700 text-center outline-none cursor-pointer"
                              >
                                <option value="" disabled>➕ 加入自訂食材或附餐...</option>
                                {ALL_PLANNER_CATEGORIES.map(grp => (
                                  <optgroup key={grp.type} label={grp.label}>
                                    {(foodDb[grp.type] as FoodItemForPlanner[]).map(o => (
                                      <option key={o.name} value={o.name}>{o.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
