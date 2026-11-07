import { 
  DayMenu, 
  FoodItemForPlanner, 
  MealPlan, 
  MealStats, 
  MealsConfig, 
  OilItem, 
  PlannerTargets, 
  SnacksConfig 
} from './types';
import { getCookingMethod, getOilGramsForMethod } from './foodDb';

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function calculateTotalStats(meals: MealPlan[], oils: OilItem[]): MealStats {
  const totalActual = { 
    p: 0, f: 0, c: 0, fiber: 0, na: 0, phos: 0, k: 0, ca: 0, mag: 0, 
    epa: 0, n3: 0, b12: 0, b1: 0, b2: 0, niacin: 0, b6: 0, vitE: 0,
    vitA: 0, folic: 0, vitD: 0, fe: 0, zn: 0, se: 0 
  };

  const addNut = (item: FoodItemForPlanner | OilItem | null | undefined, weight: number) => {
    if (!item) return; 
    const w = Number(weight) || 0;
    totalActual.p += (('p' in item ? item.p : 0) || 0) * w; 
    totalActual.f += (item.f || 0) * w; 
    totalActual.c += (('c' in item ? item.c : 0) || 0) * w;
    totalActual.fiber += (item.fiber || 0) * w; 
    totalActual.na += (item.na || 0) * w; 
    totalActual.phos += (item.phos || 0) * w;
    totalActual.k += (item.k || 0) * w; 
    totalActual.ca += (item.ca || 0) * w; 
    totalActual.mag += (item.mag || 0) * w;
    totalActual.epa += (item.epa || 0) * w; 
    totalActual.n3 += (item.n3 || 0) * w;
    totalActual.b12 += (item.b12 || 0) * w; 
    if ('b1' in item && item.b1) totalActual.b1 += (item.b1 || 0) * w;
    if ('b2' in item && item.b2) totalActual.b2 += (item.b2 || 0) * w;
    if ('niacin' in item && item.niacin) totalActual.niacin += (item.niacin || 0) * w;
    if ('b6' in item && item.b6) totalActual.b6 += (item.b6 || 0) * w;
    if ('vitE' in item && item.vitE) totalActual.vitE += (item.vitE || 0) * w;
    totalActual.vitA += (item.vitA || 0) * w;
    totalActual.folic += (item.folic || 0) * w; 
    totalActual.vitD += (item.vitD || 0) * w;
    totalActual.fe += (item.fe || 0) * w; 
    totalActual.zn += (item.zn || 0) * w; 
    totalActual.se += (item.se || 0) * w;
  };

  meals.forEach(meal => {
    if (meal.isMain) {
      if (meal.carb?.item) addNut(meal.carb.item, meal.carb.weight); 
      if (meal.protein?.item) addNut(meal.protein.item, meal.protein.weight);
      if (meal.side?.item) addNut(meal.side.item, meal.side.weight); 
      if (meal.veggie?.item) addNut(meal.veggie.item, meal.veggie.weight);

      const oilItem = oils.find(o => o.name === meal.oilName) || oils[0];
      if (oilItem) {
        let totalOil = (meal.carb ? (Number(meal.carb.oil) || 0) : 0) 
          + (meal.protein ? (Number(meal.protein.oil) || 0) : 0) 
          + (meal.side ? (Number(meal.side.oil) || 0) : 0) 
          + (meal.veggie ? (Number(meal.veggie.oil) || 0) : 0);
          
        if (meal.extra) { 
          meal.extra.forEach(ex => { 
            if (ex.oil && ex.oil > 0) totalOil += Number(ex.oil); 
          }); 
        }
        addNut(oilItem, totalOil);
      }
      if (meal.extra) meal.extra.forEach(ex => addNut(ex, ex.weight));
    } else {
      if (meal.items) meal.items.forEach(ex => addNut(ex, ex.weight));
    }
  });

  return { 
    ...totalActual, 
    calories: Math.round((totalActual.p * 4) + (totalActual.c * 4) + (totalActual.f * 9)) 
  };
}

