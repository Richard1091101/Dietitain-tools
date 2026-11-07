export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  catName: string;
  kcal: number;
  water: number;
  pro: number;
  fat: number;
  satFat: number;
  mufa: number;
  pufa: number;
  chol: number;
  cho: number;
  fiber: number;
  sugar: number;
  ash: number;
  na: number;
  k: number;
  ca: number;
  mg: number;
  p: number;
  fe: number;
  zn: number;
  cu: number;
  mn: number;
  folate: number;
  vitA: number;
  alphaCaro: number;
  betaCaro: number;
  vitD: number;
  vitE: number;
  vitB1: number;
  vitB2: number;
  niacin: number;
  vitB6: number;
  vitB12: number;
  vitC: number;
  note: string;
}

export interface UserProfile {
  gender: 'female' | 'male';
  ageGroup: string;
  activity: 'light' | 'moderate' | 'heavy';
  pregnancy: 'none' | 'p1' | 'p2' | 'p3' | 'lact';
  heightCm?: number;
  weightKg?: number;
  clinicalDietType?: 'normal' | 'ckd' | 'diabetes' | 'dash' | 'highProtein' | 'gout' | 'athleteStrength' | 'athleteEndurance';
}

export interface DriRule {
  // 能量與三大營養素
  eer: number;
  pro: number;
  cho?: number;
  fat?: number;
  satFatUl?: number;
  fiber: number;
  water?: number;
  // 巨量礦物質與電解質
  ca: number;
  p: number;
  mg: number;
  k: number;
  na: number;
  // 微量礦物質
  fe: number;
  zn: number;
  cu: number;
  mn: number;
  // 脂溶性維生素
  vitA: number;
  vitD: number;
  vitE: number;
  // 水溶性維生素
  vitC: number;
  vitB1: number;
  vitB2: number;
  niacin: number;
  vitB6: number;
  vitB12: number;
  folate: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface CookingOilProfile {
  id: string;
  name: string;
  icon: string;
  kcal: number; // kcal / 100g
  fat: number;  // g / 100g
  satFat: number; // g / 100g
  mufa: number;   // g / 100g
  pufa: number;   // g / 100g
  vitE: number;   // mg / 100g
}

export const COOKING_OIL_OPTIONS: CookingOilProfile[] = [
  { id: 'none', name: '無用油 / 不額外加油', icon: '💧', kcal: 0, fat: 0, satFat: 0, mufa: 0, pufa: 0, vitE: 0 },
  { id: 'olive', name: '橄欖油 (高單元不飽和 MUFA)', icon: '🫒', kcal: 884, fat: 100, satFat: 14, mufa: 73, pufa: 11, vitE: 14.3 },
  { id: 'canola', name: '芥花油 (低飽和 / Omega-3)', icon: '🌻', kcal: 884, fat: 100, satFat: 7, mufa: 63, pufa: 28, vitE: 17.5 },
  { id: 'soybean', name: '大豆沙拉油 (家常烹調)', icon: '🌱', kcal: 884, fat: 100, satFat: 15, mufa: 23, pufa: 58, vitE: 8.2 },
  { id: 'camellia', name: '苦茶油 (東方橄欖油 / 高發煙)', icon: '🌿', kcal: 884, fat: 100, satFat: 10, mufa: 80, pufa: 9, vitE: 12.0 },
  { id: 'sesame', name: '芝麻香油 (風味提香 / 芝麻素)', icon: '🥣', kcal: 884, fat: 100, satFat: 14, mufa: 40, pufa: 42, vitE: 1.4 },
  { id: 'sunflower', name: '葵花油 (高維生素E)', icon: '🌻', kcal: 884, fat: 100, satFat: 11, mufa: 20, pufa: 66, vitE: 41.1 },
  { id: 'avocado', name: '酪梨油 (高發煙點 / 單元不飽和)', icon: '🥑', kcal: 884, fat: 100, satFat: 12, mufa: 71, pufa: 14, vitE: 13.0 },
  { id: 'lard', name: '豬油 (傳統風味動物油)', icon: '🥓', kcal: 898, fat: 100, satFat: 39, mufa: 45, pufa: 11, vitE: 0.6 }
];

export function getCookingOilProfile(nameOrId?: string): CookingOilProfile {
  if (!nameOrId || nameOrId === '無' || nameOrId.includes('無用油') || nameOrId.includes('不額外加油') || nameOrId.includes('不加油')) {
    return COOKING_OIL_OPTIONS[0];
  }
  const clean = nameOrId.trim();
  const found = COOKING_OIL_OPTIONS.find(o => 
    o.name === clean || 
    o.id === clean || 
    clean.includes(o.name.split(' ')[0]) || 
    o.name.includes(clean)
  );
  return found || COOKING_OIL_OPTIONS[1]; // 預設以橄欖油作為標準烹調油基準
}

export interface BasketItem {
  id: string;
  food: FoodItem;
  portionGrams: number;
  mealType?: MealType;
  date?: string;
  note?: string;
  cookingOilName?: string;  // 烹調用油品項 (例如 '橄欖油', '芥花油', '無用油')
  cookingOilGrams?: number; // 烹調用油克數 (g)
}

export interface NutrientMeta {
  name: string;
  unit: string;
  key: keyof FoodItem;
  group: 'macro' | 'general' | 'lipid' | 'mineral' | 'vitamin';
  lowerBetter?: boolean;
  dec?: number;
}

export const NUTRIENT_META_MAP: Record<string, NutrientMeta> = {
  kcal: { name: "熱量 (Kcal)", unit: "kcal", key: "kcal", group: "macro", lowerBetter: true, dec: 0 },
  pro: { name: "粗蛋白質", unit: "g", key: "pro", group: "macro", dec: 1 },
  cho: { name: "總碳水化合物", unit: "g", key: "cho", group: "macro", dec: 1 },
  fat: { name: "粗脂肪", unit: "g", key: "fat", group: "macro", lowerBetter: true, dec: 1 },
  fiber: { name: "膳食纖維", unit: "g", key: "fiber", group: "macro", dec: 1 },
  sugar: { name: "糖質總量", unit: "g", key: "sugar", group: "macro", lowerBetter: true, dec: 1 },
  water: { name: "水分含量 (Water)", unit: "g", key: "water", group: "general", dec: 1 },
  ash: { name: "灰分含量 (Ash)", unit: "g", key: "ash", group: "general", dec: 1 },
  satFat: { name: "飽和脂肪酸 (SFA)", unit: "g", key: "satFat", group: "lipid", lowerBetter: true, dec: 1 },
  mufa: { name: "單元不飽和脂肪酸 (MUFA)", unit: "g", key: "mufa", group: "lipid", dec: 1 },
  pufa: { name: "多元不飽和脂肪酸 (PUFA)", unit: "g", key: "pufa", group: "lipid", dec: 1 },
  chol: { name: "膽固醇", unit: "mg", key: "chol", group: "lipid", lowerBetter: true, dec: 0 },
  na: { name: "鈉含量 (Na)", unit: "mg", key: "na", group: "mineral", lowerBetter: true, dec: 0 },
  k: { name: "鉀離子 (K)", unit: "mg", key: "k", group: "mineral", dec: 0 },
  ca: { name: "鈣質 (Ca)", unit: "mg", key: "ca", group: "mineral", dec: 0 },
  mg: { name: "鎂 (Mg)", unit: "mg", key: "mg", group: "mineral", dec: 0 },
  p: { name: "磷 (P)", unit: "mg", key: "p", group: "mineral", dec: 0 },
  fe: { name: "鐵質 (Fe)", unit: "mg", key: "fe", group: "mineral", dec: 1 },
  zn: { name: "鋅 (Zn)", unit: "mg", key: "zn", group: "mineral", dec: 1 },
  cu: { name: "銅 (Cu)", unit: "mg", key: "cu", group: "mineral", dec: 2 },
  mn: { name: "錳 (Mn)", unit: "mg", key: "mn", group: "mineral", dec: 2 },
  vitA: { name: "維生素 A 總量", unit: "ug RAE", key: "vitA", group: "vitamin", dec: 0 },
  alphaCaro: { name: "α-胡蘿蔔素", unit: "ug", key: "alphaCaro", group: "vitamin", dec: 0 },
  betaCaro: { name: "β-胡蘿蔔素", unit: "ug", key: "betaCaro", group: "vitamin", dec: 0 },
  vitD: { name: "維生素 D", unit: "ug", key: "vitD", group: "vitamin", dec: 2 },
  vitE: { name: "維生素 E", unit: "mg", key: "vitE", group: "vitamin", dec: 1 },
  vitB1: { name: "維生素 B1", unit: "mg", key: "vitB1", group: "vitamin", dec: 2 },
  vitB2: { name: "維生素 B2", unit: "mg", key: "vitB2", group: "vitamin", dec: 2 },
  niacin: { name: "菸鹼素 (Niacin)", unit: "mg", key: "niacin", group: "vitamin", dec: 2 },
  vitB6: { name: "維生素 B6", unit: "mg", key: "vitB6", group: "vitamin", dec: 2 },
  vitB12: { name: "維生素 B12", unit: "ug", key: "vitB12", group: "vitamin", dec: 2 },
  folate: { name: "葉酸 (Folate)", unit: "mcg", key: "folate", group: "vitamin", dec: 0 },
  vitC: { name: "維生素 C", unit: "mg", key: "vitC", group: "vitamin", dec: 0 },
  lowKcal: { name: "低熱量密度", unit: "kcal", key: "kcal", group: "macro", lowerBetter: true, dec: 0 },
  lowNa: { name: "低鈉無負擔", unit: "mg", key: "na", group: "mineral", lowerBetter: true, dec: 0 }
};

export const INITIAL_DRIS_RULES: Record<'female' | 'male', Record<string, DriRule>> = {
  female: {
    "1-3":   { eer: 1150, pro: 20, fiber: 15, ca: 500,  p: 400,  mg: 80,  k: 1800, na: 1200, fe: 10, zn: 5,  cu: 0.34, mn: 1.2, vitA: 400, vitD: 10, vitE: 5,  vitC: 40,  vitB1: 0.6, vitB2: 0.7, niacin: 8,  vitB6: 0.5, vitB12: 0.9, folate: 150 },
    "4-6":   { eer: 1400, pro: 30, fiber: 20, ca: 600,  p: 500,  mg: 120, k: 2000, na: 1500, fe: 10, zn: 5,  cu: 0.44, mn: 1.5, vitA: 450, vitD: 10, vitE: 6,  vitC: 50,  vitB1: 0.7, vitB2: 0.8, niacin: 9,  vitB6: 0.6, vitB12: 1.2, folate: 200 },
    "7-9":   { eer: 1650, pro: 40, fiber: 22, ca: 800,  p: 600,  mg: 170, k: 2200, na: 1800, fe: 10, zn: 8,  cu: 0.50, mn: 1.7, vitA: 500, vitD: 10, vitE: 7,  vitC: 65,  vitB1: 0.8, vitB2: 0.9, niacin: 11, vitB6: 0.8, vitB12: 1.5, folate: 250 },
    "10-12": { eer: 1900, pro: 50, fiber: 25, ca: 1000, p: 800,  mg: 230, k: 2500, na: 2000, fe: 15, zn: 10, cu: 0.70, mn: 1.9, vitA: 550, vitD: 10, vitE: 9,  vitC: 80,  vitB1: 0.9, vitB2: 1.0, niacin: 12, vitB6: 1.1, vitB12: 2.0, folate: 300 },
    "13-15": { eer: 2100, pro: 55, fiber: 27, ca: 1200, p: 1000, mg: 320, k: 2600, na: 2300, fe: 15, zn: 12, cu: 0.89, mn: 2.2, vitA: 550, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.0, vitB2: 1.1, niacin: 14, vitB6: 1.3, vitB12: 2.4, folate: 400 },
    "16-18": { eer: 2100, pro: 55, fiber: 27, ca: 1000, p: 1000, mg: 320, k: 2700, na: 2300, fe: 15, zn: 12, cu: 0.89, mn: 2.2, vitA: 550, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.1, vitB2: 1.2, niacin: 14, vitB6: 1.4, vitB12: 2.4, folate: 400 },
    "19-30": { eer: 1900, pro: 50, fiber: 27, ca: 1000, p: 800,  mg: 320, k: 2700, na: 2300, fe: 15, zn: 12, cu: 0.85, mn: 2.0, vitA: 500, vitD: 10, vitE: 12, vitC: 100, vitB1: 0.9, vitB2: 1.0, niacin: 14, vitB6: 1.5, vitB12: 2.4, folate: 400 },
    "31-50": { eer: 1900, pro: 50, fiber: 27, ca: 1000, p: 800,  mg: 320, k: 2700, na: 2300, fe: 15, zn: 12, cu: 0.85, mn: 2.0, vitA: 500, vitD: 10, vitE: 12, vitC: 100, vitB1: 0.9, vitB2: 1.0, niacin: 14, vitB6: 1.5, vitB12: 2.4, folate: 400 },
    "51-70": { eer: 1800, pro: 50, fiber: 25, ca: 1000, p: 800,  mg: 310, k: 2700, na: 2300, fe: 10, zn: 12, cu: 0.85, mn: 2.0, vitA: 500, vitD: 10, vitE: 12, vitC: 100, vitB1: 0.9, vitB2: 1.0, niacin: 14, vitB6: 1.5, vitB12: 2.4, folate: 400 },
    "71+":   { eer: 1600, pro: 50, fiber: 22, ca: 1000, p: 800,  mg: 300, k: 2700, na: 2000, fe: 10, zn: 12, cu: 0.85, mn: 2.0, vitA: 500, vitD: 15, vitE: 12, vitC: 100, vitB1: 0.9, vitB2: 1.0, niacin: 14, vitB6: 1.5, vitB12: 2.4, folate: 400 }
  },
  male: {
    "1-3":   { eer: 1250, pro: 20, fiber: 15, ca: 500,  p: 400,  mg: 80,  k: 1800, na: 1200, fe: 10, zn: 5,  cu: 0.34, mn: 1.2, vitA: 400, vitD: 10, vitE: 5,  vitC: 40,  vitB1: 0.6, vitB2: 0.7, niacin: 8,  vitB6: 0.5, vitB12: 0.9, folate: 150 },
    "4-6":   { eer: 1550, pro: 30, fiber: 20, ca: 600,  p: 500,  mg: 120, k: 2000, na: 1500, fe: 10, zn: 5,  cu: 0.44, mn: 1.5, vitA: 450, vitD: 10, vitE: 6,  vitC: 50,  vitB1: 0.7, vitB2: 0.8, niacin: 9,  vitB6: 0.6, vitB12: 1.2, folate: 200 },
    "7-9":   { eer: 1800, pro: 40, fiber: 25, ca: 800,  p: 600,  mg: 170, k: 2200, na: 1800, fe: 10, zn: 8,  cu: 0.50, mn: 1.7, vitA: 500, vitD: 10, vitE: 7,  vitC: 65,  vitB1: 0.8, vitB2: 0.9, niacin: 11, vitB6: 0.8, vitB12: 1.5, folate: 250 },
    "10-12": { eer: 2150, pro: 55, fiber: 28, ca: 1000, p: 800,  mg: 230, k: 2500, na: 2000, fe: 10, zn: 10, cu: 0.70, mn: 2.0, vitA: 600, vitD: 10, vitE: 10, vitC: 80,  vitB1: 1.0, vitB2: 1.1, niacin: 13, vitB6: 1.1, vitB12: 2.0, folate: 300 },
    "13-15": { eer: 2450, pro: 70, fiber: 32, ca: 1200, p: 1000, mg: 350, k: 2800, na: 2300, fe: 15, zn: 15, cu: 0.89, mn: 2.4, vitA: 600, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.2, vitB2: 1.3, niacin: 16, vitB6: 1.4, vitB12: 2.4, folate: 400 },
    "16-18": { eer: 2650, pro: 75, fiber: 34, ca: 1000, p: 1000, mg: 390, k: 2800, na: 2300, fe: 15, zn: 15, cu: 0.89, mn: 2.4, vitA: 600, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.3, vitB2: 1.5, niacin: 17, vitB6: 1.5, vitB12: 2.4, folate: 400 },
    "19-30": { eer: 2350, pro: 65, fiber: 34, ca: 1000, p: 800,  mg: 380, k: 2800, na: 2300, fe: 10, zn: 15, cu: 0.90, mn: 2.5, vitA: 600, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.2, vitB2: 1.3, niacin: 16, vitB6: 1.5, vitB12: 2.4, folate: 400 },
    "31-50": { eer: 2300, pro: 65, fiber: 34, ca: 1000, p: 800,  mg: 380, k: 2800, na: 2300, fe: 10, zn: 15, cu: 0.90, mn: 2.5, vitA: 600, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.2, vitB2: 1.3, niacin: 16, vitB6: 1.5, vitB12: 2.4, folate: 400 },
    "51-70": { eer: 2150, pro: 65, fiber: 30, ca: 1000, p: 800,  mg: 380, k: 2800, na: 2300, fe: 10, zn: 15, cu: 0.90, mn: 2.5, vitA: 600, vitD: 10, vitE: 12, vitC: 100, vitB1: 1.2, vitB2: 1.3, niacin: 16, vitB6: 1.6, vitB12: 2.4, folate: 400 },
    "71+":   { eer: 1950, pro: 60, fiber: 25, ca: 1000, p: 800,  mg: 350, k: 2800, na: 2000, fe: 10, zn: 15, cu: 0.90, mn: 2.5, vitA: 600, vitD: 15, vitE: 12, vitC: 100, vitB1: 1.2, vitB2: 1.3, niacin: 16, vitB6: 1.6, vitB12: 2.4, folate: 400 }
  }
};

export const PREGNANCY_ADDONS: Record<string, Partial<DriRule>> = {
  none: { eer: 0,   pro: 0,  fe: 0,  folate: 0,   ca: 0, vitA: 0, vitC: 0, vitB1: 0, vitB2: 0, niacin: 0, vitB6: 0, vitB12: 0, zn: 0, vitE: 0 },
  p1:   { eer: 0,   pro: 0,  fe: 0,  folate: 200, ca: 0, vitA: 0, vitC: 10, vitB1: 0.1, vitB2: 0.1, niacin: 1, vitB6: 0.4, vitB12: 0.2, zn: 1, vitE: 1 },
  p2:   { eer: 300, pro: 10, fe: 0,  folate: 200, ca: 0, vitA: 0, vitC: 10, vitB1: 0.2, vitB2: 0.2, niacin: 2, vitB6: 0.4, vitB12: 0.2, zn: 2, vitE: 2 },
  p3:   { eer: 300, pro: 10, fe: 30, folate: 200, ca: 0, vitA: 0, vitC: 10, vitB1: 0.2, vitB2: 0.2, niacin: 2, vitB6: 0.4, vitB12: 0.2, zn: 2, vitE: 2 },
  lact: { eer: 500, pro: 15, fe: 30, folate: 100, ca: 0, vitA: 500, vitC: 40, vitB1: 0.3, vitB2: 0.4, niacin: 4, vitB6: 0.5, vitB12: 0.4, zn: 3, vitE: 3 }
};

export const RANK_DIM_CONFIG = {
  gram: { unit: 'g', defaultVal: 100, presets: [50, 100, 150, 200], descName: '重量' },
  kcal: { unit: 'kcal', defaultVal: 100, presets: [100, 200, 300, 500], descName: '熱量' },
  pro:  { unit: 'g', defaultVal: 10,  presets: [7, 10, 14, 20], descName: '蛋白質' },
  cho:  { unit: 'g', defaultVal: 15,  presets: [15, 30, 45, 60], descName: '碳水化合物' },
  fat:  { unit: 'g', defaultVal: 5,   presets: [5, 10, 15, 20], descName: '脂肪' }
} as const;

export type DimensionKey = keyof typeof RANK_DIM_CONFIG;

export function guessFoodEmoji(name = '', cat = ''): string {
  const s = (String(name) + ' ' + String(cat)).toLowerCase();
  if (s.includes('飯') || s.includes('米') || s.includes('穀') || s.includes('麥')) return '🍚';
  if (s.includes('麵') || s.includes('粉') || s.includes('粿')) return '🍜';
  if (s.includes('雞') || s.includes('鴨') || s.includes('鵝') || s.includes('禽')) return '🍗';
  if (s.includes('豬') || s.includes('牛') || s.includes('羊') || s.includes('肉')) return '🥩';
  if (s.includes('魚') || s.includes('蝦') || s.includes('蟹') || s.includes('貝') || s.includes('海鮮') || s.includes('水產') || s.includes('鰻') || s.includes('鯛')) return '🐟';
  if (s.includes('蛋')) return '🥚';
  if (s.includes('豆') || s.includes('豆腐')) return '🧊';
  if (s.includes('奶') || s.includes('乳') || s.includes('起司') || s.includes('優格')) return '🥛';
  if (s.includes('菜') || s.includes('甘藍') || s.includes('葉') || s.includes('花椰') || s.includes('菠菜') || s.includes('青')) return '🥦';
  if (s.includes('果') || s.includes('蘋果') || s.includes('芭樂') || s.includes('香蕉') || s.includes('柑') || s.includes('橘') || s.includes('瓜')) return '🍎';
  if (s.includes('菇') || s.includes('菌') || s.includes('木耳')) return '🍄';
  if (s.includes('油') || s.includes('脂')) return '🫒';
  if (s.includes('茶') || s.includes('飲') || s.includes('水') || s.includes('汁') || s.includes('咖啡')) return '🍵';
  if (s.includes('糖') || s.includes('甜') || s.includes('糕') || s.includes('餅') || s.includes('點心') || s.includes('巧克力')) return '🧁';
  if (s.includes('堅果') || s.includes('種子') || s.includes('芝麻') || s.includes('花生') || s.includes('杏仁') || s.includes('腰果')) return '🥜';
  if (s.includes('根') || s.includes('薯') || s.includes('芋') || s.includes('筍') || s.includes('蘿蔔')) return '🍠';
  return '🥗';
}

export function parseNumericField(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === "" || val === "-") return fallback;
  const parsed = parseFloat(String(val).replace(/,/g, '').trim());
  return isNaN(parsed) ? fallback : parsed;
}

