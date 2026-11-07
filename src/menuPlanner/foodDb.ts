import { FoodItemForPlanner, OilItem } from './types';

export const INITIAL_FOOD_DB: {
  carbs: FoodItemForPlanner[];
  snackCarbs: FoodItemForPlanner[];
  proteins: FoodItemForPlanner[];
  sides: FoodItemForPlanner[];
  veggies: FoodItemForPlanner[];
  dairy: FoodItemForPlanner[];
  fruits: FoodItemForPlanner[];
  oils: OilItem[];
} = {
  carbs: [
    { name: '白飯(熟)', c: 0.28, p: 0.03, f: 0, fiber: 0.001, na: 0.02, phos: 0.4, k: 0.4, ca: 0.03, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.04, vitD: 0, fe: 0.002, zn: 0.01, se: 0.01, unit: '碗', uW: 160, type: 'carbs' },
    { name: '糙米飯(熟)', c: 0.26, p: 0.03, f: 0.01, fiber: 0.03, na: 0.02, phos: 2.6, k: 2.2, ca: 0.1, mag: 1.1, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.2, vitD: 0, fe: 0.01, zn: 0.02, se: 0.05, unit: '碗', uW: 160, type: 'carbs' },
    { name: '地瓜(熟)', c: 0.25, p: 0.02, f: 0, fiber: 0.025, na: 0.4, phos: 0.5, k: 2.8, ca: 0.3, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 15.0, folic: 0.14, vitD: 0, fe: 0.005, zn: 0.003, se: 0.002, unit: '小個', uW: 110, type: 'carbs' },
    { name: '義大利麵(熟)', c: 0.25, p: 0.04, f: 0.01, fiber: 0.015, na: 0.05, phos: 0.6, k: 0.5, ca: 0.07, mag: 0.2, epa: 0, n3: 0.1, b12: 0, vitA: 0, folic: 0.1, vitD: 0, fe: 0.01, zn: 0.015, se: 0.3, unit: '碗', uW: 120, type: 'carbs' },
    { name: '馬鈴薯(熟)', c: 0.15, p: 0.02, f: 0, fiber: 0.015, na: 0.05, phos: 0.5, k: 4.0, ca: 0.1, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 0.1, folic: 0.15, vitD: 0, fe: 0.008, zn: 0.003, se: 0.002, unit: '中個', uW: 180, type: 'carbs' },
    { name: '蕎麥麵(熟)', c: 0.21, p: 0.05, f: 0.01, fiber: 0.015, na: 0.1, phos: 0.8, k: 0.5, ca: 0.1, mag: 0.3, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.3, vitD: 0, fe: 0.015, zn: 0.01, se: 0.05, unit: '碗', uW: 120, type: 'carbs' },
    { name: '南瓜(熟)', c: 0.10, p: 0.01, f: 0, fiber: 0.015, na: 0.01, phos: 0.2, k: 3.4, ca: 0.2, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 20.0, folic: 0.15, vitD: 0, fe: 0.008, zn: 0.003, se: 0.001, unit: '份', uW: 85, type: 'carbs' },
    { name: '玉米(熟)', c: 0.18, p: 0.03, f: 0.01, fiber: 0.02, na: 0.02, phos: 0.9, k: 2.7, ca: 0.02, mag: 0.4, epa: 0, n3: 0, b12: 0, vitA: 0.5, folic: 0.4, vitD: 0, fe: 0.005, zn: 0.005, se: 0.01, unit: '根', uW: 130, type: 'carbs' },
    { name: '藜麥飯(熟)', c: 0.23, p: 0.04, f: 0.02, fiber: 0.03, na: 0.05, phos: 1.5, k: 1.7, ca: 0.1, mag: 0.6, epa: 0, n3: 0.1, b12: 0, vitA: 0, folic: 0.5, vitD: 0, fe: 0.015, zn: 0.02, se: 0.02, unit: '碗', uW: 160, type: 'carbs' },
    { name: '芋頭(熟)', c: 0.26, p: 0.02, f: 0, fiber: 0.04, na: 0.1, phos: 0.8, k: 5.9, ca: 0.2, mag: 0.3, epa: 0, n3: 0, b12: 0, vitA: 0.1, folic: 0.2, vitD: 0, fe: 0.006, zn: 0.003, se: 0.002, unit: '份', uW: 55, type: 'carbs' },
    { name: '冬粉(熟/低磷鉀)', c: 0.25, p: 0, f: 0, fiber: 0.01, na: 0.05, phos: 0.05, k: 0.05, ca: 0.2, mag: 0.05, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0.001, zn: 0.001, se: 0, unit: '碗', uW: 120, type: 'carbs' },
    { name: '米粉(熟/低磷鉀)', c: 0.26, p: 0.01, f: 0, fiber: 0.01, na: 0.1, phos: 0.2, k: 0.1, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.01, vitD: 0, fe: 0.002, zn: 0.002, se: 0.001, unit: '碗', uW: 120, type: 'carbs' },
    { name: '蘿蔔糕(低磷鉀)', c: 0.22, p: 0.02, f: 0.05, fiber: 0.01, na: 3.5, phos: 0.4, k: 1.0, ca: 0.2, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.05, vitD: 0, fe: 0.003, zn: 0.002, se: 0.005, unit: '片', uW: 50, type: 'carbs' }
  ],
  snackCarbs: [
    { name: '地瓜(熟)', c: 0.25, p: 0.02, f: 0, fiber: 0.025, na: 0.4, phos: 0.5, k: 2.8, ca: 0.3, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 15.0, folic: 0.14, vitD: 0, fe: 0.005, zn: 0.003, se: 0.002, unit: '小個', uW: 110, type: 'snackCarbs' },
    { name: '全麥吐司', c: 0.45, p: 0.09, f: 0.04, fiber: 0.06, na: 4.5, phos: 2.0, k: 2.5, ca: 0.7, mag: 0.8, epa: 0, n3: 0.5, b12: 0, vitA: 0, folic: 0.4, vitD: 0, fe: 0.025, zn: 0.015, se: 0.3, unit: '片', uW: 60, type: 'snackCarbs' },
    { name: '燕麥片', c: 0.60, p: 0.13, f: 0.08, fiber: 0.1, na: 0.05, phos: 4.0, k: 3.5, ca: 0.5, mag: 1.3, epa: 0, n3: 1.1, b12: 0, vitA: 0, folic: 0.3, vitD: 0, fe: 0.04, zn: 0.03, se: 0.05, unit: '湯匙', uW: 7, type: 'snackCarbs' },
    { name: '蘇打餅乾', c: 0.65, p: 0.08, f: 0.15, fiber: 0.02, na: 5.0, phos: 1.0, k: 1.0, ca: 0.2, mag: 0.2, epa: 0, n3: 0.1, b12: 0, vitA: 0, folic: 0.1, vitD: 0, fe: 0.02, zn: 0.01, se: 0.02, unit: '片', uW: 7, type: 'snackCarbs' },
    { name: '貝果(原味)', c: 0.50, p: 0.10, f: 0.01, fiber: 0.02, na: 4.0, phos: 1.0, k: 0.8, ca: 0.2, mag: 0.3, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.2, vitD: 0, fe: 0.015, zn: 0.01, se: 0.2, unit: '個', uW: 90, type: 'snackCarbs' },
    { name: '西谷米(熟/低磷鉀)', c: 0.30, p: 0, f: 0, fiber: 0, na: 0.02, phos: 0.05, k: 0.05, ca: 0.1, mag: 0.05, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0.001, zn: 0.001, se: 0, unit: '碗', uW: 120, type: 'snackCarbs' }
  ],
  proteins: [
    { name: '雞胸肉', c: 0, p: 0.23, f: 0.015, fiber: 0, na: 0.5, phos: 2.0, k: 3.3, ca: 0.05, mag: 0.3, epa: 0, n3: 0.2, b12: 0.002, vitA: 0.1, folic: 0.05, vitD: 0, fe: 0.004, zn: 0.01, se: 0.25, unit: '份', uW: 30, type: 'proteins' },
    { name: '傳統豆腐', c: 0.02, p: 0.08, f: 0.03, fiber: 0.01, na: 0.05, phos: 1.0, k: 1.2, ca: 1.6, mag: 0.5, epa: 0, n3: 1.5, b12: 0, vitA: 0, folic: 0.15, vitD: 0, fe: 0.02, zn: 0.015, se: 0.05, unit: '份', uW: 80, type: 'proteins' },
    { name: '鮭魚', c: 0, p: 0.20, f: 0.13, fiber: 0, na: 0.5, phos: 2.5, k: 3.6, ca: 0.1, mag: 0.3, epa: 4.0, n3: 12.0, b12: 0.03, vitA: 0.4, folic: 0.25, vitD: 0.16, fe: 0.005, zn: 0.005, se: 0.4, unit: '份', uW: 30, type: 'proteins' }, 
    { name: '瘦牛排', c: 0, p: 0.21, f: 0.05, fiber: 0, na: 0.6, phos: 2.1, k: 3.2, ca: 0.1, mag: 0.2, epa: 0.1, n3: 0.3, b12: 0.02, vitA: 0.05, folic: 0.08, vitD: 0.005, fe: 0.025, zn: 0.045, se: 0.2, unit: '份', uW: 30, type: 'proteins' },
    { name: '豬里肌', c: 0, p: 0.21, f: 0.04, fiber: 0, na: 0.5, phos: 2.2, k: 3.5, ca: 0.1, mag: 0.2, epa: 0, n3: 0.1, b12: 0.01, vitA: 0.05, folic: 0.05, vitD: 0.005, fe: 0.01, zn: 0.02, se: 0.1, unit: '份', uW: 30, type: 'proteins' },
    { name: '水煮蛋', c: 0.01, p: 0.13, f: 0.10, fiber: 0, na: 1.4, phos: 1.8, k: 1.3, ca: 0.5, mag: 0.1, epa: 0.1, n3: 0.7, b12: 0.011, vitA: 2.5, folic: 0.45, vitD: 0.016, fe: 0.015, zn: 0.015, se: 0.3, unit: '顆', uW: 55, type: 'proteins' },
    { name: '雞腿肉(去皮)', c: 0, p: 0.18, f: 0.05, fiber: 0, na: 0.8, phos: 1.8, k: 2.5, ca: 0.05, mag: 0.2, epa: 0, n3: 0.1, b12: 0.003, vitA: 0.1, folic: 0.06, vitD: 0, fe: 0.006, zn: 0.015, se: 0.15, unit: '份', uW: 40, type: 'proteins' },
    { name: '鯛魚', c: 0, p: 0.18, f: 0.02, fiber: 0, na: 0.4, phos: 2.0, k: 3.0, ca: 0.1, mag: 0.3, epa: 0.5, n3: 1.5, b12: 0.01, vitA: 0.2, folic: 0.1, vitD: 0.02, fe: 0.004, zn: 0.004, se: 0.35, unit: '份', uW: 35, type: 'proteins' },
    { name: '蝦仁', c: 0, p: 0.20, f: 0.01, fiber: 0, na: 1.5, phos: 2.0, k: 2.0, ca: 0.5, mag: 0.3, epa: 1.0, n3: 2.0, b12: 0.01, vitA: 0.1, folic: 0.02, vitD: 0.001, fe: 0.005, zn: 0.015, se: 0.45, unit: '份', uW: 50, type: 'proteins' },
    { name: '鮪魚罐頭(水煮)', c: 0, p: 0.21, f: 0.01, fiber: 0, na: 3.0, phos: 1.5, k: 2.0, ca: 0.2, mag: 0.2, epa: 1.5, n3: 3.5, b12: 0.025, vitA: 0.1, folic: 0.05, vitD: 0.04, fe: 0.015, zn: 0.01, se: 0.4, unit: '份', uW: 30, type: 'proteins' },
    { name: '雞蛋白(低磷鉀)', c: 0.01, p: 0.11, f: 0, fiber: 0, na: 1.6, phos: 0.15, k: 1.4, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0.001, vitA: 0, folic: 0.02, vitD: 0, fe: 0.001, zn: 0.001, se: 0.1, unit: '顆', uW: 35, type: 'proteins' },
    { name: '豬血(低磷鉀/高鐵)', c: 0, p: 0.06, f: 0, fiber: 0, na: 2.0, phos: 0.2, k: 0.5, ca: 0.3, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0.28, zn: 0.02, se: 0.1, unit: '塊', uW: 100, type: 'proteins' },
    { name: '生豆包(高鈣)', c: 0.05, p: 0.20, f: 0.15, fiber: 0.02, na: 0.1, phos: 1.2, k: 1.5, ca: 2.5, mag: 0.6, epa: 0, n3: 0.5, b12: 0, vitA: 0, folic: 0.1, vitD: 0, fe: 0.025, zn: 0.02, se: 0.05, unit: '片', uW: 50, type: 'proteins' },
    { name: '干貝(極低脂)', c: 0.03, p: 0.16, f: 0.005, fiber: 0, na: 2.0, phos: 1.5, k: 3.2, ca: 0.2, mag: 0.4, epa: 0.1, n3: 0.2, b12: 0.02, vitA: 0, folic: 0.1, vitD: 0, fe: 0.02, zn: 0.03, se: 0.2, unit: '顆', uW: 20, type: 'proteins' },
    { name: '花枝/魷魚(極低脂)', c: 0.02, p: 0.16, f: 0.005, fiber: 0, na: 3.0, phos: 2.0, k: 2.8, ca: 0.3, mag: 0.3, epa: 0.2, n3: 0.4, b12: 0.01, vitA: 0.1, folic: 0.05, vitD: 0, fe: 0.01, zn: 0.015, se: 0.4, unit: '份', uW: 50, type: 'proteins' },
    { name: '蛤蜊肉(極低脂/高鐵)', c: 0.04, p: 0.10, f: 0.005, fiber: 0, na: 4.0, phos: 1.5, k: 3.0, ca: 0.5, mag: 0.2, epa: 0.1, n3: 0.2, b12: 0.5, vitA: 0.2, folic: 0.2, vitD: 0, fe: 0.15, zn: 0.02, se: 0.3, unit: '份', uW: 50, type: 'proteins' },
    { name: '雞里肌(極低脂)', c: 0, p: 0.24, f: 0.006, fiber: 0, na: 0.5, phos: 2.0, k: 3.5, ca: 0.05, mag: 0.3, epa: 0, n3: 0.1, b12: 0.002, vitA: 0.1, folic: 0.05, vitD: 0, fe: 0.005, zn: 0.01, se: 0.2, unit: '條', uW: 40, type: 'proteins' }
  ],
  sides: [
    { name: '番茄炒蛋', c: 0.04, p: 0.05, f: 0.06, fiber: 0.01, na: 2.5, phos: 1.0, k: 2.0, ca: 0.3, mag: 0.1, epa: 0, n3: 0.3, b12: 0.005, vitA: 4.5, folic: 0.2, vitD: 0.01, fe: 0.01, zn: 0.008, se: 0.1, unit: '小盤', uW: 80, type: 'sides' },
    { name: '芹菜炒肉絲', c: 0.03, p: 0.08, f: 0.05, fiber: 0.015, na: 2.0, phos: 1.2, k: 2.5, ca: 0.4, mag: 0.2, epa: 0, n3: 0.1, b12: 0.005, vitA: 0.5, folic: 0.3, vitD: 0.002, fe: 0.015, zn: 0.015, se: 0.05, unit: '小盤', uW: 80, type: 'sides' },
    { name: '毛豆炒豆干', c: 0.05, p: 0.10, f: 0.05, fiber: 0.03, na: 1.5, phos: 1.5, k: 3.0, ca: 1.0, mag: 0.6, epa: 0, n3: 1.0, b12: 0, vitA: 0.5, folic: 1.2, vitD: 0, fe: 0.02, zn: 0.02, se: 0.03, unit: '小盤', uW: 80, type: 'sides' },
    { name: '洋蔥炒蛋', c: 0.05, p: 0.06, f: 0.05, fiber: 0.01, na: 2.0, phos: 0.9, k: 1.8, ca: 0.3, mag: 0.1, epa: 0, n3: 0.2, b12: 0.005, vitA: 1.5, folic: 0.3, vitD: 0.01, fe: 0.01, zn: 0.01, se: 0.1, unit: '小盤', uW: 80, type: 'sides' },
    { name: '胡蘿蔔炒肉片', c: 0.04, p: 0.07, f: 0.04, fiber: 0.015, na: 1.8, phos: 1.1, k: 2.2, ca: 0.2, mag: 0.1, epa: 0, n3: 0.1, b12: 0.005, vitA: 30.0, folic: 0.2, vitD: 0.002, fe: 0.01, zn: 0.015, se: 0.05, unit: '小盤', uW: 80, type: 'sides' },
    { name: '韭菜炒蛋', c: 0.03, p: 0.06, f: 0.06, fiber: 0.02, na: 1.5, phos: 1.0, k: 2.0, ca: 0.5, mag: 0.1, epa: 0, n3: 0.3, b12: 0.005, vitA: 5.0, folic: 0.5, vitD: 0.01, fe: 0.015, zn: 0.01, se: 0.1, unit: '小盤', uW: 80, type: 'sides' },
    { name: '青椒炒肉絲', c: 0.04, p: 0.07, f: 0.04, fiber: 0.02, na: 1.5, phos: 1.0, k: 2.0, ca: 0.2, mag: 0.1, epa: 0, n3: 0.1, b12: 0.005, vitA: 1.5, folic: 0.3, vitD: 0.002, fe: 0.01, zn: 0.015, se: 0.05, unit: '小盤', uW: 80, type: 'sides' },
    { name: '苦瓜鹹蛋', c: 0.03, p: 0.04, f: 0.07, fiber: 0.02, na: 3.5, phos: 1.2, k: 2.5, ca: 0.4, mag: 0.2, epa: 0, n3: 0.2, b12: 0.005, vitA: 2.0, folic: 0.4, vitD: 0.01, fe: 0.01, zn: 0.01, se: 0.1, unit: '小盤', uW: 80, type: 'sides' },
    { name: '香菇炒雞丁', c: 0.05, p: 0.09, f: 0.03, fiber: 0.03, na: 1.5, phos: 1.5, k: 2.5, ca: 0.1, mag: 0.2, epa: 0, n3: 0.1, b12: 0.002, vitA: 0.2, folic: 0.3, vitD: 0.02, fe: 0.01, zn: 0.012, se: 0.15, unit: '小盤', uW: 80, type: 'sides' },
    { name: '木耳炒蛋(高鈣低磷)', c: 0.03, p: 0.06, f: 0.06, fiber: 0.03, na: 1.8, phos: 0.8, k: 1.2, ca: 0.6, mag: 0.1, epa: 0, n3: 0.1, b12: 0.005, vitA: 1.0, folic: 0.2, vitD: 0.01, fe: 0.015, zn: 0.01, se: 0.1, unit: '小盤', uW: 80, type: 'sides' },
    { name: '韭黃炒豆包(高鈣)', c: 0.04, p: 0.12, f: 0.08, fiber: 0.02, na: 1.5, phos: 1.0, k: 1.5, ca: 1.5, mag: 0.3, epa: 0, n3: 0.2, b12: 0, vitA: 0.5, folic: 0.5, vitD: 0, fe: 0.02, zn: 0.015, se: 0.04, unit: '小盤', uW: 80, type: 'sides' }
  ],
  veggies: [
    { name: '高麗菜', c: 0.05, p: 0.013, f: 0, fiber: 0.013, na: 0.1, phos: 0.3, k: 1.5, ca: 0.4, mag: 0.1, epa: 0, n3: 0.1, b12: 0, vitA: 0.1, folic: 0.5, vitD: 0, fe: 0.004, zn: 0.002, se: 0.01, unit: '份', uW: 100, type: 'veggies' },
    { name: '青花菜', c: 0.04, p: 0.028, f: 0, fiber: 0.026, na: 0.3, phos: 0.7, k: 3.0, ca: 0.5, mag: 0.2, epa: 0, n3: 0.2, b12: 0, vitA: 3.5, folic: 0.6, vitD: 0, fe: 0.008, zn: 0.004, se: 0.02, unit: '份', uW: 100, type: 'veggies' },
    { name: '菠菜', c: 0.03, p: 0.028, f: 0, fiber: 0.022, na: 0.8, phos: 0.5, k: 5.5, ca: 1.0, mag: 0.8, epa: 0, n3: 0.1, b12: 0, vitA: 25.0, folic: 1.5, vitD: 0, fe: 0.025, zn: 0.005, se: 0.01, unit: '份', uW: 100, type: 'veggies' },
    { name: '小白菜', c: 0.02, p: 0.015, f: 0, fiber: 0.012, na: 0.2, phos: 0.4, k: 2.5, ca: 1.0, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 1.5, folic: 0.8, vitD: 0, fe: 0.01, zn: 0.002, se: 0.01, unit: '份', uW: 100, type: 'veggies' },
    { name: '青椒', c: 0.05, p: 0.01, f: 0, fiber: 0.02, na: 0.05, phos: 0.2, k: 1.8, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 2.0, folic: 0.2, vitD: 0, fe: 0.004, zn: 0.001, se: 0.005, unit: '份', uW: 100, type: 'veggies' },
    { name: '空心菜', c: 0.03, p: 0.02, f: 0, fiber: 0.02, na: 0.2, phos: 0.4, k: 4.5, ca: 0.8, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 12.0, folic: 1.0, vitD: 0, fe: 0.02, zn: 0.004, se: 0.01, unit: '份', uW: 100, type: 'veggies' },
    { name: '大白菜', c: 0.03, p: 0.01, f: 0, fiber: 0.015, na: 0.1, phos: 0.3, k: 1.5, ca: 0.3, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.2, folic: 0.4, vitD: 0, fe: 0.003, zn: 0.002, se: 0.005, unit: '份', uW: 100, type: 'veggies' },
    { name: '絲瓜', c: 0.04, p: 0.01, f: 0, fiber: 0.01, na: 0.1, phos: 0.2, k: 1.2, ca: 0.2, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.5, folic: 0.2, vitD: 0, fe: 0.004, zn: 0.001, se: 0.005, unit: '份', uW: 100, type: 'veggies' },
    { name: '四季豆', c: 0.07, p: 0.02, f: 0, fiber: 0.03, na: 0.1, phos: 0.4, k: 2.0, ca: 0.4, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 1.0, folic: 0.4, vitD: 0, fe: 0.01, zn: 0.002, se: 0.01, unit: '份', uW: 100, type: 'veggies' },
    { name: '金針菇', c: 0.03, p: 0.02, f: 0, fiber: 0.025, na: 0.1, phos: 0.8, k: 2.5, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0, folic: 0.3, vitD: 0.05, fe: 0.01, zn: 0.005, se: 0.02, unit: '份', uW: 100, type: 'veggies' },
    { name: '芥藍菜(水煮/高鈣)', c: 0.04, p: 0.02, f: 0, fiber: 0.02, na: 0.1, phos: 0.4, k: 1.5, ca: 1.8, mag: 0.3, epa: 0, n3: 0, b12: 0, vitA: 15.0, folic: 0.9, vitD: 0, fe: 0.015, zn: 0.004, se: 0.01, unit: '份', uW: 100, type: 'veggies' },
    { name: '黑木耳(熟/高鈣)', c: 0.05, p: 0.01, f: 0, fiber: 0.05, na: 0.1, phos: 0.2, k: 0.6, ca: 0.5, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 0.1, folic: 0.1, vitD: 0.1, fe: 0.04, zn: 0.005, se: 0.02, unit: '份', uW: 100, type: 'veggies' },
    { name: '大黃瓜(熟/低鉀)', c: 0.03, p: 0.01, f: 0, fiber: 0.01, na: 0.1, phos: 0.2, k: 1.0, ca: 0.3, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.2, folic: 0.1, vitD: 0, fe: 0.002, zn: 0.001, se: 0.005, unit: '份', uW: 100, type: 'veggies' },
    { name: '豆芽菜(熟/低鉀)', c: 0.03, p: 0.03, f: 0, fiber: 0.015, na: 0.1, phos: 0.5, k: 1.0, ca: 0.3, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.1, folic: 0.3, vitD: 0, fe: 0.008, zn: 0.003, se: 0.01, unit: '份', uW: 100, type: 'veggies' }
  ],
  dairy: [
    { name: '全脂鮮奶', c: 0.05, p: 0.03, f: 0.03, fiber: 0, na: 0.4, phos: 0.9, k: 1.5, ca: 1.0, mag: 0.1, epa: 0, n3: 0.1, b12: 0.004, vitA: 0.38, folic: 0.05, vitD: 0.01, fe: 0.001, zn: 0.004, se: 0.02, unit: '杯', uW: 240, type: 'dairy' },
    { name: '低脂鮮奶', c: 0.05, p: 0.03, f: 0.015, fiber: 0, na: 0.4, phos: 0.9, k: 1.5, ca: 1.0, mag: 0.1, epa: 0, n3: 0.05, b12: 0.004, vitA: 0.15, folic: 0.05, vitD: 0.01, fe: 0.001, zn: 0.004, se: 0.02, unit: '杯', uW: 240, type: 'dairy' },
    { name: '無糖優酪乳', c: 0.05, p: 0.03, f: 0, fiber: 0, na: 0.5, phos: 1.0, k: 1.6, ca: 1.1, mag: 0.1, epa: 0, n3: 0, b12: 0.003, vitA: 0.1, folic: 0.05, vitD: 0.01, fe: 0.001, zn: 0.005, se: 0.02, unit: '杯', uW: 240, type: 'dairy' },
    { name: '無糖豆漿', c: 0.01, p: 0.03, f: 0.02, fiber: 0.01, na: 0.05, phos: 0.5, k: 1.2, ca: 0.2, mag: 0.3, epa: 0, n3: 0.8, b12: 0, vitA: 0.05, folic: 0.1, vitD: 0, fe: 0.008, zn: 0.006, se: 0.01, unit: '杯', uW: 190, type: 'dairy' },
    { name: '希臘優格(無糖)', c: 0.04, p: 0.09, f: 0.05, fiber: 0, na: 0.3, phos: 1.2, k: 1.4, ca: 1.1, mag: 0.1, epa: 0, n3: 0.1, b12: 0.007, vitA: 0.2, folic: 0.06, vitD: 0.002, fe: 0.002, zn: 0.006, se: 0.02, unit: '碗', uW: 210, type: 'dairy' },
    { name: '低磷鉀營養品', c: 0.12, p: 0.04, f: 0.04, fiber: 0.01, na: 0.8, phos: 0.5, k: 0.8, ca: 1.0, mag: 0.2, epa: 0, n3: 0.5, b12: 0.005, vitA: 1.5, folic: 0.8, vitD: 0.05, fe: 0.015, zn: 0.015, se: 0.05, unit: '罐', uW: 240, type: 'dairy' }
  ],
  fruits: [
    { name: '蘋果', c: 0.14, p: 0, f: 0, fiber: 0.024, na: 0.02, phos: 0.1, k: 1.1, ca: 0.05, mag: 0.05, epa: 0, n3: 0, b12: 0, vitA: 0.3, folic: 0.03, vitD: 0, fe: 0.001, zn: 0.001, se: 0, unit: '小顆', uW: 130, type: 'fruits' },
    { name: '香蕉', c: 0.23, p: 0.01, f: 0, fiber: 0.026, na: 0.01, phos: 0.2, k: 3.6, ca: 0.05, mag: 0.3, epa: 0, n3: 0.05, b12: 0, vitA: 0.4, folic: 0.2, vitD: 0, fe: 0.003, zn: 0.002, se: 0.01, unit: '根', uW: 70, type: 'fruits' },
    { name: '芭樂', c: 0.08, p: 0.01, f: 0, fiber: 0.054, na: 0.05, phos: 0.3, k: 2.8, ca: 0.2, mag: 0.1, epa: 0, n3: 0.1, b12: 0, vitA: 1.5, folic: 0.1, vitD: 0, fe: 0.002, zn: 0.002, se: 0.01, unit: '小顆', uW: 155, type: 'fruits' },
    { name: '奇異果', c: 0.15, p: 0.01, f: 0, fiber: 0.03, na: 0.03, phos: 0.3, k: 3.1, ca: 0.3, mag: 0.2, epa: 0, n3: 0.4, b12: 0, vitA: 3.0, folic: 0.25, vitD: 0, fe: 0.003, zn: 0.001, se: 0.02, unit: '顆', uW: 70, type: 'fruits' },
    { name: '柳丁', c: 0.12, p: 0.01, f: 0, fiber: 0.02, na: 0.01, phos: 0.2, k: 1.8, ca: 0.4, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 1.0, folic: 0.3, vitD: 0, fe: 0.001, zn: 0.001, se: 0.01, unit: '顆', uW: 130, type: 'fruits' },
    { name: '木瓜', c: 0.11, p: 0.01, f: 0, fiber: 0.02, na: 0.02, phos: 0.1, k: 1.8, ca: 0.2, mag: 0.2, epa: 0, n3: 0, b12: 0, vitA: 8.0, folic: 0.4, vitD: 0, fe: 0.002, zn: 0.001, se: 0.01, unit: '份', uW: 150, type: 'fruits' },
    { name: '小番茄', c: 0.04, p: 0.01, f: 0, fiber: 0.01, na: 0.05, phos: 0.2, k: 2.3, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 6.0, folic: 0.1, vitD: 0, fe: 0.003, zn: 0.001, se: 0.01, unit: '顆', uW: 10, type: 'fruits' },
    { name: '火龍果', c: 0.13, p: 0.01, f: 0, fiber: 0.03, na: 0.01, phos: 0.2, k: 2.0, ca: 0.1, mag: 0.3, epa: 0, n3: 0, b12: 0, vitA: 0.5, folic: 0.1, vitD: 0, fe: 0.005, zn: 0.002, se: 0.01, unit: '份', uW: 110, type: 'fruits' },
    { name: '水梨(低鉀)', c: 0.12, p: 0, f: 0, fiber: 0.02, na: 0.02, phos: 0.1, k: 1.2, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.1, folic: 0.05, vitD: 0, fe: 0.001, zn: 0.001, se: 0, unit: '顆', uW: 150, type: 'fruits' },
    { name: '鳳梨(低鉀)', c: 0.13, p: 0, f: 0, fiber: 0.015, na: 0.01, phos: 0.1, k: 1.1, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.5, folic: 0.2, vitD: 0, fe: 0.003, zn: 0.001, se: 0.01, unit: '碗', uW: 130, type: 'fruits' },
    { name: '葡萄(低鉀)', c: 0.16, p: 0.01, f: 0, fiber: 0.01, na: 0.02, phos: 0.2, k: 1.3, ca: 0.1, mag: 0.1, epa: 0, n3: 0, b12: 0, vitA: 0.5, folic: 0.05, vitD: 0, fe: 0.003, zn: 0.001, se: 0.01, unit: '碗', uW: 130, type: 'fruits' }
  ],
  oils: [
    { name: '橄欖油', f: 1, fiber: 0, na: 0, phos: 0, k: 0, ca: 0, mag: 0, epa: 0, n3: 7.0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0, zn: 0, se: 0, unit: '茶匙', uW: 5 },
    { name: '酪梨油', f: 1, fiber: 0, na: 0, phos: 0, k: 0, ca: 0, mag: 0, epa: 0, n3: 1.0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0, zn: 0, se: 0, unit: '茶匙', uW: 5 },
    { name: '芥花油', f: 1, fiber: 0, na: 0, phos: 0, k: 0, ca: 0, mag: 0, epa: 0, n3: 90.0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0, zn: 0, se: 0, unit: '茶匙', uW: 5 },
    { name: '芝麻香油', f: 1, fiber: 0, na: 0, phos: 0, k: 0, ca: 0, mag: 0, epa: 0, n3: 4.0, b12: 0, vitA: 0, folic: 0, vitD: 0, fe: 0, zn: 0, se: 0, unit: '茶匙', uW: 5 }
  ]
};