export function generateMultiDayMenu(
  numDays: number,
  targets: PlannerTargets,
  hbvRatio: number,
  mealsConfig: MealsConfig,
  snacksConfig: SnacksConfig,
  foodDb: {
    carbs: FoodItemForPlanner[];
    snackCarbs: FoodItemForPlanner[];
    proteins: FoodItemForPlanner[];
    sides: FoodItemForPlanner[];
    veggies: FoodItemForPlanner[];
    dairy: FoodItemForPlanner[];
    fruits: FoodItemForPlanner[];
    oils: OilItem[];
  }
): DayMenu[] {
  const multiDayMenu: DayMenu[] = [];
  let prevDayMealItems: Record<string, string[]> = { 
    '早餐': [], '午餐': [], '晚餐': [], '早點': [], '午點': [], '晚點': [] 
  };

  for (let day = 0; day < numDays; day++) {
    const newMeals: MealPlan[] = []; 
    const currentDayItems: string[] = []; 
    const nextPrevDayMealItems: Record<string, string[]> = { 
      '早餐': [], '午餐': [], '晚餐': [], '早點': [], '午點': [], '晚點': [] 
    };

    const getUniqueItem = (pool: FoodItemForPlanner[], mealName: string): FoodItemForPlanner => {
      let available = pool.filter(item => {
        const inSameDay = currentDayItems.includes(item.name);
        const inPrevDaySameMeal = prevDayMealItems[mealName] && prevDayMealItems[mealName].includes(item.name);
        return !inSameDay && !inPrevDaySameMeal; 
      });
      if (available.length === 0) available = pool.filter(item => !currentDayItems.includes(item.name));
      if (available.length === 0) available = pool;
      const selected = available[Math.floor(Math.random() * available.length)];
      currentDayItems.push(selected.name);
      if (nextPrevDayMealItems[mealName]) nextPrevDayMealItems[mealName].push(selected.name);
      return selected;
    };

    const getSnackItem = (mealName: string) => {
      const types = ['dairy', 'fruits', 'snackCarbs'] as const;
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const pool = foodDb[selectedType];
      const item = getUniqueItem(pool, mealName);
      if (selectedType === 'dairy') return { ...item, weight: 240, type: 'dairy' as const };
      if (selectedType === 'fruits') return { ...item, weight: 130, type: 'fruits' as const };
      return { ...item, weight: 60, type: 'snackCarbs' as const };
    };

    const getSnackItems = (mealName: string) => 
      Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => getSnackItem(mealName));

    const dailySnack1 = getSnackItems('早點'); 
    const dailySnack2 = getSnackItems('午點'); 
    const dailySnack3 = getSnackItems('晚點');

    let dairyP = 0;
    [...dailySnack1, ...dailySnack2, ...dailySnack3].forEach(s => { 
      if (s.type === 'dairy') dairyP += (s.p || 0) * s.weight; 
    });

    const hbvTargetP = targets.protein * (hbvRatio / 100);
    const activeMealsCount = (mealsConfig.breakfast ? 1 : 0) + (mealsConfig.lunch ? 1 : 0) + (mealsConfig.dinner ? 1 : 0);
    const mealsDivisor = Math.max(1, activeMealsCount);
    const mainDishTotalTargetP = Math.max(0, hbvTargetP - dairyP);
    const mainDishPerMealP = mainDishTotalTargetP / mealsDivisor;

    let tempTotalActualP = 0, tempTotalActualF = 0, tempTotalActualC = 0;
    [...dailySnack1, ...dailySnack2, ...dailySnack3].forEach(s => {
      tempTotalActualP += (s.p || 0) * s.weight; 
      tempTotalActualF += (s.f || 0) * s.weight; 
      tempTotalActualC += (s.c || 0) * s.weight;
    });

    const remainingTargets = {
      p: Math.max(0, targets.protein - tempTotalActualP) / mealsDivisor,
      f: Math.max(0, targets.fat - tempTotalActualF) / mealsDivisor,
      c: Math.max(0, targets.carbs - tempTotalActualC) / mealsDivisor
    };

    const createMainMeal = (mealName: string, extraItems: any[] = []): MealPlan => {
      const carbItem = getUniqueItem(foodDb.carbs, mealName); 
      const proteinItem = getUniqueItem(foodDb.proteins, mealName);
      const sideItem = getUniqueItem(foodDb.sides, mealName); 
      const veggieItem = getUniqueItem(foodDb.veggies, mealName);
      const oilItem = getRandom(foodDb.oils);

      const veggieWeight = 100; 
      let proteinWeight = Math.max(0, mainDishPerMealP / (proteinItem.p || 0.2));
      let C_rem = remainingTargets.c - (veggieItem.c * veggieWeight);
      let P_rem = remainingTargets.p - (veggieItem.p * veggieWeight) - (proteinItem.p * proteinWeight);
      
      let sideWeight = 0; 
      let carbWeight = 0;
      const ratio = (carbItem.c > 0) ? (carbItem.p / carbItem.c) : 0;
      const denom = sideItem.p - (sideItem.c * ratio);

      if (denom > 0.001) { 
        sideWeight = (P_rem - C_rem * ratio) / denom; 
        if (sideWeight < 0) sideWeight = 0; 
      } else { 
        sideWeight = Math.max(0, P_rem / (sideItem.p || 1)); 
      }

      carbWeight = (C_rem - sideWeight * sideItem.c) / (carbItem.c || 1);
      if (carbWeight < 0) { 
        carbWeight = 0; 
        sideWeight = Math.max(0, P_rem / (sideItem.p || 1)); 
      }

      const currentFat = (veggieItem.f * veggieWeight) + (carbItem.f * carbWeight) + (proteinItem.f * proteinWeight) + (sideItem.f * sideWeight);
      let oilWeight = Math.max(0, (remainingTargets.f - currentFat) / (oilItem.f || 1));
      const roundedTotalOil = Math.round(oilWeight);

      let remainingOil = roundedTotalOil; 
      const dishOils = [0, 0, 0, 0];
      while (remainingOil > 0) { 
        dishOils[Math.floor(Math.random() * 4)]++; 
        remainingOil--; 
      }

      return {
        isMain: true, 
        name: mealName, 
        oilName: oilItem.name,
        targets: { c: remainingTargets.c, p: remainingTargets.p, f: remainingTargets.f, mainP: mainDishPerMealP },
        carb: { 
          item: carbItem, 
          weight: Math.round(carbWeight), 
          method: getRandom(getCookingMethod(dishOils[0], 'carbs', carbItem.name)), 
          oil: dishOils[0] 
        },
        protein: { 
          item: proteinItem, 
          weight: Math.round(proteinWeight), 
          method: getRandom(getCookingMethod(dishOils[1], 'proteins', proteinItem.name)), 
          oil: dishOils[1] 
        },
        side: { 
          item: sideItem, 
          weight: Math.round(sideWeight), 
          method: getRandom(getCookingMethod(dishOils[2], 'sides', sideItem.name)), 
          oil: dishOils[2] 
        },
        veggie: { 
          item: veggieItem, 
          weight: Math.round(veggieWeight), 
          method: getRandom(getCookingMethod(dishOils[3], 'veggies', veggieItem.name)), 
          oil: dishOils[3] 
        },
        extra: extraItems 
      };
    };

    if (mealsConfig.breakfast) {
      if (snacksConfig.morning) { 
        newMeals.push(createMainMeal('早餐')); 
        newMeals.push({ isMain: false, name: '早點', items: dailySnack1 }); 
      } else { 
        newMeals.push(createMainMeal('早餐', dailySnack1)); 
      }
    } else { 
      newMeals.push({ isMain: false, name: '早點 (獨立保留)', items: dailySnack1 }); 
    }

    if (mealsConfig.lunch) {
      if (snacksConfig.afternoon) { 
        newMeals.push(createMainMeal('午餐')); 
        newMeals.push({ isMain: false, name: '午點', items: dailySnack2 }); 
      } else { 
        newMeals.push(createMainMeal('午餐', dailySnack2)); 
      }
    } else { 
      newMeals.push({ isMain: false, name: '午點 (獨立保留)', items: dailySnack2 }); 
    }

    if (mealsConfig.dinner) {
      if (snacksConfig.evening) { 
        newMeals.push(createMainMeal('晚餐')); 
        newMeals.push({ isMain: false, name: '晚點', items: dailySnack3 }); 
      } else { 
        newMeals.push(createMainMeal('晚餐', dailySnack3)); 
      }
    } else { 
      newMeals.push({ isMain: false, name: '晚點 (獨立保留)', items: dailySnack3 }); 
    }

    prevDayMealItems = nextPrevDayMealItems;
    multiDayMenu.push({ 
      day: day + 1, 
      meals: newMeals, 
      stats: calculateTotalStats(newMeals, foodDb.oils) 
    });
  }

  return multiDayMenu;
}