export function normalizeFoodItem(item: any, idx: number): FoodItem {
  const name = item.name || item["樣品名稱"] || item["食品名稱"] || item["名稱"] || item["品名"] || `食材_${idx + 1}`;
  const cat = item.catName || item["食品分類"] || item["分類"] || item["大類"] || item["類別"] || item["分類名稱"] || "其他";

  return {
    id: String(item.id || item["整合編號"] || item["樣品編號"] || item["編號"] || `sheet_${idx + 1}`),
    name: String(name).trim(),
    icon: item.icon || guessFoodEmoji(name, cat),
    catName: String(cat).trim(),
    kcal: parseNumericField(item.kcal ?? item["熱量(kcal)"] ?? item["熱量(Kcal)"] ?? item["熱量"] ?? item["熱量 (kcal)"]),
    water: parseNumericField(item.water ?? item["水分(g)"] ?? item["水分"] ?? item["水分 (g)"]),
    pro: parseNumericField(item.pro ?? item["粗蛋白(g)"] ?? item["蛋白質(g)"] ?? item["粗蛋白質(g)"] ?? item["粗蛋白"] ?? item["蛋白質"]),
    fat: parseNumericField(item.fat ?? item["粗脂肪(g)"] ?? item["脂肪(g)"] ?? item["粗脂肪"] ?? item["脂肪"]),
    satFat: parseNumericField(item.satFat ?? item["飽和脂肪(g)"] ?? item["飽和脂肪酸(g)"] ?? item["飽和脂肪酸"] ?? item["飽和脂肪"]),
    mufa: parseNumericField(item.mufa ?? item["單元不飽和脂肪(g)"] ?? item["單元不飽和脂肪酸(g)"] ?? item["單元不飽和脂肪酸"]),
    pufa: parseNumericField(item.pufa ?? item["多元不飽和脂肪(g)"] ?? item["多元不飽和脂肪酸(g)"] ?? item["多元不飽和脂肪酸"]),
    chol: parseNumericField(item.chol ?? item["膽固醇(mg)"] ?? item["膽固醇"]),
    cho: parseNumericField(item.cho ?? item["總碳水化合物(g)"] ?? item["碳水化合物(g)"] ?? item["碳水化合物"] ?? item["碳水"]),
    fiber: parseNumericField(item.fiber ?? item["膳食纖維(g)"] ?? item["膳食纖維"] ?? item["纖維"]),
    sugar: parseNumericField(item.sugar ?? item["糖質總量(g)"] ?? item["糖質(g)"] ?? item["糖質總量"] ?? item["糖質"] ?? item["糖分"]),
    ash: parseNumericField(item.ash ?? item["灰分(g)"] ?? item["灰分"]),
    na: parseNumericField(item.na ?? item["鈉(mg)"] ?? item["鈉"]),
    k: parseNumericField(item.k ?? item["鉀(mg)"] ?? item["鉀"]),
    ca: parseNumericField(item.ca ?? item["鈣(mg)"] ?? item["鈣"]),
    mg: parseNumericField(item.mg ?? item["鎂(mg)"] ?? item["鎂"]),
    p: parseNumericField(item.p ?? item["磷(mg)"] ?? item["磷"]),
    fe: parseNumericField(item.fe ?? item["鐵(mg)"] ?? item["鐵"]),
    zn: parseNumericField(item.zn ?? item["鋅(mg)"] ?? item["鋅"]),
    cu: parseNumericField(item.cu ?? item["銅(mg)"] ?? item["銅"]),
    mn: parseNumericField(item.mn ?? item["錳(mg)"] ?? item["錳"]),
    folate: parseNumericField(item.folate ?? item["葉酸(mcg)"] ?? item["葉酸(ug)"] ?? item["葉酸"]),
    vitA: parseNumericField(item.vitA ?? item["維生素A總量(IU)"] ?? item["維生素A總量(ug RAE)"] ?? item["維生素A"]),
    alphaCaro: parseNumericField(item.alphaCaro ?? item["α-胡蘿蔔素(ug)"] ?? item["α-胡蘿蔔素"]),
    betaCaro: parseNumericField(item.betaCaro ?? item["β-胡蘿蔔素(ug)"] ?? item["β-胡蘿蔔素"]),
    vitD: parseNumericField(item.vitD ?? item["維生素D總量(IU)"] ?? item["維生素D總量(ug)"] ?? item["維生素D"]),
    vitE: parseNumericField(item.vitE ?? item["維生素E總量(mg)"] ?? item["α-維生素E當量(α-TE)(mg)"] ?? item["維生素E"]),
    vitB1: parseNumericField(item.vitB1 ?? item["維生素B1(mg)"] ?? item["維生素B1 (mg)"] ?? item["維生素B1"] ?? item["硫胺素(mg)"] ?? item["硫胺素"]),
    vitB2: parseNumericField(item.vitB2 ?? item["維生素B2(mg)"] ?? item["維生素B2 (mg)"] ?? item["維生素B2"] ?? item["核黃素(mg)"] ?? item["核黃素"]),
    niacin: parseNumericField(item.niacin ?? item["菸鹼素(mg)"] ?? item["菸鹼酸(mg)"] ?? item["菸鹼素 (mg)"] ?? item["菸鹼素"] ?? item["菸鹼酸"]),
    vitB6: parseNumericField(item.vitB6 ?? item["維生素B6(mg)"] ?? item["維生素B6 (mg)"] ?? item["維生素B6"] ?? item["吡哆醇(mg)"] ?? item["吡哆醇"]),
    vitB12: parseNumericField(item.vitB12 ?? item["維生素B12(ug)"] ?? item["維生素B12 (ug)"] ?? item["維生素B12(mcg)"] ?? item["維生素B12"] ?? item["鈷胺素(ug)"]),
    vitC: parseNumericField(item.vitC ?? item["維生素C(mg)"] ?? item["維生素C (mg)"] ?? item["維生素C"]),
    note: item.note || item["俗名"] || item["樣品英文名稱"] || item["內容物描述"] || "Google 試算表雲端同步資料"
  };
}