export const ALL_PLANNER_CATEGORIES = [
  { label: '🍚 主食類', type: 'carbs' as const },
  { label: '🥩 豆魚蛋肉', type: 'proteins' as const },
  { label: '🍲 半葷素副菜', type: 'sides' as const },
  { label: '🥬 蔬菜類', type: 'veggies' as const },
  { label: '🍪 全穀點心', type: 'snackCarbs' as const },
  { label: '🥛 乳品類', type: 'dairy' as const },
  { label: '🍎 水果類', type: 'fruits' as const }
];

export const COOKING_METHODS = [
  '水煮', '川燙', '水煮川燙', '清蒸', '原味清蒸', '電鍋蒸煮', '電鍋炊煮', '原味蒸煮', '炊煮',
  '舒肥', '烤箱(無油)', '生菜沙拉', '涼拌', '無油悶煮', '原味',
  '微油拌飯', '滴油炊煮', '清油拌勻', '水煮滴油', '水油炒', '蒜香燙青菜', '微波淋油',
  '少油香煎', '微油清炒', '烤箱微油', '烤箱烘烤',
  '清炒', '乾煎', '嫩煎', '微油香煎', '油煎', '黃金煎飯糰',
  '熱炒', '爆炒', '紅燒', '酥炸', '蔥油拌', '熱炒(炒飯)', '熱炒(炒麵)', '香酥拔絲'
];

