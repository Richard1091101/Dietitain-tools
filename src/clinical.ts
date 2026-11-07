import { FoodItem } from './types';

export interface SixFoodGroupPortions {
  cereals: number;   // 全穀雜糧類 (份) - 每份 15g 碳水, 2g 蛋白質, 70 kcal
  proteins: number;  // 豆魚蛋肉類 (份) - 每份 7g 蛋白質, ~3-5g 脂肪, ~55-75 kcal
  dairy: number;     // 乳品類 (份) - 每份 8g 蛋白質, 12g 碳水, 240mg 鈣, ~80-150 kcal
  vegetables: number;// 蔬菜類 (份) - 每份 5g 碳水, 1g 蛋白質, 25 kcal
  fruits: number;    // 水果類 (份) - 每份 15g 碳水, 60 kcal
  oils: number;      // 油脂與堅果種子類 (份) - 每份 5g 脂肪, 45 kcal
}

export type ClinicalDietType = 'normal' | 'ckd' | 'diabetes' | 'dash' | 'highProtein' | 'gout' | 'athleteStrength' | 'athleteEndurance';

export interface ClinicalDietConfig {
  name: string;
  badge: string;
  desc: string;
  proteinMultiplier: number; // g / kg IBW (理想體重)
  calorieMultiplier: number; // kcal / kg IBW
  naLimitMg: number;
  kLimitMg?: number;
  pLimitMg?: number;
  macroRatio: { pro: [number, number]; fat: [number, number]; cho: [number, number] };
  warningNotice: string;
}