export const INITIAL_DEFAULT_FOODS: FoodItem[] = [
  {
    id: "seed_rice",
    name: "白飯(熟)",
    icon: "🍚",
    catName: "穀物類",
    kcal: 183,
    water: 54.5,
    pro: 3.1,
    fat: 0.3,
    satFat: 0.1,
    mufa: 0.1,
    pufa: 0.1,
    chol: 0,
    cho: 41.0,
    fiber: 0.6,
    sugar: 0.1,
    ash: 0.5,
    na: 2,
    k: 40,
    ca: 3,
    mg: 13,
    p: 48,
    fe: 0.2,
    zn: 0.8,
    cu: 0.08,
    mn: 0.45,
    folate: 6,
    vitA: 0,
    alphaCaro: 0,
    betaCaro: 0,
    vitD: 0,
    vitE: 0.1,
    vitB1: 0.04,
    vitB2: 0.02,
    niacin: 0.8,
    vitB6: 0.07,
    vitB12: 0,
    vitC: 0,
    note: "台灣常見主食白飯"
  },
  {
    id: "seed_brown_rice",
    name: "糙米飯(熟)",
    icon: "🍚",
    catName: "穀物類",
    kcal: 156,
    water: 60.5,
    pro: 3.2,
    fat: 1.0,
    satFat: 0.2,
    mufa: 0.3,
    pufa: 0.4,
    chol: 0,
    cho: 33.5,
    fiber: 1.8,
    sugar: 0.2,
    ash: 0.8,
    na: 2,
    k: 110,
    ca: 10,
    mg: 44,
    p: 120,
    fe: 0.8,
    zn: 1.1,
    cu: 0.15,
    mn: 1.1,
    folate: 16,
    vitA: 0,
    alphaCaro: 0,
    betaCaro: 0,
    vitD: 0,
    vitE: 0.5,
    vitB1: 0.18,
    vitB2: 0.04,
    niacin: 2.5,
    vitB6: 0.25,
    vitB12: 0,
    vitC: 0,
    note: "高纖低GI未精製全穀"
  },
  {
    id: "seed_chicken_breast",
    name: "雞胸肉(熟)",
    icon: "🍗",
    catName: "肉類",
    kcal: 165,
    water: 65.0,
    pro: 31.0,
    fat: 3.6,
    satFat: 1.0,
    mufa: 1.2,
    pufa: 0.8,
    chol: 85,
    cho: 0,
    fiber: 0,
    sugar: 0,
    ash: 1.2,
    na: 74,
    k: 256,
    ca: 15,
    mg: 29,
    p: 228,
    fe: 1.0,
    zn: 1.0,
    cu: 0.05,
    mn: 0.02,
    folate: 12,
    vitA: 5,
    alphaCaro: 0,
    betaCaro: 0,
    vitD: 0.1,
    vitE: 0.3,
    vitB1: 0.22,
    vitB2: 0.12,
    niacin: 11.2,
    vitB6: 0.60,
    vitB12: 0.35,
    vitC: 0,
    note: "高生物價低脂蛋白質優選"
  },
  {
    id: "seed_egg",
    name: "水煮蛋",
    icon: "🥚",
    catName: "蛋類",
    kcal: 143,
    water: 75.0,
    pro: 12.6,
    fat: 9.5,
    satFat: 3.1,
    mufa: 3.7,
    pufa: 1.4,
    chol: 372,
    cho: 0.7,
    fiber: 0,
    sugar: 0.2,
    ash: 1.0,
    na: 142,
    k: 138,
    ca: 56,
    mg: 12,
    p: 198,
    fe: 1.8,
    zn: 1.3,
    cu: 0.06,
    mn: 0.03,
    folate: 47,
    vitA: 160,
    alphaCaro: 0,
    betaCaro: 10,
    vitD: 1.6,
    vitE: 1.4,
    vitB1: 0.07,
    vitB2: 0.52,
    niacin: 0.18,
    vitB6: 0.14,
    vitB12: 1.10,
    vitC: 0,
    note: "完整胺基酸與高生物價優質蛋白"
  },
  {
    id: "seed_salmon",
    name: "鮭魚(熟)",
    icon: "🐟",
    catName: "魚貝類",
    kcal: 206,
    water: 64.0,
    pro: 22.0,
    fat: 12.4,
    satFat: 2.5,
    mufa: 4.5,
    pufa: 4.2,
    chol: 63,
    cho: 0,
    fiber: 0,
    sugar: 0,
    ash: 1.2,
    na: 59,
    k: 363,
    ca: 12,
    mg: 29,
    p: 250,
    fe: 0.8,
    zn: 0.6,
    cu: 0.06,
    mn: 0.02,
    folate: 25,
    vitA: 40,
    alphaCaro: 0,
    betaCaro: 0,
    vitD: 11.0,
    vitE: 1.5,
    vitB1: 0.25,
    vitB2: 0.18,
    niacin: 8.5,
    vitB6: 0.70,
    vitB12: 3.2,
    vitC: 1,
    note: "富含 EPA、DHA 與維生素 D"
  },
  {
    id: "seed_tofu",
    name: "傳統豆腐",
    icon: "🧊",
    catName: "豆類",
    kcal: 86,
    water: 84.0,
    pro: 8.5,
    fat: 3.7,
    satFat: 0.6,
    mufa: 0.8,
    pufa: 2.1,
    chol: 0,
    cho: 1.8,
    fiber: 0.8,
    sugar: 0.5,
    ash: 1.2,
    na: 6,
    k: 135,
    ca: 140,
    mg: 43,
    p: 105,
    fe: 2.1,
    zn: 0.8,
    cu: 0.18,
    mn: 0.55,
    folate: 18,
    vitA: 0,
    alphaCaro: 0,
    betaCaro: 0,
    vitD: 0,
    vitE: 0.9,
    vitB1: 0.08,
    vitB2: 0.05,
    niacin: 0.4,
    vitB6: 0.09,
    vitB12: 0,
    vitC: 0,
    note: "植物性蛋白質與高鈣來源"
  },
  {
    id: "seed_milk",
    name: "全脂鮮乳",
    icon: "🥛",
    catName: "乳品類",
    kcal: 63,
    water: 88.0,
    pro: 3.1,
    fat: 3.6,
    satFat: 2.3,
    mufa: 1.0,
    pufa: 0.1,
    chol: 13,
    cho: 4.8,
    fiber: 0,
    sugar: 4.8,
    ash: 0.7,
    na: 40,
    k: 152,
    ca: 104,
    mg: 11,
    p: 93,
    fe: 0.1,
    zn: 0.4,
    cu: 0.02,
    mn: 0.01,
    folate: 5,
    vitA: 38,
    alphaCaro: 0,
    betaCaro: 7,
    vitD: 0.1,
    vitE: 0.1,
    vitB1: 0.04,
    vitB2: 0.16,
    niacin: 0.2,
    vitB6: 0.04,
    vitB12: 0.42,
    vitC: 1,
    note: "鈣質與維生素 B2 吸收率極佳"
  },
  {
    id: "seed_spinach",
    name: "菠菜(熟)",
    icon: "🥦",
    catName: "蔬菜類",
    kcal: 23,
    water: 91.0,
    pro: 2.8,
    fat: 0.3,
    satFat: 0.1,
    mufa: 0,
    pufa: 0.1,
    chol: 0,
    cho: 3.2,
    fiber: 2.4,
    sugar: 0.4,
    ash: 1.5,
    na: 70,
    k: 480,
    ca: 85,
    mg: 60,
    p: 50,
    fe: 2.9,
    zn: 0.6,
    cu: 0.12,
    mn: 0.85,
    folate: 145,
    vitA: 550,
    alphaCaro: 0,
    betaCaro: 3300,
    vitD: 0,
    vitE: 2.1,
    vitB1: 0.08,
    vitB2: 0.15,
    niacin: 0.6,
    vitB6: 0.18,
    vitB12: 0,
    vitC: 28,
    note: "葉酸與鐵質高密度深綠蔬菜"
  }
];