export const getOilGramsForMethod = (method: string): number => {
  const zero = ['水煮', '川燙', '水煮川燙', '清蒸', '原味清蒸', '電鍋蒸煮', '電鍋炊煮', '原味蒸煮', '炊煮', '舒肥', '烤箱(無油)', '生菜沙拉', '涼拌', '無油悶煮', '原味'];
  const low = ['微油拌飯', '滴油炊煮', '清油拌勻', '水煮滴油', '水油炒', '蒜香燙青菜', '微波淋油', '少油香煎', '微油清炒', '烤箱微油', '烤箱烘烤', '微油香煎'];
  const mid = ['清炒', '乾煎', '嫩煎', '油煎'];
  const high = ['黃金煎飯糰', '熱炒', '爆炒', '紅燒', '酥炸', '蔥油拌', '熱炒(炒飯)', '熱炒(炒麵)', '香酥拔絲'];

  if (zero.includes(method)) return 0;
  if (low.includes(method)) return 3;
  if (mid.includes(method)) return 8;
  if (high.includes(method)) return 15;
  return 5;
};

export const getIconForType = (type?: string): string => {
  switch (type) {
    case 'carbs': case 'snackCarbs': return '🌾';
    case 'proteins': return '🐟';
    case 'sides': return '🍳';
    case 'veggies': return '🥬';
    case 'dairy': return '🥛';
    case 'fruits': return '🍎';
    default: return '🍽️';
  }
};

