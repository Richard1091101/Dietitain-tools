export interface FoodItemForPlanner {
  name: string;
  unit: string;
  uW: number; // 單位參考重量 (g)
  c: number; // 每克碳水 (g)
  p: number; // 每克粗蛋白 (g)
  f: number; // 每克脂肪 (g)
  fiber: number; // 每克纖維 (g)
  na: number; // 每克鈉 (mg)
  phos: number; // 每克磷 (mg)
  k: number; // 每克鉀 (mg)
  ca: number; // 每克鈣 (mg)
  mag: number; // 每克鎂 (mg)
  epa: number; // 每克 EPA (mg)
  n3: number; // 每克 Omega-3 (mg)
  b12: number; // 每克 Vit B12 (ug)
  b1?: number; // 每克 Vit B1 (mg)
  b2?: number; // 每克 Vit B2 (mg)
  niacin?: number; // 每克 菸鹼素 (mg)
  b6?: number; // 每克 Vit B6 (mg)
  vitE?: number; // 每克 Vit E (mg)
  vitA: number; // 每克 Vit A (ug)
  folic: number; // 每克葉酸 (ug)
  vitD: number; // 每克 Vit D (ug)
  fe: number; // 每克鐵 (mg)
  zn: number; // 每克鋅 (mg)
  se: number; // 每克硒 (ug)
  cu?: number; // 每克銅 (mg)
  mn?: number; // 每克錳 (mg)
  type?: 'carbs' | 'proteins' | 'sides' | 'veggies' | 'snackCarbs' | 'dairy' | 'fruits';
}

export interface OilItem {
  name: string;
  f: number;
  fiber: number;
  na: number;
  phos: number;
  k: number;
  ca: number;
  mag: number;
  epa: number;
  n3: number;
  b12: number;
  vitA: number;
  folic: number;
  vitD: number;
  fe: number;
  zn: number;
  se: number;
  unit: string;
  uW: number;
}

export interface DishItem {
  item: FoodItemForPlanner;
  weight: number;
  method: string;
  oil: number; // 烹調用油 (g)
}

export interface ExtraItem extends FoodItemForPlanner {
  weight: number;
  oil?: number;
  method?: string;
}

export interface MealPlan {
  name: string;
  isMain: boolean;
  oilName?: string;
  targets?: { c: number; p: number; f: number; mainP: number };
  carb?: DishItem | null;
  protein?: DishItem | null;
  side?: DishItem | null;
  veggie?: DishItem | null;
  extra?: ExtraItem[];
  items?: ExtraItem[]; // 點心類食材清單
}

export interface MealStats {
  calories: number;
  p: number;
  f: number;
  c: number;
  fiber: number;
  na: number;
  phos: number;
  k: number;
  ca: number;
  mag: number;
  epa: number;
  n3: number;
  b12: number;
  b1?: number;
  b2?: number;
  niacin?: number;
  b6?: number;
  vitE?: number;
  vitA: number;
  folic: number;
  vitD: number;
  fe: number;
  zn: number;
  cu?: number;
  mn?: number;
  se: number;
}

export interface DayMenu {
  day: number;
  meals: MealPlan[];
  stats: MealStats;
}

export interface PlannerTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface TdeeParams {
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  pal: number;
}

export interface MealsConfig {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface SnacksConfig {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}