export const CLINICAL_DIET_PRESETS: Record<ClinicalDietType, ClinicalDietConfig> = {
  normal: {
    name: '一般健康成人均衡飲食',
    badge: '均衡飲食',
    desc: '依衛福部國人膳食營養素參考攝取量 (DRIs 第八版)，三大營養素黃金熱量比 P:10-20%、F:20-30%、C:50-60%。',
    proteinMultiplier: 1.0,
    calorieMultiplier: 30,
    naLimitMg: 2300,
    macroRatio: { pro: [10, 20], fat: [20, 30], cho: [50, 60] },
    warningNotice: '適用無特定慢性代謝疾病者維持日常機能。'
  },
  athleteStrength: {
    name: '運動員處方：阻力肌力與增肌塑形 (Strength/Hypertrophy)',
    badge: '運動員·肌力增肌',
    desc: '高蛋白 (1.6 - 2.0 g/kg) 促進肌肉蛋白質合成 (MPS)，搭配充足熱量 (38-42 kcal/kg) 與高支鏈胺基酸(BCAA/白胺酸 Leucine)，支援高強度阻力重訓修復。',
    proteinMultiplier: 1.8,
    calorieMultiplier: 40,
    naLimitMg: 3000,
    macroRatio: { pro: [20, 25], fat: [20, 25], cho: [50, 60] },
    warningNotice: '訓練後 45 分鐘黃金修復窗需補充 P:C = 1:3~1:4，運動大量流汗需適當補充水分與電解質鈉鉀。'
  },
  athleteEndurance: {
    name: '運動員處方：耐力長跑與肝醣超補 (Endurance/Carbo-Loading)',
    badge: '運動員·耐力肝醣',
    desc: '極高碳水化合物 (60 - 70% 總熱量，醣量 6-10 g/kg) 飽和肌肉與肝臟肝醣存量，搭配適度蛋白質 (1.2 - 1.4 g/kg) 預防肌肉異化與提供持久有氧動能。',
    proteinMultiplier: 1.3,
    calorieMultiplier: 45,
    naLimitMg: 3500,
    macroRatio: { pro: [12, 16], fat: [18, 22], cho: [62, 70] },
    warningNotice: '長時間耐力運動 (>90分鐘) 需注意低血鈉症防範，大量出汗者鈉上限放寬至 3500 mg，運動前後應精準補水。'
  },
  ckd: {
    name: '慢性腎臟病 (CKD 3-5 期非洗腎)',
    badge: '低蛋白/限磷限鉀限鈉',
    desc: '低蛋白飲食 (0.6 - 0.8 g/kg)，嚴格監控鉀離子、磷、鈉，保護殘餘腎元延緩透析。',
    proteinMultiplier: 0.65,
    calorieMultiplier: 35,
    naLimitMg: 2000,
    kLimitMg: 2000,
    pLimitMg: 800,
    macroRatio: { pro: [8, 12], fat: [30, 35], cho: [55, 60] },
    warningNotice: '嚴禁楊桃、濃肉湯、生菜沙拉、低鈉鹽(含氯化鉀)及堅果過量。'
  },
  diabetes: {
    name: '糖尿病醣類計數與低升糖 (DM & GI)',
    badge: '固定醣量/高纖穩定血糖',
    desc: '醣類份數固定管理，強調未精緻複合碳水化合物，足量纖維 (25-35g)，減少精緻糖刺激。',
    proteinMultiplier: 1.1,
    calorieMultiplier: 28,
    naLimitMg: 2300,
    macroRatio: { pro: [15, 20], fat: [25, 30], cho: [45, 55] },
    warningNotice: '1 份醣 = 15g 碳水化合物，單餐需控管醣量並定時定量。'
  },
  dash: {
    name: 'DASH 得舒降壓飲食 (高血壓/心血管)',
    badge: '高鉀高鎂高鈣/低飽和脂肪',
    desc: '豐富鉀(>3500mg)、鎂、鈣、高纖，嚴控鈉 (<2000mg) 與飽和脂肪，促進血管擴張降血壓。',
    proteinMultiplier: 1.0,
    calorieMultiplier: 30,
    naLimitMg: 2000,
    macroRatio: { pro: [15, 20], fat: [20, 25], cho: [55, 60] },
    warningNotice: '若同時併發腎功能不全 (eGFR < 45)，切勿自行採取高鉀得舒飲食。'
  },
  highProtein: {
    name: '高蛋白高熱量營養支持 (肌少症/術後/透析)',
    badge: '組織修復/增加肌肉量',
    desc: '高蛋白 (1.2 - 1.5 g/kg)，補充支鏈胺基酸 (BCAA) 與充足熱量，預防肌肉萎縮與加速傷口癒合。',
    proteinMultiplier: 1.35,
    calorieMultiplier: 35,
    naLimitMg: 2300,
    macroRatio: { pro: [18, 25], fat: [25, 30], cho: [45, 55] },
    warningNotice: '適用透析洗腎病患、肌少症老年族群或外科重大手術復原期。'
  },
  gout: {
    name: '低普林與高水代謝 (痛風/高尿酸)',
    badge: '低普林/鹼化尿液',
    desc: '避免內臟、濃縮肉湯、酵母、帶殼貝類等高普林食材，大量飲水促尿酸排泄，限酒與高果糖漿。',
    proteinMultiplier: 1.0,
    calorieMultiplier: 30,
    naLimitMg: 2300,
    macroRatio: { pro: [12, 18], fat: [20, 25], cho: [55, 65] },
    warningNotice: '急性發作期需嚴格禁食高普林組別，每日水分應保持 2500-3000 ml 以上。'
  }
};

/**
 * 依據食材特性估算台灣國健署「六大類食物代換份數」
 */