export function parseCsvCustomFoods(
  csvText: string,
  currentDb: typeof import('./foodDb').INITIAL_FOOD_DB
): { newDb: typeof import('./foodDb').INITIAL_FOOD_DB; count: number } {
  const lines = csvText.split('\n');
  let importCount = 0;
  const newDb = {
    carbs: [...currentDb.carbs],
    snackCarbs: [...currentDb.snackCarbs],
    proteins: [...currentDb.proteins],
    sides: [...currentDb.sides],
    veggies: [...currentDb.veggies],
    dairy: [...currentDb.dairy],
    fruits: [...currentDb.fruits],
    oils: [...currentDb.oils]
  };

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
    if (cols.length < 4) continue;
    
    const cat = cols[0] as keyof typeof newDb; 
    if (newDb[cat] && cat !== 'oils') {
      const newItem: FoodItemForPlanner = {
        name: cols[1], 
        unit: cols[2] || '份', 
        uW: parseFloat(cols[3]) || 100,
        c: parseFloat(cols[4]) || 0, 
        p: parseFloat(cols[5]) || 0, 
        f: parseFloat(cols[6]) || 0,
        fiber: parseFloat(cols[7]) || 0, 
        na: parseFloat(cols[8]) || 0, 
        k: parseFloat(cols[9]) || 0,
        phos: parseFloat(cols[10]) || 0, 
        ca: parseFloat(cols[11]) || 0, 
        mag: parseFloat(cols[12]) || 0,
        epa: parseFloat(cols[13]) || 0, 
        n3: parseFloat(cols[14]) || 0, 
        b12: parseFloat(cols[15]) || 0,
        vitA: parseFloat(cols[16]) || 0, 
        folic: parseFloat(cols[17]) || 0, 
        vitD: parseFloat(cols[18]) || 0,
        fe: parseFloat(cols[19]) || 0, 
        zn: parseFloat(cols[20]) || 0, 
        se: parseFloat(cols[21]) || 0,
        type: cat as any
      };
      (newDb[cat] as FoodItemForPlanner[]).push(newItem);
      importCount++;
    }
  }

  return { newDb, count: importCount };
}

export function buildCsvTemplate(): string {
  return "\uFEFF類別碼,食材名稱,單位,單位重量(g),碳水(c),蛋白質(p),脂肪(f),纖維(fiber),鈉(na),鉀(k),磷(phos),鈣(ca),鎂(mag),EPA(epa),Omega3(n3),維生素B12(b12),維生素A(vitA),葉酸(folic),維生素D(vitD),鐵(fe),鋅(zn),硒(se)\n" +
         "★必填(不可改):,carbs(主食)/proteins(蛋白質)/sides(副菜)/veggies(蔬菜)/snackCarbs(點心)/dairy(乳品)/fruits(水果),★版權宣告所有人: richardmimic / 營養吳理,★以下營養素請填寫【每 1 公克】的數值(可填0),,,,,,,,,,,,,,,,,,\n" +
         "carbs,特製胚芽紫米飯(範例),碗,160,0.25,0.04,0.01,0.02,0.02,1.5,1.0,0.1,0.5,0,0,0,0,0.1,0,0.01,0.01,0.01";
}