export const getLabelForType = (type?: string): string => {
  switch (type) {
    case 'carbs': case 'snackCarbs': return '主食';
    case 'proteins': return '蛋白質';
    case 'sides': return '副菜';
    case 'veggies': return '蔬菜';
    case 'dairy': return '乳品';
    case 'fruits': return '水果';
    default: return '附餐';
  }
};

export const getCookingMethod = (oilGrams: number, type: string, itemName: string = ''): string[] => {
  if (type === 'carbs' || type === 'snackCarbs') {
    if (itemName.includes('飯')) {
      if (oilGrams === 0) return ['電鍋炊煮', '原味蒸煮'];
      if (oilGrams > 0 && oilGrams <= 5) return ['微油拌飯', '滴油炊煮']; 
      return ['熱炒(炒飯)', '黃金煎飯糰'];
    }
    if (itemName.includes('麵') || itemName.includes('粉')) {
      if (oilGrams === 0) return ['水煮川燙', '原味清蒸'];
      if (oilGrams > 0 && oilGrams <= 5) return ['清油拌勻', '水煮滴油'];
      return ['熱炒', '蔥油拌'];
    }
    if (itemName.includes('糕')) {
      if (oilGrams === 0) return ['電鍋蒸煮'];
      return ['少油香煎', '乾煎'];
    }
    if (['地瓜(熟)', '馬鈴薯(熟)', '南瓜(熟)', '芋頭(熟)', '玉米(熟)'].includes(itemName)) {
      if (oilGrams === 0) return ['電鍋蒸煮', '水煮'];
      if (oilGrams > 0 && oilGrams <= 5) return ['烤箱烘烤', '微油香煎'];
      return ['油煎', '香酥拔絲'];
    }
    return ['原味蒸煮', '炊煮'];
  }
  if (oilGrams === 0) {
    if (type === 'veggies') return ['川燙', '清蒸', '生菜沙拉'];
    if (type === 'proteins') return ['水煮', '清蒸', '舒肥', '烤箱(無油)'];
    if (type === 'sides') return ['涼拌', '無油悶煮'];
    return ['原味', '清蒸'];
  }
  if (oilGrams > 0 && oilGrams <= 5) {
    if (type === 'veggies') return ['水油炒', '蒜香燙青菜', '微波淋油'];
    return ['少油香煎', '微油清炒', '烤箱微油'];
  }
  if (oilGrams > 5 && oilGrams <= 10) return ['清炒', '乾煎', '嫩煎'];
  return ['熱炒', '紅燒', '酥炸', '爆炒'];
};