export function estimateSixFoodPortions(food: FoodItem, grams: number): SixFoodGroupPortions {
  const ratio = (grams || 100) / 100;
  const cho = (food.cho || 0) * ratio;
  const pro = (food.pro || 0) * ratio;
  const fat = (food.fat || 0) * ratio;
  const ca = (food.ca || 0) * ratio;

  const cat = (food.catName || '').toLowerCase();
  const name = (food.name || '').toLowerCase();

  const portions: SixFoodGroupPortions = {
    cereals: 0,
    proteins: 0,
    dairy: 0,
    vegetables: 0,
    fruits: 0,
    oils: 0
  };

  // 乳品判定
  if (cat.includes('乳') || name.includes('鮮奶') || name.includes('優格') || name.includes('起司') || name.includes('奶粉')) {
    // 1份乳品: 8g 蛋白質, 12g 碳水
    const pPortion = pro / 8;
    const cPortion = cho / 12;
    portions.dairy = Number(Math.max(pPortion, cPortion).toFixed(1));
    return portions;
  }

  // 水果判定
  if (cat.includes('水果') || cat.includes('果品') || name.includes('蘋果') || name.includes('芭樂') || name.includes('香蕉') || name.includes('柑') || name.includes('橘')) {
    // 1份水果: 15g 碳水
    portions.fruits = Number((cho / 15).toFixed(1));
    return portions;
  }

  // 蔬菜判定
  if (cat.includes('蔬菜') || cat.includes('藻') || cat.includes('菇') || name.includes('菜') || name.includes('木耳') || name.includes('筍')) {
    // 100g 煮熟約 1 份蔬菜，或每 5g 碳水/1g 蛋白
    const gPortion = grams / 100;
    portions.vegetables = Number(Math.max(0.2, gPortion).toFixed(1));
    return portions;
  }

  // 豆魚蛋肉類判定
  if (cat.includes('肉') || cat.includes('水產') || cat.includes('蛋') || cat.includes('豆') || cat.includes('禽') || cat.includes('海鮮') || name.includes('雞') || name.includes('牛') || name.includes('魚') || name.includes('豆腐')) {
    // 1份豆魚蛋肉: 7g 蛋白質
    portions.proteins = Number((pro / 7).toFixed(1));
    return portions;
  }

  // 油脂與堅果種子類
  if (cat.includes('油脂') || cat.includes('油') || cat.includes('堅果') || cat.includes('種子') || name.includes('油') || name.includes('芝麻') || name.includes('花生') || name.includes('核桃') || name.includes('腰果')) {
    // 1份油脂: 5g 脂肪
    portions.oils = Number((fat / 5).toFixed(1));
    return portions;
  }

  // 全穀雜糧類判定
  if (cat.includes('穀') || cat.includes('麥') || cat.includes('根莖') || cat.includes('澱粉') || name.includes('飯') || name.includes('麵') || name.includes('薯') || name.includes('地瓜') || name.includes('芋頭')) {
    // 1份全穀雜糧: 15g 碳水
    portions.cereals = Number((cho / 15).toFixed(1));
    return portions;
  }

  // 未分類或混合食品依照宏量估算
  if (cho >= 15 && cho > pro && cho > fat) {
    portions.cereals = Number((cho / 15).toFixed(1));
  } else if (pro >= 7) {
    portions.proteins = Number((pro / 7).toFixed(1));
  } else if (fat >= 5) {
    portions.oils = Number((fat / 5).toFixed(1));
  }

  return portions;
}

/**
 * 計算理想體重 (IBW) 與每日熱量蛋白質目標 (基於臨床常用公式)
 */
export function calculateClinicalGoals(
  heightCm: number,
  actualWeightKg: number,
  gender: 'female' | 'male',
  dietType: ClinicalDietType
) {
  const hM = heightCm / 100;
  // 理想體重 IBW = 22 * (身高公尺)^2
  const ibw = Math.round(22 * hM * hM * 10) / 10;
  const bmi = actualWeightKg > 0 ? Math.round((actualWeightKg / (hM * hM)) * 10) / 10 : 22;

  const cfg = CLINICAL_DIET_PRESETS[dietType] || CLINICAL_DIET_PRESETS.normal;
  const targetWeight = (actualWeightKg > 0 && Math.abs(actualWeightKg - ibw) / ibw < 0.2) ? actualWeightKg : ibw;

  const targetKcal = Math.round(targetWeight * cfg.calorieMultiplier);
  const targetProG = Math.round(targetWeight * cfg.proteinMultiplier * 10) / 10;

  return {
    ibw,
    bmi,
    targetWeight,
    targetKcal,
    targetProG,
    kcalPerKg: cfg.calorieMultiplier,
    proPerKg: cfg.proteinMultiplier,
    config: cfg
  };
}
