import React, { useState, useEffect, useMemo, useId } from 'react';
import { 
  Leaf, 
  UserCircle, 
  Database, 
  Search, 
  XCircle, 
  SlidersHorizontal, 
  Scale, 
  PieChart, 
  Trophy, 
  Activity, 
  Sparkles, 
  PlusCircle, 
  X, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeftRight, 
  Trash2, 
  Stethoscope, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Sliders, 
  CheckCircle, 
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Apple,
  Briefcase,
  Utensils,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Calculator,
  ClipboardCheck
} from 'lucide-react';
import { 
  FoodItem, 
  UserProfile, 
  DriRule, 
  BasketItem, 
  MealType,
  INITIAL_DRIS_RULES, 
  INITIAL_DEFAULT_FOODS,
  PREGNANCY_ADDONS, 
  RANK_DIM_CONFIG, 
  DimensionKey, 
  NUTRIENT_META_MAP, 
  normalizeFoodItem, 
  parseNumericField,
  COOKING_OIL_OPTIONS,
  getCookingOilProfile 
} from './types';
import { 
  CLINICAL_DIET_PRESETS, 
  ClinicalDietType, 
  calculateClinicalGoals, 
  estimateSixFoodPortions 
} from './clinical';
import { MenuPlannerView } from './components/MenuPlannerView';

// 透過 Vite 環境變數安全注入 Google Apps Script 雲端試算表 Web App 端點 (非硬編碼私有部署 ID)
const DEFAULT_GOOGLE_SHEETS_URL = (import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL as string) || "";

// 主系統支援的獨立工具清單
export type ToolType = 'atlas' | 'analyzer' | 'planner';

// 飲食分析評估二級標籤 ('assessment' 飲食評估 | 'analysis' 飲食分析)
export type AnalyzerSubTab = 'assessment' | 'analysis';

export default function App() {
  const customBaseValInputId = useId();
  const rankSortOrderId = useId();
  const minValInputId = useId();
  const maxValInputId = useId();
  const rankNutrientSelectId = useId();
  const compareSelectAId = useId();
  const compareSelectBId = useId();
  const detailPortionInputId = useId();
  const detailCookingOilInputId = useId();
  const detailCookingOilSelectId = useId();
  const profileAgeGroupId = useId();
  const profileActivityId = useId();
  const profilePregnancyId = useId();
  const clinicalDietTypeId = useId();
  const heightInputId = useId();
  const weightInputId = useId();

  // 頂層工具包狀態：當前使用工具 ('atlas' 台灣食材營養寶典 | 'analyzer' 飲食分析評估系統)
  const [activeTool, setActiveTool] = useState<ToolType>('atlas');

  // 食材寶典內部的次級標籤 ('search' | 'rank' | 'compare')
  const [atlasSubTab, setAtlasSubTab] = useState<'search' | 'rank' | 'compare'>('search');

  // 飲食分析評估內部的次級標籤 ('assessment' 飲食評估 | 'analysis' 飲食分析)
  const [analyzerSubTab, setAnalyzerSubTab] = useState<AnalyzerSubTab>('assessment');

  // DRIs 營養素分類篩選 ('all' 全部 | 'macro' 熱量與巨量 | 'mineral' 礦物質與電解質 | 'vitamin' 維生素群)
  const [driCategoryFilter, setDriCategoryFilter] = useState<'all' | 'macro' | 'mineral' | 'vitamin'>('all');

  // 食物資料庫與 DRIs 規則狀態 (共享給所有工具，預載高精度化驗初始庫)
  const [foods, setFoods] = useState<FoodItem[]>(INITIAL_DEFAULT_FOODS);
  const [drisRules, setDrisRules] = useState(INITIAL_DRIS_RULES);
  const [isCloudDrisLoaded, setIsCloudDrisLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('等待連線中');
  // 雲端同步端點狀態 (預設讀取環境變數，使用者亦可在 UI 即時自訂或覆蓋)
  const [cloudSyncUrl, setCloudSyncUrl] = useState<string>(DEFAULT_GOOGLE_SHEETS_URL);
  const [isCustomUrlInputVisible, setIsCustomUrlInputVisible] = useState(false);

  // 共享跨工具個案設定 (體位、處方型態、DRIs)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    gender: 'female',
    ageGroup: '31-50',
    activity: 'light',
    pregnancy: 'none',
    heightCm: 160,
    weightKg: 55,
    clinicalDietType: 'normal'
  });

  // 核心跨工具飲食記錄籃 (飲食日誌/餐食分析清單)
  const [analysisBasket, setAnalysisBasket] = useState<BasketItem[]>([]);
  const [selectedMealFilter, setSelectedMealFilter] = useState<'all' | MealType>('all');
  const [targetMealToAdd, setTargetMealToAdd] = useState<MealType>('lunch');

  // 彈跳視窗狀態
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isAiReportModalOpen, setIsAiReportModalOpen] = useState(false);
  const [quickToast, setQuickToast] = useState<{ message: string; sub?: string } | null>(null);

  // 食材搜尋頁狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCategories, setSelectedSearchCategories] = useState<Set<string>>(new Set());
  const [activeSortNutrient, setActiveSortNutrient] = useState<string | null>(null);

  // 食材詳細抽屜狀態
  const [selectedDetailFood, setSelectedDetailFood] = useState<FoodItem | null>(null);
  const [detailDim, setDetailDim] = useState<DimensionKey>('gram');
  const [detailPortionVal, setDetailPortionVal] = useState<number>(100);
  const [detailCookingOilName, setDetailCookingOilName] = useState<string>('橄欖油 (高單元不飽和 MUFA)');
  const [detailCookingOilGrams, setDetailCookingOilGrams] = useState<number>(0);
  const [isFullTableOpen, setIsFullTableOpen] = useState(false);

  // 排行榜狀態 (支援翻頁 20 樣/頁與查看全部排行)
  const [rankDim, setRankDim] = useState<DimensionKey>('gram');
  const [rankCustomVal, setRankCustomVal] = useState<number>(100);
  const [selectedRankCategories, setSelectedRankCategories] = useState<Set<string>>(new Set());
  const [rankSortOrder, setRankSortOrder] = useState<'desc' | 'asc'>('desc');
  const [rankMinVal, setRankMinVal] = useState<string>('');
  const [rankMaxVal, setRankMaxVal] = useState<string>('');
  const [currentRankNutrient, setCurrentRankNutrient] = useState<string>('ca');
  const [rankPage, setRankPage] = useState<number>(1);
  const [rankShowAll, setRankShowAll] = useState<boolean>(false);

  // 雙物對比狀態
  const [compSlotA, setCompSlotA] = useState<{ foodId: string; grams: number; conditionDesc: string }>({
    foodId: '',
    grams: 100,
    conditionDesc: '基準：100克'
  });
  const [compSlotB, setCompSlotB] = useState<{ foodId: string; grams: number; conditionDesc: string }>({
    foodId: '',
    grams: 100,
    conditionDesc: '基準：100克'
  });
  const [compMode, setCompMode] = useState<'custom' | '100g'>('custom');
  const [nextCompareSlotToReplace, setNextCompareSlotToReplace] = useState<'A' | 'B'>('A');

  // 動態分類
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    foods.forEach(f => {
      if (f.catName && f.catName.trim()) set.add(f.catName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  }, [foods]);

  // 臨床熱量與處方目標計算
  const clinicalGoals = useMemo(() => {
    return calculateClinicalGoals(
      userProfile.heightCm || 160,
      userProfile.weightKg || 55,
      userProfile.gender,
      userProfile.clinicalDietType || 'normal'
    );
  }, [userProfile]);

  // DRIs 標準計算
  const activeDriStandard = useMemo((): DriRule => {
    const g = userProfile.gender;
    const age = userProfile.ageGroup;
    const base = (drisRules[g] && drisRules[g][age]) ? drisRules[g][age] : drisRules.female["31-50"];
    const preg = (g === 'female') ? (PREGNANCY_ADDONS[userProfile.pregnancy] || PREGNANCY_ADDONS.none) : PREGNANCY_ADDONS.none;

    let targetEer = clinicalGoals.targetKcal;
    let targetPro = clinicalGoals.targetProG;

    return {
      eer: targetEer + (preg.eer || 0),
      pro: targetPro + (preg.pro || 0),
      cho: 130, // DRIs 最低醣質建議基準 (成年人 130g/day)
      fat: Math.round(((targetEer * 0.25) / 9)), // DRIs 脂肪供能比 20-30% 中位基準
      satFatUl: Number(((targetEer * 0.10) / 9).toFixed(1)), // DRIs 飽和脂肪酸上限建議 < 10% 總熱量
      fiber: base.fiber,
      water: Math.round((userProfile.weightKg || 60) * 32), // DRIs 水分目安 (每公斤 30-35mL)
      ca: base.ca + (preg.ca || 0),
      p: clinicalGoals.config.pLimitMg || base.p,
      mg: base.mg,
      k: clinicalGoals.config.kLimitMg || base.k,
      na: clinicalGoals.config.naLimitMg || base.na,
      fe: base.fe + (preg.fe || 0),
      zn: base.zn + (preg.zn || 0),
      cu: base.cu,
      mn: base.mn,
      vitA: base.vitA + (preg.vitA || 0),
      vitD: base.vitD,
      vitE: base.vitE + (preg.vitE || 0),
      vitC: base.vitC + (preg.vitC || 0),
      vitB1: Number((base.vitB1 + (preg.vitB1 || 0)).toFixed(2)),
      vitB2: Number((base.vitB2 + (preg.vitB2 || 0)).toFixed(2)),
      niacin: Number((base.niacin + (preg.niacin || 0)).toFixed(1)),
      vitB6: Number((base.vitB6 + (preg.vitB6 || 0)).toFixed(2)),
      vitB12: Number((base.vitB12 + (preg.vitB12 || 0)).toFixed(2)),
      folate: base.folate + (preg.folate || 0)
    };
  }, [userProfile, drisRules, clinicalGoals]);

  // 雲端資料庫同步
  const fetchCloudDatabase = async () => {
    const targetUrl = cloudSyncUrl.trim();
    if (!targetUrl) {
      setSyncStatus('error');
      setSyncMessage('未設定雲端端點。請設定環境變數 VITE_GOOGLE_SHEETS_WEB_APP_URL 或點擊下方自訂端點。');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('正在向 Google 試算表端點要求純淨資料庫...');
    try {
      const res = await fetch(targetUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error('無法連線至 Google 試算表端點');

      const rawData = await res.json();
      let sheetData: any[] = [];
      let drisData: any[] | null = null;

      if (Array.isArray(rawData)) {
        sheetData = rawData;
      } else if (rawData && typeof rawData === 'object') {
        sheetData = rawData.foods || rawData.data || [];
        drisData = rawData.dris || null;
      }

      if (Array.isArray(sheetData) && sheetData.length > 0) {
        const normalized = sheetData.map((item, idx) => normalizeFoodItem(item, idx));
        setFoods(normalized);

        // 預設對比食材
        setCompSlotA(prev => (!prev.foodId || !normalized.some(f => f.id === prev.foodId)) ? { foodId: normalized[0].id, grams: 100, conditionDesc: '基準：100克' } : prev);
        setCompSlotB(prev => (!prev.foodId || !normalized.some(f => f.id === prev.foodId)) ? { foodId: normalized[1] ? normalized[1].id : normalized[0].id, grams: 100, conditionDesc: '基準：100克' } : prev);

        // 套用雲端 DRIs
        if (drisData && Array.isArray(drisData) && drisData.length > 0) {
          const newRules: Record<'female' | 'male', Record<string, DriRule>> = { female: {}, male: {} };
          let appliedCount = 0;
          drisData.forEach(row => {
            const rawG = String(row.gender || row["性別"] || "").toLowerCase().trim();
            const g = (rawG === "female" || rawG === "女性" || rawG === "女") ? "female" : "male";
            const age = String(row.ageGroup || row["年齡層"] || row["年齡組"] || row["年齡"] || "").trim();
            if (age) {
              newRules[g][age] = {
                eer: parseNumericField(row.eer ?? row["熱量"] ?? row["EER"]),
                pro: parseNumericField(row.pro ?? row["蛋白質"] ?? row["粗蛋白"]),
                fiber: parseNumericField(row.fiber ?? row["膳食纖維"]),
                ca: parseNumericField(row.ca ?? row["鈣"]),
                p: parseNumericField(row.p ?? row["磷"] ?? 800),
                mg: parseNumericField(row.mg ?? row["鎂"]),
                k: parseNumericField(row.k ?? row["鉀"]),
                na: parseNumericField(row.na ?? row["鈉"] ?? 2300),
                fe: parseNumericField(row.fe ?? row["鐵"]),
                zn: parseNumericField(row.zn ?? row["鋅"]),
                cu: parseNumericField(row.cu ?? row["銅"] ?? 0.85),
                mn: parseNumericField(row.mn ?? row["錳"] ?? 2.0),
                vitA: parseNumericField(row.vitA ?? row["維生素A"]),
                vitD: parseNumericField(row.vitD ?? row["維生素D"]),
                vitE: parseNumericField(row.vitE ?? row["維生素E"] ?? 12),
                vitC: parseNumericField(row.vitC ?? row["維生素C"]),
                vitB1: parseNumericField(row.vitB1 ?? row["維生素B1"] ?? 1.0),
                vitB2: parseNumericField(row.vitB2 ?? row["維生素B2"] ?? 1.1),
                niacin: parseNumericField(row.niacin ?? row["菸鹼素"] ?? 14),
                vitB6: parseNumericField(row.vitB6 ?? row["維生素B6"] ?? 1.5),
                vitB12: parseNumericField(row.vitB12 ?? row["維生素B12"] ?? 2.4),
                folate: parseNumericField(row.folate ?? row["葉酸"])
              };
              appliedCount++;
            }
          });
          if (appliedCount > 0) {
            setDrisRules(prev => ({
              female: { ...prev.female, ...newRules.female },
              male: { ...prev.male, ...newRules.male }
            }));
            setIsCloudDrisLoaded(true);
          }
        }

        setSyncStatus('success');
        setSyncMessage(`已成功載入試算表 ${normalized.length} 筆食材`);
        return;
      }
      throw new Error('試算表無資料');
    } catch (err: any) {
      console.warn('Sync failed:', err);
      setSyncStatus('error');
      setSyncMessage('資料庫連線失敗，請檢查網路連線或端點權限。');
    }
  };

  useEffect(() => {
    fetchCloudDatabase();
  }, []);

  // 篩選食材 (食材寶典速查)
  const filteredSearchFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isAll = selectedSearchCategories.size === 0 || selectedSearchCategories.size === dynamicCategories.length;

    let list = foods.filter(item => {
      const matchCat = isAll || selectedSearchCategories.has(item.catName);
      const matchQ = !q || 
        item.name.toLowerCase().includes(q) || 
        item.catName.toLowerCase().includes(q) || 
        (item.note && item.note.toLowerCase().includes(q));
      return matchCat && matchQ;
    });

    if (activeSortNutrient) {
      list = [...list].sort((a, b) => {
        if (activeSortNutrient === 'lowKcal') return a.kcal - b.kcal;
        if (activeSortNutrient === 'lowNa') return a.na - b.na;
        const key = activeSortNutrient as keyof FoodItem;
        return (Number(b[key]) || 0) - (Number(a[key]) || 0);
      });
    }

    return list;
  }, [foods, searchQuery, selectedSearchCategories, dynamicCategories, activeSortNutrient]);

  // 排行榜項目計算 (全量排行)
  const allRankedItems = useMemo(() => {
    if (foods.length === 0) return [];
    const conf = RANK_DIM_CONFIG[rankDim] || RANK_DIM_CONFIG.gram;
    const targetNutrient = currentRankNutrient;
    const customVal = Math.max(0.1, rankCustomVal || conf.defaultVal);
    const meta = NUTRIENT_META_MAP[targetNutrient] || NUTRIENT_META_MAP.ca;
    const nutrientKey = meta.key;
    const decimals = meta.dec !== undefined ? meta.dec : 1;

    const hasMin = rankMinVal !== '' && !isNaN(parseFloat(rankMinVal));
    const hasMax = rankMaxVal !== '' && !isNaN(parseFloat(rankMaxVal));
    const minVal = hasMin ? parseFloat(rankMinVal) : null;
    const maxVal = hasMax ? parseFloat(rankMaxVal) : null;

    const isAll = selectedRankCategories.size === 0 || selectedRankCategories.size === dynamicCategories.length;
    const targetFoods = foods.filter(f => isAll || selectedRankCategories.has(f.catName));

    const result: Array<{ food: FoodItem; gramsRequired: number; calculatedVal: number }> = [];

    targetFoods.forEach(f => {
      let gramsRequired = 100;
      let isEligible = true;

      if (rankDim === 'gram') {
        gramsRequired = customVal;
      } else if (rankDim === 'kcal') {
        if (!f.kcal || f.kcal <= 0) isEligible = false;
        else gramsRequired = (customVal / f.kcal) * 100;
      } else if (rankDim === 'pro') {
        if (!f.pro || f.pro < 0.1) isEligible = false;
        else gramsRequired = (customVal / f.pro) * 100;
      } else if (rankDim === 'cho') {
        if (!f.cho || f.cho < 0.1) isEligible = false;
        else gramsRequired = (customVal / f.cho) * 100;
      } else if (rankDim === 'fat') {
        if (!f.fat || f.fat < 0.1) isEligible = false;
        else gramsRequired = (customVal / f.fat) * 100;
      }

      if (isEligible) {
        const raw100 = (f[nutrientKey] as number) !== undefined ? (f[nutrientKey] as number) : 0;
        const calc = raw100 * (gramsRequired / 100);

        if (minVal !== null && calc < minVal) isEligible = false;
        if (maxVal !== null && calc > maxVal) isEligible = false;

        if (isEligible) {
          result.push({
            food: f,
            gramsRequired: Math.round(gramsRequired),
            calculatedVal: Number(calc.toFixed(decimals))
          });
        }
      }
    });

    result.sort((a, b) => {
      return rankSortOrder === 'asc' ? a.calculatedVal - b.calculatedVal : b.calculatedVal - a.calculatedVal;
    });

    return result;
  }, [foods, rankDim, rankCustomVal, currentRankNutrient, rankMinVal, rankMaxVal, selectedRankCategories, dynamicCategories, rankSortOrder]);

  // 排行分頁資訊
  const rankPageSize = 20;
  const rankTotalPages = Math.max(1, Math.ceil(allRankedItems.length / rankPageSize));
  
  // 當前頁呈現的食材項目
  const displayRankedItems = useMemo(() => {
    if (rankShowAll) {
      return allRankedItems;
    }
    const startIndex = (rankPage - 1) * rankPageSize;
    return allRankedItems.slice(startIndex, startIndex + rankPageSize);
  }, [allRankedItems, rankPage, rankShowAll, rankPageSize]);

  // 食材詳情換算克數
  const detailCalculatedGrams = useMemo(() => {
    if (!selectedDetailFood) return 100;
    const f = selectedDetailFood;
    const val = Math.max(0.1, detailPortionVal || 100);
    if (detailDim === 'gram') return val;
    if (detailDim === 'kcal') return f.kcal > 0 ? (val / f.kcal) * 100 : 100;
    if (detailDim === 'pro') return f.pro > 0 ? (val / f.pro) * 100 : 100;
    if (detailDim === 'cho') return f.cho > 0 ? (val / f.cho) * 100 : 100;
    if (detailDim === 'fat') return f.fat > 0 ? (val / f.fat) * 100 : 100;
    return 100;
  }, [selectedDetailFood, detailDim, detailPortionVal]);

  // 食材詳情之國健署六大類份數
  const detailSixFoodPortions = useMemo(() => {
    if (!selectedDetailFood) return null;
    return estimateSixFoodPortions(selectedDetailFood, detailCalculatedGrams);
  }, [selectedDetailFood, detailCalculatedGrams]);

  // 食材詳情之營養平替推薦
  const detailSimilarFoods = useMemo(() => {
    if (!selectedDetailFood) return [];
    const base = selectedDetailFood;
    const candidates = foods.filter(item => item.id !== base.id);

    const scored = candidates.map(item => {
      const dPro = Math.pow((item.pro - base.pro) / 15, 2);
      const dFat = Math.pow((item.fat - base.fat) / 10, 2);
      const dCho = Math.pow((item.cho - base.cho) / 25, 2);
      const dFiber = Math.pow((item.fiber - base.fiber) / 5, 2);
      const dKcal = Math.pow((item.kcal - base.kcal) / 100, 2);
      const dist = Math.sqrt(dPro + dFat + dCho + dFiber + dKcal);
      const similarity = Math.max(10, Math.round(100 - dist * 16));
      return { food: item, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, 4);
  }, [selectedDetailFood, foods]);

  // 開啟食材抽屜
  const handleOpenDetail = (food: FoodItem, grams: number = 100) => {
    setSelectedDetailFood(food);
    setDetailDim('gram');
    setDetailPortionVal(grams);
    setIsFullTableOpen(false);
    setDetailCookingOilGrams(0);
    setDetailCookingOilName('橄欖油 (高單元不飽和 MUFA)');
  };

  // 將選定食材加入「飲食分析與處方評估系統」
  const handleAddDetailToBasket = (directToAnalyzer = false) => {
    if (!selectedDetailFood) return;
    const grams = Math.round(detailCalculatedGrams);
    const conf = RANK_DIM_CONFIG[detailDim];
    const baseNote = detailDim === 'gram' ? `${grams}g` : `依目標 ${detailPortionVal}${conf.unit}${conf.descName}逆推`;
    const oilNote = detailCookingOilGrams > 0 
      ? ` · 烹調油: ${detailCookingOilName.split(' ')[0]} ${detailCookingOilGrams}g` 
      : '';

    const newItem: BasketItem = {
      id: `${selectedDetailFood.id}_${Date.now()}`,
      food: selectedDetailFood,
      portionGrams: grams,
      mealType: targetMealToAdd,
      date: new Date().toISOString().slice(0, 10),
      note: `${baseNote}${oilNote}`,
      cookingOilName: detailCookingOilGrams > 0 ? detailCookingOilName : '無用油 / 不額外加油',
      cookingOilGrams: detailCookingOilGrams > 0 ? detailCookingOilGrams : 0
    };

    setAnalysisBasket(prev => [...prev, newItem]);
    setSelectedDetailFood(null);

    // 觸發短暫 Toast 提示
    const mealLabel = targetMealToAdd === 'breakfast' ? '早餐' : targetMealToAdd === 'lunch' ? '午餐' : targetMealToAdd === 'dinner' ? '晚餐' : '點心';
    setQuickToast({
      message: `已將「${selectedDetailFood.name} (${grams}g)」加入${mealLabel}`,
      sub: `飲食評估記錄現有 ${analysisBasket.length + 1} 項食材`
    });
    setTimeout(() => setQuickToast(null), 3000);

    if (directToAnalyzer) {
      setActiveTool('analyzer');
      setAnalyzerSubTab('assessment');
    }
  };

  // 將食材放入 PK 對比
  const handleAddDetailToCompare = () => {
    if (!selectedDetailFood) return;
    const grams = Math.round(detailCalculatedGrams);
    const conf = RANK_DIM_CONFIG[detailDim];
    const desc = detailDim === 'gram' ? `基準：${grams}g` : `依 ${detailPortionVal}${conf.unit}${conf.descName} (${grams}g)`;

    if (nextCompareSlotToReplace === 'A') {
      setCompSlotA({ foodId: selectedDetailFood.id, grams, conditionDesc: desc });
      setNextCompareSlotToReplace('B');
    } else {
      setCompSlotB({ foodId: selectedDetailFood.id, grams, conditionDesc: desc });
      setNextCompareSlotToReplace('A');
    }

    setSelectedDetailFood(null);
    setActiveTool('atlas');
    setAtlasSubTab('compare');
  };

  // 個案標籤文字
  const profileLabel = useMemo(() => {
    const gText = userProfile.gender === 'female' ? '女' : '男';
    const dietName = CLINICAL_DIET_PRESETS[userProfile.clinicalDietType || 'normal'].badge;
    return `${dietName} · ${gText} ${userProfile.ageGroup}歲 (IBW ${clinicalGoals.ibw}kg)`;
  }, [userProfile, clinicalGoals]);

  // 飲食記錄統計與六大類整合 (支援餐別篩選)
  const filteredBasketItems = useMemo(() => {
    if (selectedMealFilter === 'all') return analysisBasket;
    return analysisBasket.filter(b => b.mealType === selectedMealFilter);
  }, [analysisBasket, selectedMealFilter]);

  // 核心統計函式：計算給定餐食清單之總量、宏量比率與六大類代換
  const calculateAnalysis = (items: BasketItem[]) => {
    const totals: Record<string, number> = {
      kcal: 0, pro: 0, fat: 0, cho: 0, fiber: 0, sugar: 0, water: 0, ash: 0,
      satFat: 0, mufa: 0, pufa: 0, chol: 0,
      na: 0, k: 0, ca: 0, mg: 0, p: 0, fe: 0, zn: 0, cu: 0, mn: 0,
      vitA: 0, alphaCaro: 0, betaCaro: 0, vitD: 0, vitE: 0,
      vitB1: 0, vitB2: 0, niacin: 0, vitB6: 0, vitB12: 0, vitC: 0, folate: 0
    };

    const aggregatedSixGroups = {
      cereals: 0,
      proteins: 0,
      dairy: 0,
      vegetables: 0,
      fruits: 0,
      oils: 0
    };

    items.forEach(b => {
      const f = b.food;
      const ratio = (b.portionGrams || 100) / 100;
      Object.keys(totals).forEach(k => {
        const rawVal = f[k as keyof FoodItem];
        const val = typeof rawVal === 'number' ? rawVal : parseNumericField(rawVal);
        totals[k] += val * ratio;
      });

      // 累加烹調用油 (Cooking Oil) 之熱量、脂肪、脂肪酸與維生素 E
      const oilGrams = Math.max(0, Number(b.cookingOilGrams) || 0);
      if (oilGrams > 0) {
        const oilProfile = getCookingOilProfile(b.cookingOilName);
        if (oilProfile.kcal > 0) {
          const oilRatio = oilGrams / 100;
          totals.kcal += oilProfile.kcal * oilRatio;
          totals.fat += oilProfile.fat * oilRatio;
          totals.satFat += oilProfile.satFat * oilRatio;
          totals.mufa += oilProfile.mufa * oilRatio;
          totals.pufa += oilProfile.pufa * oilRatio;
          totals.vitE += oilProfile.vitE * oilRatio;
        }
      }

      const pGroup = estimateSixFoodPortions(f, b.portionGrams || 100);
      aggregatedSixGroups.cereals += pGroup.cereals;
      aggregatedSixGroups.proteins += pGroup.proteins;
      aggregatedSixGroups.dairy += pGroup.dairy;
      aggregatedSixGroups.vegetables += pGroup.vegetables;
      aggregatedSixGroups.fruits += pGroup.fruits;
      aggregatedSixGroups.oils += pGroup.oils + (oilGrams / 5);
    });

    const proKcal = totals.pro * 4;
    const fatKcal = totals.fat * 9;
    const choKcal = totals.cho * 4;
    const sumMacroKcal = proKcal + fatKcal + choKcal || 1;
    const carbExchanges = Math.round((totals.cho / 15) * 10) / 10;

    return {
      totals,
      proPct: Math.round((proKcal / sumMacroKcal) * 100),
      fatPct: Math.round((fatKcal / sumMacroKcal) * 100),
      choPct: Math.round((choKcal / sumMacroKcal) * 100),
      carbExchanges,
      sixGroups: {
        cereals: Math.round(aggregatedSixGroups.cereals * 10) / 10,
        proteins: Math.round(aggregatedSixGroups.proteins * 10) / 10,
        dairy: Math.round(aggregatedSixGroups.dairy * 10) / 10,
        vegetables: Math.round(aggregatedSixGroups.vegetables * 10) / 10,
        fruits: Math.round(aggregatedSixGroups.fruits * 10) / 10,
        oils: Math.round(aggregatedSixGroups.oils * 10) / 10
      }
    };
  };

  const basketAnalysis = useMemo(() => calculateAnalysis(filteredBasketItems), [filteredBasketItems]);
  const wholeDayAnalysis = useMemo(() => calculateAnalysis(analysisBasket), [analysisBasket]);

  // 對比食材
  const foodA = useMemo(() => foods.find(f => f.id === compSlotA.foodId) || foods[0], [foods, compSlotA.foodId]);
  const foodB = useMemo(() => foods.find(f => f.id === compSlotB.foodId) || foods[1] || foods[0], [foods, compSlotB.foodId]);

  // 匯出資料庫 CSV
  const handleExportCsv = () => {
    if (foods.length === 0) return;
    const metaHeaderRows = [
      ["【台灣食材營養成分資料庫 (TFDA 專業臨床版)】"],
      ["版權宣告所有人", "richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"],
      ["資料來源", "台灣衛生福利部食品藥物管理署 (TFDA) 食品營養成分資料庫"],
      ["匯出時間", `${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}`],
      ["食材項目總數", `${foods.length} 項`],
      []
    ];

    const headers = [
      "ID", "食材名稱", "分類", "熱量(kcal)", "水分(g)", "粗蛋白(g)", "粗脂肪(g)",
      "飽和脂肪(g)", "單元不飽和(g)", "多元不飽和(g)", "膽固醇(mg)", "碳水化合物(g)",
      "膳食纖維(g)", "糖質總量(g)", "灰分(g)", "鈉(mg)", "鉀(mg)", "鈣(mg)", "鎂(mg)",
      "磷(mg)", "鐵(mg)", "鋅(mg)", "維生素A(ug)", "維生素C(mg)", "葉酸(mcg)"
    ];

    const rows = foods.map(f => [
      f.id, `"${f.name}"`, `"${f.catName}"`, f.kcal, f.water, f.pro, f.fat,
      f.satFat, f.mufa, f.pufa, f.chol, f.cho,
      f.fiber, f.sugar, f.ash, f.na, f.k, f.ca, f.mg,
      f.p, f.fe, f.zn, f.vitA, f.vitC, f.folate
    ]);

    const csvContent = "\uFEFF" + [
      ...metaHeaderRows.map(r => r.join(",")),
      headers.join(","),
      ...rows.map(e => e.join(",")),
      [],
      ["* 版權宣告所有人：richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"]
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "台灣食材營養成分資料庫_TFDA_專業臨床版.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 匯出營養排行榜 CSV (包含全部 33 種營養素，相容 Excel，UTF-8 BOM)
  const handleExportRankingCsv = () => {
    if (allRankedItems.length === 0) {
      setQuickToast({ message: '目前條件下無可匯出的排行榜食材', sub: '請嘗試放寬分類或數值範圍' });
      return;
    }

    const conf = RANK_DIM_CONFIG[rankDim] || RANK_DIM_CONFIG.gram;
    const meta = NUTRIENT_META_MAP[currentRankNutrient] || NUTRIENT_META_MAP.ca;
    const basisDesc = rankDim === 'gram'
      ? `每 ${rankCustomVal}g 可食部`
      : `提供 ${rankCustomVal} ${conf.unit} ${conf.descName}所需食用量`;

    const metaHeaderRows = [
      ["【台灣食材營養排行榜 (全33項微量與巨量營養素)】"],
      ["版權宣告所有人", "richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"],
      ["評估指標", `${meta.name} (${meta.unit})`],
      ["換算基準", basisDesc],
      ["匯出食材總數", `${allRankedItems.length} 項`],
      ["資料來源", "台灣衛生福利部食品藥物管理署 (TFDA) 食品營養成分資料庫"],
      ["匯出時間", `${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}`],
      []
    ];

    const headers = [
      "名次",
      "食材代碼",
      "食材名稱",
      "食材分類",
      "計算基準",
      "折算食用重量(g)",
      `排行指標: ${meta.name} (${meta.unit})`,
      "熱量(kcal)",
      "水分(g)",
      "粗蛋白質(g)",
      "粗脂肪(g)",
      "飽和脂肪(g)",
      "單元不飽和(g)",
      "多元不飽和(g)",
      "膽固醇(mg)",
      "總碳水化合物(g)",
      "膳食纖維(g)",
      "糖質總量(g)",
      "灰分(g)",
      "鈉(mg)",
      "鉀(mg)",
      "鈣(mg)",
      "鎂(mg)",
      "磷(mg)",
      "鐵(mg)",
      "鋅(mg)",
      "銅(mg)",
      "錳(mg)",
      "維生素A(ug RAE)",
      "α-胡蘿蔔素(ug)",
      "β-胡蘿蔔素(ug)",
      "維生素D(ug)",
      "維生素E(mg)",
      "維生素C(mg)",
      "維生素B1(mg)",
      "維生素B2(mg)",
      "菸鹼素(mg NE)",
      "維生素B6(mg)",
      "維生素B12(ug)",
      "葉酸(mcg)"
    ];

    const rows = allRankedItems.map((item, idx) => {
      const f = item.food;
      const ratio = item.gramsRequired / 100;
      return [
        idx + 1,
        f.id,
        `"${f.name.replace(/"/g, '""')}"`,
        `"${(f.catName || '').replace(/"/g, '""')}"`,
        `"${basisDesc}"`,
        item.gramsRequired,
        item.calculatedVal,
        Number((f.kcal * ratio).toFixed(1)),
        Number((f.water * ratio).toFixed(1)),
        Number((f.pro * ratio).toFixed(1)),
        Number((f.fat * ratio).toFixed(1)),
        Number((f.satFat * ratio).toFixed(1)),
        Number((f.mufa * ratio).toFixed(1)),
        Number((f.pufa * ratio).toFixed(1)),
        Math.round(f.chol * ratio),
        Number((f.cho * ratio).toFixed(1)),
        Number((f.fiber * ratio).toFixed(1)),
        Number((f.sugar * ratio).toFixed(1)),
        Number((f.ash * ratio).toFixed(1)),
        Math.round(f.na * ratio),
        Math.round(f.k * ratio),
        Math.round(f.ca * ratio),
        Math.round(f.mg * ratio),
        Math.round(f.p * ratio),
        Number((f.fe * ratio).toFixed(2)),
        Number((f.zn * ratio).toFixed(2)),
        Number((f.cu * ratio).toFixed(2)),
        Number((f.mn * ratio).toFixed(2)),
        Math.round(f.vitA * ratio),
        Math.round(f.alphaCaro * ratio),
        Math.round(f.betaCaro * ratio),
        Number((f.vitD * ratio).toFixed(2)),
        Number((f.vitE * ratio).toFixed(2)),
        Number((f.vitC * ratio).toFixed(1)),
        Number((f.vitB1 * ratio).toFixed(2)),
        Number((f.vitB2 * ratio).toFixed(2)),
        Number((f.niacin * ratio).toFixed(2)),
        Number((f.vitB6 * ratio).toFixed(2)),
        Number((f.vitB12 * ratio).toFixed(2)),
        Math.round(f.folate * ratio)
      ];
    });

    const csvContent = "\uFEFF" + [
      ...metaHeaderRows.map(r => r.join(",")),
      headers.join(","),
      ...rows.map(e => e.join(",")),
      [],
      ["* 本排行榜由營養師專業臨床工具包生成 · 版權宣告所有人：richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"]
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeNutrientName = meta.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    link.download = `台灣食材營養排行_${safeNutrientName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickToast({
      message: `已成功匯出 ${allRankedItems.length} 項食材營養排行榜 (CSV)`,
      sub: `${meta.name} · ${basisDesc}`
    });
  };

  // 匯出營養排行榜 HTML 獨立視覺化檔案
  const handleExportRankingHtml = () => {
    if (allRankedItems.length === 0) {
      setQuickToast({ message: '目前條件下無可匯出的排行榜食材', sub: '請嘗試放寬分類或數值範圍' });
      return;
    }

    const conf = RANK_DIM_CONFIG[rankDim] || RANK_DIM_CONFIG.gram;
    const meta = NUTRIENT_META_MAP[currentRankNutrient] || NUTRIENT_META_MAP.ca;
    const basisDesc = rankDim === 'gram'
      ? `每 ${rankCustomVal}g 可食部`
      : `提供 ${rankCustomVal} ${conf.unit} ${conf.descName}所需食用量`;

    const rowsHtml = allRankedItems.map((item, idx) => {
      const f = item.food;
      const ratio = item.gramsRequired / 100;
      const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : 'background: #fff;'}">
          <td style="padding: 10px 8px; text-align: center; font-weight: bold; font-size: 0.95rem;">${rankBadge}</td>
          <td style="padding: 10px 8px; font-weight: bold; color: #0f172a;">${f.name}</td>
          <td style="padding: 10px 8px; color: #047857;"><span style="background: #ecfdf5; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${f.catName}</span></td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 900; color: #b45309; font-size: 1rem;">${item.calculatedVal} <span style="font-size: 0.75rem; color: #64748b;">${meta.unit}</span></td>
          <td style="padding: 10px 8px; text-align: right; color: #475569;">${item.gramsRequired}g</td>
          <td style="padding: 10px 8px; text-align: right;">${Math.round(f.kcal * ratio)}</td>
          <td style="padding: 10px 8px; text-align: right;">${(f.pro * ratio).toFixed(1)}</td>
          <td style="padding: 10px 8px; text-align: right;">${(f.fat * ratio).toFixed(1)}</td>
          <td style="padding: 10px 8px; text-align: right;">${(f.cho * ratio).toFixed(1)}</td>
          <td style="padding: 10px 8px; text-align: right;">${(f.fiber * ratio).toFixed(1)}</td>
          <td style="padding: 10px 8px; text-align: right;">${Math.round(f.na * ratio)}</td>
          <td style="padding: 10px 8px; text-align: right;">${Math.round(f.k * ratio)}</td>
          <td style="padding: 10px 8px; text-align: right;">${Math.round(f.ca * ratio)}</td>
          <td style="padding: 10px 8px; text-align: right;">${(f.fe * ratio).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>台灣食材營養排行榜 - ${meta.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 1.8rem; margin-bottom: 0.25rem; text-align: center; color: #0f172a; }
    .subtitle { text-align: center; color: #64748b; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .summary-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-size: 0.85rem; }
    th { background: #0f172a; color: #f8fafc; padding: 12px 8px; font-weight: bold; text-align: right; }
    th:first-child, th:nth-child(2), th:nth-child(3) { text-align: left; }
    th:first-child { text-align: center; width: 60px; }
    .print-btn { display: inline-block; background: #b45309; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; text-decoration: none; }
    @media print {
      body { background: #fff; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div style="text-align: right; margin-bottom: 1rem;">
    <button class="print-btn" onclick="window.print()">🖨️ 列印或存為 PDF</button>
  </div>
  <h1>🏆 台灣食材營養排行榜</h1>
  <div class="subtitle">評估指標：${meta.name} (${meta.unit}) · 換算基準：${basisDesc} · 共 ${allRankedItems.length} 項食材</div>
  
  <div class="summary-card">
    <div>
      <div><b>資料來源：</b>台灣衛生福利部食品藥物管理署 (TFDA) 食品營養成分資料庫</div>
      <div style="margin-top: 4px; color: #047857; font-weight: bold; font-size: 0.9rem;">
        版權宣告所有人：richardmimic / 營養吳理
      </div>
    </div>
    <div style="color: #64748b; font-size: 0.85rem; text-align: right;">
      <div>匯出日期：${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}</div>
      <div style="font-size: 0.75rem; color: #94a3b8;">© 2026 richardmimic / 營養吳理</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>名次</th>
        <th>食材名稱</th>
        <th>分類</th>
        <th>${meta.name}</th>
        <th>折算重</th>
        <th>熱量(k)</th>
        <th>蛋白質(g)</th>
        <th>脂肪(g)</th>
        <th>碳水(g)</th>
        <th>纖維(g)</th>
        <th>鈉(mg)</th>
        <th>鉀(mg)</th>
        <th>鈣(mg)</th>
        <th>鐵(mg)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <footer style="text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #64748b; line-height: 1.6;">
    本排行榜由 營養師專業臨床工具包 (Dietitian Pro Suite) 離線高精度運算生成<br/>
    <b>版權宣告所有人：richardmimic / 營養吳理</b> (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeNutrientName = meta.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    link.download = `台灣食材營養排行_${safeNutrientName}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickToast({
      message: `已成功匯出排行榜 HTML 離線檔案`,
      sub: `${meta.name} · 共 ${allRankedItems.length} 項食材`
    });
  };

  // 匯出臨床飲食評估與 DRIs 分析 CSV (包含全部 33 種營養素，相容 Excel，UTF-8 BOM)
  const handleExportAssessmentCsv = () => {
    if (analysisBasket.length === 0) {
      setQuickToast({ message: '目前飲食記錄為空，無法匯出', sub: '請先由食材寶典或菜單加入食材' });
      return;
    }

    const t = wholeDayAnalysis.totals;
    const six = wholeDayAnalysis.sixGroups;

    // 區段 1：個案基本資料與臨床處方設定
    const metaRows = [
      ["【臨床飲食評估與DRIs全營養素分析報表】"],
      ["版權宣告所有人", "richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)"],
      ["評估系統", "營養師專業臨床工具包 (Dietitian Pro Suite)"],
      ["評估時間", `${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}`],
      ["個案體位", `${userProfile.gender === 'female' ? '女性' : '男性'} / ${userProfile.ageGroup}歲 / 身高 ${userProfile.heightCm}cm / 體重 ${userProfile.weightKg}kg`],
      ["體位指標", `BMI: ${clinicalGoals.bmi} / 理想體重 (IBW): ${clinicalGoals.ibw} kg`],
      ["臨床處方", `${clinicalGoals.config.name} (${clinicalGoals.config.badge})`],
      ["處方建議目標", `熱量: ${clinicalGoals.targetKcal} kcal / 蛋白質: ${clinicalGoals.targetProG} g / 鈉上限: ${clinicalGoals.config.naLimitMg} mg`],
      []
    ];

    // 區段 2：飲食記錄明細 (食材 + 烹調用油，完整全部 33 種營養素)
    const foodHeaders = [
      "項次", "餐別", "食材名稱", "食材分類", "食用克數(g)", "烹調用油品項", "用油量(g)",
      "熱量(kcal)", "水分(g)", "粗蛋白(g)", "粗脂肪(g)", "飽和脂肪(g)", "單元不飽和(g)", "多元不飽和(g)", "膽固醇(mg)",
      "總碳水(g)", "膳食纖維(g)", "糖質(g)", "灰分(g)", "鈉(mg)", "鉀(mg)", "鈣(mg)", "鎂(mg)", "磷(mg)",
      "鐵(mg)", "鋅(mg)", "銅(mg)", "錳(mg)", "維生素A(ug)", "α-胡蘿蔔素(ug)", "β-胡蘿蔔素(ug)",
      "維生素D(ug)", "維生素E(mg)", "維生素C(mg)", "維生素B1(mg)", "維生素B2(mg)", "菸鹼素(mg)", "維生素B6(mg)", "維生素B12(ug)", "葉酸(mcg)"
    ];

    const foodRows = analysisBasket.map((b, idx) => {
      const f = b.food;
      const ratio = (b.portionGrams || 100) / 100;
      const oilG = Math.max(0, Number(b.cookingOilGrams) || 0);
      const oilProfile = oilG > 0 ? getCookingOilProfile(b.cookingOilName) : null;
      const oilKcal = oilProfile ? oilProfile.kcal * (oilG / 100) : 0;
      const oilFat = oilProfile ? oilProfile.fat * (oilG / 100) : 0;
      const oilSat = oilProfile ? oilProfile.satFat * (oilG / 100) : 0;
      const oilMufa = oilProfile ? oilProfile.mufa * (oilG / 100) : 0;
      const oilPufa = oilProfile ? oilProfile.pufa * (oilG / 100) : 0;
      const oilVitE = oilProfile ? oilProfile.vitE * (oilG / 100) : 0;

      const mealLabel = b.mealType === 'breakfast' ? '早餐' : b.mealType === 'lunch' ? '午餐' : b.mealType === 'dinner' ? '晚餐' : '點心';

      return [
        idx + 1,
        mealLabel,
        `"${f.name.replace(/"/g, '""')}"`,
        `"${(f.catName || '').replace(/"/g, '""')}"`,
        b.portionGrams,
        oilG > 0 ? `"${(b.cookingOilName || '食用植物油').replace(/"/g, '""')}"` : '無用油',
        oilG,
        Number((f.kcal * ratio + oilKcal).toFixed(1)),
        Number((f.water * ratio).toFixed(1)),
        Number((f.pro * ratio).toFixed(1)),
        Number((f.fat * ratio + oilFat).toFixed(1)),
        Number((f.satFat * ratio + oilSat).toFixed(1)),
        Number((f.mufa * ratio + oilMufa).toFixed(1)),
        Number((f.pufa * ratio + oilPufa).toFixed(1)),
        Math.round(f.chol * ratio),
        Number((f.cho * ratio).toFixed(1)),
        Number((f.fiber * ratio).toFixed(1)),
        Number((f.sugar * ratio).toFixed(1)),
        Number((f.ash * ratio).toFixed(1)),
        Math.round(f.na * ratio),
        Math.round(f.k * ratio),
        Math.round(f.ca * ratio),
        Math.round(f.mg * ratio),
        Math.round(f.p * ratio),
        Number((f.fe * ratio).toFixed(2)),
        Number((f.zn * ratio).toFixed(2)),
        Number((f.cu * ratio).toFixed(2)),
        Number((f.mn * ratio).toFixed(2)),
        Math.round(f.vitA * ratio),
        Math.round(f.alphaCaro * ratio),
        Math.round(f.betaCaro * ratio),
        Number((f.vitD * ratio).toFixed(2)),
        Number((f.vitE * ratio + oilVitE).toFixed(2)),
        Number((f.vitC * ratio).toFixed(1)),
        Number((f.vitB1 * ratio).toFixed(2)),
        Number((f.vitB2 * ratio).toFixed(2)),
        Number((f.niacin * ratio).toFixed(2)),
        Number((f.vitB6 * ratio).toFixed(2)),
        Number((f.vitB12 * ratio).toFixed(2)),
        Math.round(f.folate * ratio)
      ];
    });

    // 區段 3：全日攝取總計與三大營養素分佈
    const summaryRows = [
      [],
      ["【全日實際攝取總計】", "", "", "", "", "", "",
        Math.round(t.kcal), t.water.toFixed(1), t.pro.toFixed(1), t.fat.toFixed(1),
        t.satFat.toFixed(1), t.mufa.toFixed(1), t.pufa.toFixed(1), Math.round(t.chol),
        t.cho.toFixed(1), t.fiber.toFixed(1), t.sugar.toFixed(1), t.ash.toFixed(1),
        Math.round(t.na), Math.round(t.k), Math.round(t.ca), Math.round(t.mg), Math.round(t.p),
        t.fe.toFixed(2), t.zn.toFixed(2), t.cu.toFixed(2), t.mn.toFixed(2),
        Math.round(t.vitA), Math.round(t.alphaCaro), Math.round(t.betaCaro),
        t.vitD.toFixed(2), t.vitE.toFixed(2), t.vitC.toFixed(1),
        t.vitB1.toFixed(2), t.vitB2.toFixed(2), t.niacin.toFixed(2),
        t.vitB6.toFixed(2), t.vitB12.toFixed(2), Math.round(t.folate)
      ],
      [],
      ["【三大營養素熱量分佈與醣類代換】"],
      ["總熱量達成率", `${Math.round((t.kcal / clinicalGoals.targetKcal) * 100)}% (目標 ${clinicalGoals.targetKcal} kcal)`],
      ["蛋白質熱量佔比", `${wholeDayAnalysis.proPct}% (${Math.round(t.pro)}g)`],
      ["脂肪熱量佔比", `${wholeDayAnalysis.fatPct}% (${Math.round(t.fat)}g)`],
      ["碳水化合物熱量佔比", `${wholeDayAnalysis.choPct}% (${Math.round(t.cho)}g)`],
      ["醣類代換份數", `約 ${wholeDayAnalysis.carbExchanges} 份醣 (1份=15g碳水)`],
      [],
      ["【國健署六大類食物代換份數估算】"],
      ["全穀雜糧類", `${six.cereals} 份`],
      ["豆魚蛋肉類", `${six.proteins} 份`],
      ["乳品類", `${six.dairy} 份`],
      ["蔬菜類", `${six.vegetables} 份`],
      ["水果類", `${six.fruits} 份`],
      ["油脂與堅果種子類", `${six.oils} 份 (含烹調用油代換)`],
      [],
      ["【衛福部 DRIs 第 8 版全項營養素對照分析表】"],
      ["營養素項目", "分類", "建議標準目標", "實際攝取總量", "單位", "目標達成率(%)", "臨床狀態評估"]
    ];

    // DRIs 細項 Rows
    const driItems = [
      { name: '總熱量 (EER)', cat: '熱量與能量', target: activeDriStandard.eer, actual: t.kcal, unit: 'kcal', dec: 0 },
      { name: '粗蛋白質', cat: '巨量營養素', target: activeDriStandard.pro, actual: t.pro, unit: 'g', dec: 1 },
      { name: '總碳水化合物', cat: '巨量營養素', target: activeDriStandard.cho, actual: t.cho, unit: 'g', dec: 1 },
      { name: '粗脂肪', cat: '巨量營養素', target: activeDriStandard.fat, actual: t.fat, unit: 'g', dec: 1 },
      { name: '飽和脂肪上限', cat: '巨量營養素', target: activeDriStandard.satFatUl, actual: t.satFat, unit: 'g', dec: 1, isUpperLimit: true },
      { name: '膳食纖維', cat: '碳水與調節', target: activeDriStandard.fiber, actual: t.fiber, unit: 'g', dec: 1 },
      { name: '水分目安', cat: '體液平衡', target: activeDriStandard.water, actual: t.water, unit: 'mL', dec: 0 },
      
      { name: '鈣 (Ca)', cat: '巨量礦物質', target: activeDriStandard.ca, actual: t.ca, unit: 'mg', dec: 0 },
      { name: '磷 (P)', cat: '巨量礦物質', target: activeDriStandard.p, actual: t.p, unit: 'mg', dec: 0 },
      { name: '鎂 (Mg)', cat: '巨量礦物質', target: activeDriStandard.mg, actual: t.mg, unit: 'mg', dec: 0 },
      { name: '鉀 (K)', cat: '電解質', target: activeDriStandard.k, actual: t.k, unit: 'mg', dec: 0 },
      { name: '鈉 (Na)', cat: '電解質', target: activeDriStandard.na, actual: t.na, unit: 'mg', dec: 0, isUpperLimit: true },
      { name: '鐵 (Fe)', cat: '微量元素', target: activeDriStandard.fe, actual: t.fe, unit: 'mg', dec: 2 },
      { name: '鋅 (Zn)', cat: '微量元素', target: activeDriStandard.zn, actual: t.zn, unit: 'mg', dec: 2 },
      { name: '銅 (Cu)', cat: '微量元素', target: activeDriStandard.cu, actual: t.cu, unit: 'mg', dec: 2 },
      { name: '錳 (Mn)', cat: '微量元素', target: activeDriStandard.mn, actual: t.mn, unit: 'mg', dec: 2 },

      { name: '維生素 A', cat: '脂溶性維生素', target: activeDriStandard.vitA, actual: t.vitA, unit: 'ug RAE', dec: 0 },
      { name: '維生素 D', cat: '脂溶性維生素', target: activeDriStandard.vitD, actual: t.vitD, unit: 'ug', dec: 1 },
      { name: '維生素 E', cat: '脂溶性維生素', target: activeDriStandard.vitE, actual: t.vitE, unit: 'mg', dec: 1 },
      
      { name: '維生素 C', cat: '水溶性維生素', target: activeDriStandard.vitC, actual: t.vitC, unit: 'mg', dec: 1 },
      { name: '維生素 B1 (硫胺素)', cat: '維生素 B 群', target: activeDriStandard.vitB1, actual: t.vitB1, unit: 'mg', dec: 2 },
      { name: '維生素 B2 (核黃素)', cat: '維生素 B 群', target: activeDriStandard.vitB2, actual: t.vitB2, unit: 'mg', dec: 2 },
      { name: '菸鹼素 (Niacin)', cat: '維生素 B 群', target: activeDriStandard.niacin, actual: t.niacin, unit: 'mg NE', dec: 2 },
      { name: '維生素 B6', cat: '維生素 B 群', target: activeDriStandard.vitB6, actual: t.vitB6, unit: 'mg', dec: 2 },
      { name: '維生素 B12', cat: '維生素 B 群', target: activeDriStandard.vitB12, actual: t.vitB12, unit: 'ug', dec: 2 },
      { name: '葉酸 (Folate)', cat: '維生素 B 群', target: activeDriStandard.folate, actual: t.folate, unit: 'mcg', dec: 0 }
    ];

    const driRows = driItems.map(d => {
      const targetVal = d.target ?? 0;
      const pct = targetVal > 0 ? Math.round((d.actual / targetVal) * 100) : 100;
      let status = '正常充足';
      if (d.isUpperLimit) {
        status = d.actual > targetVal ? '超出安全上限 (需注意)' : '合乎安全標準';
      } else {
        if (pct < 70) status = '攝取不足 (<70%)';
        else if (pct < 100) status = '尚可微調 (70-99%)';
        else if (pct <= 150) status = '優質達標 (100-150%)';
        else status = '豐富充足 (>150%)';
      }

      return [
        d.name,
        d.cat,
        targetVal,
        Number(d.actual.toFixed(d.dec)),
        d.unit,
        pct,
        status
      ];
    });

    const allCsvLines = [
      ...metaRows.map(r => r.join(",")),
      foodHeaders.join(","),
      ...foodRows.map(r => r.join(",")),
      ...summaryRows.map(r => r.join(",")),
      ...driRows.map(r => r.join(",")),
      "",
      `* 本評估由營養師專業臨床工具包生成 · 版權宣告所有人：richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)`
    ];

    const csvContent = "\uFEFF" + allCsvLines.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `臨床飲食評估與DRIs全營養素分析報表_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickToast({
      message: '已成功匯出飲食評估與 DRIs 全營養素分析報表 (CSV)',
      sub: `共 ${analysisBasket.length} 項飲食記錄及全項 DRIs 對照`
    });
  };

  // 匯出臨床飲食評估與 DRIs 分析 HTML 完整報告單
  const handleExportAssessmentHtml = () => {
    if (analysisBasket.length === 0) {
      setQuickToast({ message: '目前飲食記錄為空，無法匯出', sub: '請先由食材寶典或菜單加入食材' });
      return;
    }

    const t = wholeDayAnalysis.totals;
    const six = wholeDayAnalysis.sixGroups;

    const basketRowsHtml = analysisBasket.map((b, i) => {
      const meal = b.mealType === 'breakfast' ? '早餐' : b.mealType === 'lunch' ? '午餐' : b.mealType === 'dinner' ? '晚餐' : '點心';
      const f = b.food;
      const ratio = (b.portionGrams || 100) / 100;
      const oilG = Math.max(0, Number(b.cookingOilGrams) || 0);
      const oilProfile = oilG > 0 ? getCookingOilProfile(b.cookingOilName) : null;
      const oilKcal = oilProfile ? oilProfile.kcal * (oilG / 100) : 0;
      const oilFat = oilProfile ? oilProfile.fat * (oilG / 100) : 0;
      const totKcal = Math.round(f.kcal * ratio + oilKcal);
      const totPro = (f.pro * ratio).toFixed(1);
      const totFat = (f.fat * ratio + oilFat).toFixed(1);
      const totCho = (f.cho * ratio).toFixed(1);

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${i % 2 === 1 ? 'background: #f8fafc;' : 'background: #fff;'}">
          <td style="padding: 8px 10px; font-weight: bold; color: #4338ca;">${meal}</td>
          <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">${f.name}</td>
          <td style="padding: 8px 10px; text-align: right;">${b.portionGrams}g</td>
          <td style="padding: 8px 10px; color: #78350f;">${oilG > 0 ? `${b.cookingOilName?.split(' ')[0]} ${oilG}g` : '無用油'}</td>
          <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: #047857;">${totKcal} kcal</td>
          <td style="padding: 8px 10px; text-align: right;">${totPro}g</td>
          <td style="padding: 8px 10px; text-align: right;">${totFat}g</td>
          <td style="padding: 8px 10px; text-align: right;">${totCho}g</td>
          <td style="padding: 8px 10px; text-align: right;">${(f.fiber * ratio).toFixed(1)}g</td>
          <td style="padding: 8px 10px; text-align: right;">${Math.round(f.na * ratio)} mg</td>
          <td style="padding: 8px 10px; text-align: right;">${Math.round(f.k * ratio)} mg</td>
        </tr>
      `;
    }).join('');

    const driItems = [
      { name: '總熱量 (EER)', cat: '熱量', target: activeDriStandard.eer, actual: t.kcal, unit: 'kcal', dec: 0 },
      { name: '粗蛋白質', cat: '巨量', target: activeDriStandard.pro, actual: t.pro, unit: 'g', dec: 1 },
      { name: '總碳水化合物', cat: '巨量', target: activeDriStandard.cho, actual: t.cho, unit: 'g', dec: 1 },
      { name: '粗脂肪', cat: '巨量', target: activeDriStandard.fat, actual: t.fat, unit: 'g', dec: 1 },
      { name: '飽和脂肪酸上限', cat: '巨量', target: activeDriStandard.satFatUl, actual: t.satFat, unit: 'g', dec: 1, isUpperLimit: true },
      { name: '膳食纖維', cat: '碳水', target: activeDriStandard.fiber, actual: t.fiber, unit: 'g', dec: 1 },
      { name: '水分目安', cat: '體液', target: activeDriStandard.water, actual: t.water, unit: 'mL', dec: 0 },
      { name: '鈣 (Ca)', cat: '礦物質', target: activeDriStandard.ca, actual: t.ca, unit: 'mg', dec: 0 },
      { name: '磷 (P)', cat: '礦物質', target: activeDriStandard.p, actual: t.p, unit: 'mg', dec: 0 },
      { name: '鎂 (Mg)', cat: '礦物質', target: activeDriStandard.mg, actual: t.mg, unit: 'mg', dec: 0 },
      { name: '鉀 (K)', cat: '電解質', target: activeDriStandard.k, actual: t.k, unit: 'mg', dec: 0 },
      { name: '鈉 (Na)', cat: '電解質', target: activeDriStandard.na, actual: t.na, unit: 'mg', dec: 0, isUpperLimit: true },
      { name: '鐵 (Fe)', cat: '微量元素', target: activeDriStandard.fe, actual: t.fe, unit: 'mg', dec: 2 },
      { name: '鋅 (Zn)', cat: '微量元素', target: activeDriStandard.zn, actual: t.zn, unit: 'mg', dec: 2 },
      { name: '銅 (Cu)', cat: '微量元素', target: activeDriStandard.cu, actual: t.cu, unit: 'mg', dec: 2 },
      { name: '錳 (Mn)', cat: '微量元素', target: activeDriStandard.mn, actual: t.mn, unit: 'mg', dec: 2 },
      { name: '維生素 A', cat: '脂溶性', target: activeDriStandard.vitA, actual: t.vitA, unit: 'ug RAE', dec: 0 },
      { name: '維生素 D', cat: '脂溶性', target: activeDriStandard.vitD, actual: t.vitD, unit: 'ug', dec: 1 },
      { name: '維生素 E', cat: '脂溶性', target: activeDriStandard.vitE, actual: t.vitE, unit: 'mg', dec: 1 },
      { name: '維生素 C', cat: '水溶性', target: activeDriStandard.vitC, actual: t.vitC, unit: 'mg', dec: 1 },
      { name: '維生素 B1', cat: '維生素B群', target: activeDriStandard.vitB1, actual: t.vitB1, unit: 'mg', dec: 2 },
      { name: '維生素 B2', cat: '維生素B群', target: activeDriStandard.vitB2, actual: t.vitB2, unit: 'mg', dec: 2 },
      { name: '菸鹼素', cat: '維生素B群', target: activeDriStandard.niacin, actual: t.niacin, unit: 'mg NE', dec: 2 },
      { name: '維生素 B6', cat: '維生素B群', target: activeDriStandard.vitB6, actual: t.vitB6, unit: 'mg', dec: 2 },
      { name: '維生素 B12', cat: '維生素B群', target: activeDriStandard.vitB12, actual: t.vitB12, unit: 'ug', dec: 2 },
      { name: '葉酸', cat: '維生素B群', target: activeDriStandard.folate, actual: t.folate, unit: 'mcg', dec: 0 }
    ];

    const driRowsHtml = driItems.map((d, idx) => {
      const targetVal = d.target ?? 0;
      const pct = targetVal > 0 ? Math.round((d.actual / targetVal) * 100) : 100;
      let statusColor = '#047857';
      let statusBg = '#d1fae5';
      let statusText = '充足達標';

      if (d.isUpperLimit) {
        if (d.actual > targetVal) {
          statusColor = '#b91c1c';
          statusBg = '#fee2e2';
          statusText = '超量警示';
        } else {
          statusColor = '#047857';
          statusBg = '#d1fae5';
          statusText = '合規正常';
        }
      } else {
        if (pct < 70) {
          statusColor = '#b91c1c';
          statusBg = '#fee2e2';
          statusText = '嚴重不足';
        } else if (pct < 100) {
          statusColor = '#b45309';
          statusBg = '#fef3c7';
          statusText = '尚可微調';
        } else {
          statusColor = '#047857';
          statusBg = '#d1fae5';
          statusText = '充足達標';
        }
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background: #f8fafc;' : 'background: #fff;'}">
          <td style="padding: 8px 10px; font-weight: bold; color: #1e293b;">${d.name}</td>
          <td style="padding: 8px 10px; color: #64748b; font-size: 0.8rem;">${d.cat}</td>
          <td style="padding: 8px 10px; text-align: right; color: #475569;">${targetVal} ${d.unit}</td>
          <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: #0f172a;">${Number(d.actual.toFixed(d.dec))} ${d.unit}</td>
          <td style="padding: 8px 10px; width: 140px;">
            <div style="background: #e2e8f0; border-radius: 9999px; height: 8px; overflow: hidden;">
              <div style="background: ${statusColor}; width: ${Math.min(100, pct)}%; height: 100%;"></div>
            </div>
            <div style="font-size: 0.75rem; text-align: right; color: #64748b; margin-top: 2px;">${pct}%</div>
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <span style="color: ${statusColor}; background: ${statusBg}; font-size: 0.75rem; font-weight: bold; padding: 2px 8px; border-radius: 9999px;">${statusText}</span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>臨床營養處方飲食評估與DRIs分析報告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 2rem; max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 1.8rem; margin-bottom: 0.25rem; text-align: center; color: #0f172a; }
    .subtitle { text-align: center; color: #64748b; margin-bottom: 1.5rem; font-size: 0.95rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .grid-6 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f1f5f9; color: #334155; padding: 10px; font-weight: bold; text-align: right; border-bottom: 2px solid #cbd5e1; }
    th:first-child, th:nth-child(2), th:nth-child(4) { text-align: left; }
    .print-btn { display: inline-block; background: #047857; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; text-decoration: none; }
    @media print {
      body { background: #fff; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div style="text-align: right; margin-bottom: 1rem;">
    <button class="print-btn" onclick="window.print()">🖨️ 列印或存為 PDF 臨床單</button>
  <h1>📋 臨床營養處方飲食評估與 DRIs 分析報告</h1>
  <div class="subtitle">
    營養師專業臨床工具包 (Dietitian Pro Suite) · 評估日期：${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}<br/>
    <span style="display: inline-block; margin-top: 6px; color: #047857; font-weight: bold; font-size: 0.9rem;">版權宣告所有人：richardmimic / 營養吳理</span>
  </div>

  <!-- 個案體位與處方 -->
  <div class="card" style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
      <h2 style="font-size: 1.1rem; margin: 0; font-weight: bold;">👤 個案基本資料與處方設定</h2>
      <span style="background: rgba(16,185,129,0.25); color: #34d399; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; border: 1px solid rgba(16,185,129,0.3);">${clinicalGoals.config.name} (${clinicalGoals.config.badge})</span>
    </div>
    <div class="grid-4" style="font-size: 0.9rem;">
      <div><span style="color:#94a3b8;">性別/年齡：</span><b>${userProfile.gender === 'female' ? '女性' : '男性'} / ${userProfile.ageGroup} 歲</b></div>
      <div><span style="color:#94a3b8;">身高/體重：</span><b>${userProfile.heightCm} cm / ${userProfile.weightKg} kg</b></div>
      <div><span style="color:#94a3b8;">BMI/理想體重：</span><b>${clinicalGoals.bmi} / ${clinicalGoals.ibw} kg</b></div>
      <div><span style="color:#94a3b8;">處方建議熱量：</span><b style="color:#34d399;">${clinicalGoals.targetKcal} kcal / PRO ${clinicalGoals.targetProG}g</b></div>
    </div>
  </div>

  <!-- 飲食記錄明細 -->
  <div class="card">
    <h3 style="font-size: 1rem; margin-top: 0; margin-bottom: 0.75rem; color: #0f172a;">🍽️ 跨工具飲食記錄明細 (共 ${analysisBasket.length} 項)</h3>
    <table style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr>
          <th>餐別</th>
          <th>食材品名</th>
          <th>份量</th>
          <th>烹調用油</th>
          <th>總熱量</th>
          <th>蛋白質</th>
          <th>脂肪</th>
          <th>碳水</th>
          <th>纖維</th>
          <th>鈉 (Na)</th>
          <th>鉀 (K)</th>
        </tr>
      </thead>
      <tbody>
        ${basketRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- 三大營養素與六大類食物 -->
  <div class="card">
    <h3 style="font-size: 1rem; margin-top: 0; margin-bottom: 0.75rem; color: #0f172a;">📊 三大營養素供能分佈與六大類食物代換</h3>
    <div class="grid-4" style="margin-bottom: 1.25rem;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
        <div style="color: #64748b; font-size: 0.8rem;">總熱量攝取</div>
        <div style="font-size: 1.2rem; font-weight: 900; color: #047857; margin-top: 4px;">${Math.round(t.kcal)} <span style="font-size: 0.8rem;">kcal</span></div>
        <div style="font-size: 0.75rem; color: #64748b;">目標達成率 ${Math.round((t.kcal / clinicalGoals.targetKcal) * 100)}%</div>
      </div>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px; text-align: center;">
        <div style="color: #1e40af; font-size: 0.8rem;">蛋白質供能</div>
        <div style="font-size: 1.2rem; font-weight: 900; color: #1e3a8a; margin-top: 4px;">${wholeDayAnalysis.proPct}%</div>
        <div style="font-size: 0.75rem; color: #3b82f6;">${Math.round(t.pro)}g / 目標 ${clinicalGoals.targetProG}g</div>
      </div>
      <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 10px; text-align: center;">
        <div style="color: #854d0e; font-size: 0.8rem;">脂肪供能</div>
        <div style="font-size: 1.2rem; font-weight: 900; color: #713f12; margin-top: 4px;">${wholeDayAnalysis.fatPct}%</div>
        <div style="font-size: 0.75rem; color: #ca8a04;">${Math.round(t.fat)}g (含烹調油)</div>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 10px; text-align: center;">
        <div style="color: #166534; font-size: 0.8rem;">碳水化合物</div>
        <div style="font-size: 1.2rem; font-weight: 900; color: #14532d; margin-top: 4px;">${wholeDayAnalysis.choPct}%</div>
        <div style="font-size: 0.75rem; color: #16a34a;">約 ${wholeDayAnalysis.carbExchanges} 份醣代換</div>
      </div>
    </div>

    <div style="font-size: 0.9rem; font-weight: bold; margin-bottom: 6px; color: #334155;">國健署六大類食物代換份數：</div>
    <div class="grid-6">
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: #64748b;">全穀雜糧</div>
        <div style="font-weight: 900; font-size: 1.1rem; color: #b45309;">${six.cereals} 份</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: #64748b;">豆魚蛋肉</div>
        <div style="font-weight: 900; font-size: 1.1rem; color: #1d4ed8;">${six.proteins} 份</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: #64748b;">乳品類</div>
        <div style="font-weight: 900; font-size: 1.1rem; color: #4338ca;">${six.dairy} 份</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: #64748b;">蔬菜類</div>
        <div style="font-weight: 900; font-size: 1.1rem; color: #047857;">${six.vegetables} 份</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: #64748b;">水果類</div>
        <div style="font-weight: 900; font-size: 1.1rem; color: #be123c;">${six.fruits} 份</div>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: #64748b;">油脂堅果</div>
        <div style="font-weight: 900; font-size: 1.1rem; color: #d97706;">${six.oils} 份</div>
      </div>
    </div>
  </div>

  <!-- DRIs 完整對照表 -->
  <div class="card">
    <h3 style="font-size: 1rem; margin-top: 0; margin-bottom: 0.75rem; color: #0f172a;">⚡ 衛福部 DRIs 第 8 版全項微量營養素達成率對照</h3>
    <table style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr>
          <th>營養素項目</th>
          <th>分類</th>
          <th>DRIs 建議目標</th>
          <th>實際攝取總量</th>
          <th>目標進度</th>
          <th style="text-align: center;">臨床評估</th>
        </tr>
      </thead>
      <tbody>
        ${driRowsHtml}
      </tbody>
    </table>
  </div>

  <footer style="text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #64748b; line-height: 1.6;">
    本報告由 營養師專業臨床工具包 (Dietitian Pro Suite) 生成 · 衛福部 TFDA 檢驗標準及國健署 DRIs 第 8 版指引依歸<br/>
    <b>版權宣告所有人：richardmimic / 營養吳理</b> (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `臨床飲食評估與DRIs分析報告_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickToast({
      message: `已成功匯出飲食評估與 DRIs 分析 HTML 報告單`,
      sub: `包含完整飲食記錄、六大類代換及 DRIs 評估`
    });
  };

  // 匯出臨床飲食處方評估摘要單 (TXT 格式)
  const handleExportDietPlanReport = () => {
    if (analysisBasket.length === 0) {
      setQuickToast({ message: '目前飲食記錄為空，無法匯出', sub: '請先由食材寶典或菜單加入食材' });
      return;
    }
    const t = wholeDayAnalysis.totals;
    const lines = [
      `【臨床營養師專業飲食處方評估摘要單】`,
      `版權宣告所有人：richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)`,
      `評估系統：營養師專業臨床工具包 (Dietitian Pro Suite)`,
      `評估日期：${new Date().toLocaleDateString('zh-TW')} ${new Date().toLocaleTimeString('zh-TW')}`,
      `個案體位：${userProfile.gender === 'female' ? '女性' : '男性'} / ${userProfile.ageGroup}歲 / 身高 ${userProfile.heightCm}cm / 體重 ${userProfile.weightKg}kg (BMI: ${clinicalGoals.bmi}, IBW: ${clinicalGoals.ibw}kg)`,
      `臨床處方：${clinicalGoals.config.name} (${clinicalGoals.config.badge})`,
      `處方目標：熱量 ${clinicalGoals.targetKcal} kcal · 蛋白質 ${clinicalGoals.targetProG} g · 鈉上限 ${clinicalGoals.config.naLimitMg} mg`,
      `----------------------------------------`,
      `【跨工具連動飲食記錄清單 (共 ${analysisBasket.length} 項)】`,
      ...analysisBasket.map((b, i) => {
        const meal = b.mealType === 'breakfast' ? '[早]' : b.mealType === 'lunch' ? '[午]' : b.mealType === 'dinner' ? '[晚]' : '[點]';
        const oilStr = (b.cookingOilGrams && b.cookingOilGrams > 0) ? ` · 烹調油: ${b.cookingOilName?.split(' ')[0]} ${b.cookingOilGrams}g` : '';
        const ratio = (b.portionGrams || 100) / 100;
        const oilG = Math.max(0, Number(b.cookingOilGrams) || 0);
        const oilProfile = oilG > 0 ? getCookingOilProfile(b.cookingOilName) : null;
        const oilKcal = oilProfile ? oilProfile.kcal * (oilG / 100) : 0;
        const oilFat = oilProfile ? oilProfile.fat * (oilG / 100) : 0;
        const totKcal = Math.round(b.food.kcal * ratio + oilKcal);
        const totPro = (b.food.pro * ratio).toFixed(1);
        const totFat = (b.food.fat * ratio + oilFat).toFixed(1);
        const totCho = (b.food.cho * ratio).toFixed(1);

        return `${i + 1}. ${meal} ${b.food.name} (${b.portionGrams}g${oilStr}) - ${totKcal} kcal, P:${totPro}g, C:${totCho}g, F:${totFat}g`;
      }),
      `----------------------------------------`,
      `【三大營養素與醣類計數】`,
      `總熱量：${Math.round(t.kcal)} kcal (目標達成率 ${Math.round(t.kcal / clinicalGoals.targetKcal * 100)}%)`,
      `蛋白質：${Math.round(t.pro)} g (${wholeDayAnalysis.proPct}%)`,
      `脂肪：${Math.round(t.fat)} g (${wholeDayAnalysis.fatPct}%)`,
      `總碳水化合物：${Math.round(t.cho)} g (${wholeDayAnalysis.choPct}%)`,
      `醣類代換份數：約 ${wholeDayAnalysis.carbExchanges} 份醣 (1份=15g碳水)`,
      `----------------------------------------`,
      `【國健署六大類食物代換份數估算】`,
      `全穀雜糧類：${wholeDayAnalysis.sixGroups.cereals} 份`,
      `豆魚蛋肉類：${wholeDayAnalysis.sixGroups.proteins} 份`,
      `乳品類：${wholeDayAnalysis.sixGroups.dairy} 份`,
      `蔬菜類：${wholeDayAnalysis.sixGroups.vegetables} 份`,
      `水果類：${wholeDayAnalysis.sixGroups.fruits} 份`,
      `油脂與堅果種子類：${wholeDayAnalysis.sixGroups.oils} 份 (含烹調用油)`,
      `----------------------------------------`,
      `【DRIs 完整微量營養素與電解質分析】`,
      `[電解質與巨量礦物質]`,
      `  鈉 (Na)：${Math.round(t.na)} mg (上限門檻 ${clinicalGoals.config.naLimitMg} mg)`,
      `  鉀 (K)：${Math.round(t.k)} mg (目標 ${activeDriStandard.k} mg)`,
      `  磷 (P)：${Math.round(t.p)} mg (目標 ${activeDriStandard.p} mg)`,
      `  鈣 (Ca)：${Math.round(t.ca)} mg (目標 ${activeDriStandard.ca} mg)`,
      `  鎂 (Mg)：${Math.round(t.mg)} mg (目標 ${activeDriStandard.mg} mg)`,
      `[微量礦物質]`,
      `  鐵 (Fe)：${t.fe.toFixed(2)} mg (目標 ${activeDriStandard.fe} mg)`,
      `  鋅 (Zn)：${t.zn.toFixed(2)} mg (目標 ${activeDriStandard.zn} mg)`,
      `  銅 (Cu)：${t.cu.toFixed(2)} mg (目標 ${activeDriStandard.cu} mg)`,
      `  錳 (Mn)：${t.mn.toFixed(2)} mg (目標 ${activeDriStandard.mn} mg)`,
      `[脂溶性維生素]`,
      `  維生素 A：${Math.round(t.vitA)} ug RAE (目標 ${activeDriStandard.vitA} ug RAE)`,
      `  維生素 D：${t.vitD.toFixed(1)} ug (目標 ${activeDriStandard.vitD} ug)`,
      `  維生素 E：${t.vitE.toFixed(1)} mg (目標 ${activeDriStandard.vitE} mg)`,
      `[水溶性維生素]`,
      `  維生素 C：${Math.round(t.vitC)} mg (目標 ${activeDriStandard.vitC} mg)`,
      `  維生素 B1：${t.vitB1.toFixed(2)} mg (目標 ${activeDriStandard.vitB1} mg)`,
      `  維生素 B2：${t.vitB2.toFixed(2)} mg (目標 ${activeDriStandard.vitB2} mg)`,
      `  菸鹼素：${t.niacin.toFixed(1)} mg NE (目標 ${activeDriStandard.niacin} mg NE)`,
      `  維生素 B6：${t.vitB6.toFixed(2)} mg (目標 ${activeDriStandard.vitB6} mg)`,
      `  維生素 B12：${t.vitB12.toFixed(2)} ug (目標 ${activeDriStandard.vitB12} ug)`,
      `  葉酸：${Math.round(t.folate)} mcg (目標 ${activeDriStandard.folate} mcg)`,
      `----------------------------------------`,
      `【版權宣告所有人】richardmimic / 營養吳理 (Copyright © 2026 richardmimic / 營養吳理. All rights reserved.)`,
      `* 本評估由營養師專業臨床工具包引擎生成，涵蓋衛福部 DRIs 第 8 版所有營養素項目。`
    ];

    const blob = new Blob([lines.join("\n")], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `臨床飲食處方評估摘要單_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickToast({
      message: '已成功匯出臨床處方評估摘要單 (TXT)',
      sub: '純文字檔方便備查與病歷貼附'
    });
  };

  return (
    <div className="bg-slate-100 text-slate-800 min-h-screen flex flex-col items-center justify-start pb-20 select-none">
      {/* Mobile Screen Container */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl relative">
        
        {/* Top Header - Nutritionist Toolkit Hub Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                <span>營養師工具包</span>
                <span className="text-[9px] bg-slate-900 text-emerald-400 font-bold px-1.5 py-0.2 rounded">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">TFDA 食品庫 · 臨床飲食處方評估 · 版權所有：richardmimic / 營養吳理</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* 臨床個案設定按鈕 */}
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="touch-press px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1 text-xs font-bold transition"
              title="設定個案體位、疾病/運動處方型態與 DRIs"
            >
              <UserCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span className="max-w-[85px] truncate">{clinicalGoals.config.badge}</span>
            </button>

            {/* 雲端資料庫按鈕 */}
            <button 
              onClick={() => setIsDbModalOpen(true)}
              className="touch-press p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition" 
              title="TFDA 資料庫檔案與 Google 試算表同步"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        </header>

        {/* TOOLKIT SYSTEM SWITCHER BAR (核心雙工具切換) */}
        <section aria-label="營養師核心工具切換" className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setActiveTool('atlas')}
              className={`touch-press px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${activeTool === 'atlas' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>食材營養寶典</span>
            </button>

            <button 
              onClick={() => setActiveTool('analyzer')}
              className={`touch-press px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition relative ${activeTool === 'analyzer' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>飲食分析評估</span>
              {analysisBasket.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-400 text-slate-950 text-[10px] font-black rounded-full">
                  {analysisBasket.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTool('planner')}
              className={`touch-press px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${activeTool === 'planner' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>臨床菜單生成</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span>{clinicalGoals.targetKcal} kcal</span>
            <span>·</span>
            <span>PRO {clinicalGoals.targetProG}g</span>
          </div>
        </section>

        {/* QUICK TOAST NOTIFICATION */}
        {quickToast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-11/12 bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-100">{quickToast.message}</p>
                {quickToast.sub && <p className="text-[10px] text-emerald-300">{quickToast.sub}</p>}
              </div>
            </div>
            <button 
              onClick={() => { setActiveTool('analyzer'); setAnalyzerSubTab('assessment'); setQuickToast(null); }}
              className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 hover:bg-emerald-500 transition"
            >
              <span>前往評估</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* =========================================================================
            TOOL 1: 台灣食材營養寶典 (ATLAS)
            ========================================================================= */}
        {activeTool === 'atlas' && (
          <div className="flex-1 flex flex-col">
            {/* Atlas Sub-Navigation (速查 / 排行 / 對比) */}
            <div className="bg-white border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-slate-600 shadow-2xs">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full">
                <button 
                  onClick={() => setAtlasSubTab('search')}
                  className={`w-1/3 py-1.5 rounded-lg transition text-center flex items-center justify-center space-x-1 ${atlasSubTab === 'search' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>食材速查</span>
                </button>
                <button 
                  onClick={() => setAtlasSubTab('rank')}
                  className={`w-1/3 py-1.5 rounded-lg transition text-center flex items-center justify-center space-x-1 ${atlasSubTab === 'rank' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>營養排行</span>
                </button>
                <button 
                  onClick={() => setAtlasSubTab('compare')}
                  className={`w-1/3 py-1.5 rounded-lg transition text-center flex items-center justify-center space-x-1 ${atlasSubTab === 'compare' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>雙物對比</span>
                </button>
              </div>
            </div>

            {/* 提示：選中食材可一鍵加入飲食分析 */}
            <div className="bg-emerald-50/70 border-b border-emerald-100 px-3.5 py-1 text-[10px] text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium">
                <Info className="w-3 h-3 text-emerald-600" />
                <span>點選食材卡片，可直接加入「飲食評估與 DRIs 分析」</span>
              </span>
              <button 
                onClick={() => { setActiveTool('analyzer'); setAnalyzerSubTab('assessment'); }}
                className="font-bold underline text-emerald-700 hover:text-emerald-900"
              >
                看評估 ({analysisBasket.length})
              </button>
            </div>

            {/* SUB-TAB: SEARCH */}
            {atlasSubTab === 'search' && (
              <main className="flex-1 p-3.5 space-y-3">
                <div className="space-y-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋食材（支援全資料庫品名、類別、中英文別名）" 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-8 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400 font-medium shadow-2xs"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dynamic Category Filter Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>資料庫分類（支援多選）：</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                      {foods.length === 0 ? '載入中...' : (selectedSearchCategories.size === 0 || selectedSearchCategories.size === dynamicCategories.length ? '全部食材' : `已複選 ${selectedSearchCategories.size} 類`)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                    {foods.length === 0 ? (
                      <span className="text-[11px] text-slate-400">正在連接雲端試算表...</span>
                    ) : (
                      <>
                        <button 
                          onClick={() => setSelectedSearchCategories(new Set())}
                          className={`flex-shrink-0 px-3 py-1 rounded-full font-bold transition text-xs ${(selectedSearchCategories.size === 0 || selectedSearchCategories.size === dynamicCategories.length) ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                        >
                          全部食材
                        </button>
                        {dynamicCategories.map(cat => {
                          const isSelected = selectedSearchCategories.has(cat);
                          return (
                            <button 
                              key={cat}
                              onClick={() => {
                                const next = new Set(selectedSearchCategories);
                                if (next.has(cat)) next.delete(cat);
                                else next.add(cat);
                                setSelectedSearchCategories(next);
                              }}
                              className={`flex-shrink-0 px-2.5 py-1 rounded-full font-bold transition text-xs ${isSelected ? 'bg-emerald-700 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Quick Clinical Nutrient Sort Chips */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                      <span>臨床重點指標快速排序（再次點擊取消）：</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeSortNutrient ? `高低排序中` : '依資料庫原序'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      { key: 'pro', label: '💪 高蛋白' },
                      { key: 'fiber', label: '🥬 高纖維' },
                      { key: 'k', label: '⚡ 鉀(K)' },
                      { key: 'p', label: '🦴 磷(P)' },
                      { key: 'lowNa', label: '💧 低鈉' },
                      { key: 'ca', label: '🦴 高鈣' },
                      { key: 'fe', label: '🩸 高鐵' },
                      { key: 'lowKcal', label: '🥗 低卡' }
                    ].map(chip => (
                      <button 
                        key={chip.key}
                        onClick={() => setActiveSortNutrient(prev => prev === chip.key ? null : chip.key)}
                        className={`flex-shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition ${activeSortNutrient === chip.key ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-500'}`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Food List Container */}
                <div className="space-y-2">
                  {foods.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                      <div className="w-8 h-8 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-bold text-xs text-slate-700">正在即時連線資料庫讀取食材資料...</p>
                      <p className="text-[10px] text-slate-400">連線 Google 試算表端點中，請稍候片刻。</p>
                    </div>
                  ) : filteredSearchFoods.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-xs text-slate-600">未找到相符之食材「{searchQuery}」</p>
                      <p className="text-[10px] text-slate-400">建議點選「全部食材」重設分類或搜尋其他關鍵字。</p>
                    </div>
                  ) : (
                    filteredSearchFoods.map(f => {
                      let sortBadge = null;
                      if (activeSortNutrient) {
                        let label = '';
                        let val = (f as any)[activeSortNutrient];
                        let unit = '';
                        if (activeSortNutrient === 'pro') { label = '蛋白質'; unit = 'g'; }
                        else if (activeSortNutrient === 'k') { label = '鉀'; unit = 'mg'; }
                        else if (activeSortNutrient === 'p') { label = '磷'; unit = 'mg'; }
                        else if (activeSortNutrient === 'fiber') { label = '纖維'; unit = 'g'; }
                        else if (activeSortNutrient === 'ca') { label = '鈣'; unit = 'mg'; }
                        else if (activeSortNutrient === 'fe') { label = '鐵'; unit = 'mg'; }
                        else if (activeSortNutrient === 'lowKcal') { label = '熱量'; val = f.kcal; unit = 'kcal'; }
                        else if (activeSortNutrient === 'lowNa') { label = '鈉'; val = f.na; unit = 'mg'; }
                        sortBadge = <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">{label}: {val}{unit}</span>;
                      }

                      const sixSample = estimateSixFoodPortions(f, 100);
                      let majorCategoryDesc = '';
                      if (sixSample.proteins > 0) majorCategoryDesc = `蛋白質 ${sixSample.proteins} 份`;
                      else if (sixSample.cereals > 0) majorCategoryDesc = `全穀 ${sixSample.cereals} 份 (醣)`;
                      else if (sixSample.vegetables > 0) majorCategoryDesc = `蔬菜 ${sixSample.vegetables} 份`;
                      else if (sixSample.fruits > 0) majorCategoryDesc = `水果 ${sixSample.fruits} 份`;

                      return (
                        <div 
                          key={f.id}
                          onClick={() => handleOpenDetail(f, 100)}
                          className="touch-press bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition shadow-2xs"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{f.icon}</span>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="font-bold text-slate-800 text-xs">{f.name}</h4>
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">{f.catName}</span>
                                {majorCategoryDesc && (
                                  <span className="text-[9px] text-slate-400 font-normal">· {majorCategoryDesc}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                                <span>{f.kcal} kcal</span>
                                <span>P: {f.pro}g</span>
                                <span>C: {f.cho}g</span>
                                <span>F: {f.fat}g</span>
                                <span>K: {f.k}mg</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-right">
                            {sortBadge}
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </main>
            )}

            {/* SUB-TAB: RANK */}
            {atlasSubTab === 'rank' && (
              <main className="flex-1 p-3.5 space-y-3">
                {/* Baseline Customizer Card */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-300/80 rounded-2xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs">
                        <Sliders className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-black text-slate-800">排行榜自訂換算基準與數值</span>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                      每 {rankCustomVal} {RANK_DIM_CONFIG[rankDim].unit} {RANK_DIM_CONFIG[rankDim].descName}基準
                    </span>
                  </div>

                  {/* Baseline Dimension Selector */}
                  <div className="grid grid-cols-5 gap-1 text-[11px] font-bold bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
                    {(['gram', 'kcal', 'pro', 'cho', 'fat'] as DimensionKey[]).map(dim => (
                      <button 
                        key={dim}
                        onClick={() => {
                          setRankDim(dim);
                          setRankCustomVal(RANK_DIM_CONFIG[dim].defaultVal);
                        }}
                        className={`py-1.5 rounded-lg text-center transition ${rankDim === dim ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'}`}
                      >
                        {dim === 'gram' && '⚖️ 重量'}
                        {dim === 'kcal' && '🔥 熱量'}
                        {dim === 'pro' && '💪 蛋白'}
                        {dim === 'cho' && '🍚 碳水'}
                        {dim === 'fat' && '🥑 脂肪'}
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Input & Preset Chips */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
                      {RANK_DIM_CONFIG[rankDim].presets.map(p => (
                        <button 
                          key={p}
                          onClick={() => setRankCustomVal(p)}
                          className="touch-press px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:border-amber-500 hover:text-amber-800 transition"
                        >
                          {p}{RANK_DIM_CONFIG[rankDim].unit}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1">
                      <label htmlFor={customBaseValInputId} className="sr-only">自訂換算基準數值</label>
                      <input 
                        id={customBaseValInputId}
                        type="number" 
                        value={rankCustomVal}
                        min="0.1" 
                        step="any"
                        onChange={(e) => setRankCustomVal(parseFloat(e.target.value) || 0.1)}
                        className="w-16 text-center font-black text-slate-900 bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-2xs"
                      />
                      <span className="text-xs font-bold text-slate-700 min-w-[20px]">{RANK_DIM_CONFIG[rankDim].unit}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    {rankDim === 'gram' 
                      ? `基準：以食材每 ${rankCustomVal} g 可食部位直接排名。`
                      : `基準：以提供 ${rankCustomVal} ${RANK_DIM_CONFIG[rankDim].unit} ${RANK_DIM_CONFIG[rankDim].descName}所需食材重量動態逆推排名。`
                    }
                  </p>
                </div>

                {/* Category Filter for Ranking */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold flex items-center gap-1 text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>資料庫分類（支援多選）：</span>
                    </span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                      {selectedRankCategories.size === 0 || selectedRankCategories.size === dynamicCategories.length ? '全部食材' : `已複選 ${selectedRankCategories.size} 類`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                    <button 
                      onClick={() => setSelectedRankCategories(new Set())}
                      className={`flex-shrink-0 px-3 py-1 rounded-full font-bold transition text-xs ${(selectedRankCategories.size === 0 || selectedRankCategories.size === dynamicCategories.length) ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      全部食材
                    </button>
                    {dynamicCategories.map(cat => {
                      const isSelected = selectedRankCategories.has(cat);
                      return (
                        <button 
                          key={cat}
                          onClick={() => {
                            const next = new Set(selectedRankCategories);
                            if (next.has(cat)) next.delete(cat);
                            else next.add(cat);
                            setSelectedRankCategories(next);
                          }}
                          className={`flex-shrink-0 px-2.5 py-1 rounded-full font-bold transition text-xs ${isSelected ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sort Direction */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <label htmlFor={rankSortOrderId} className="font-bold text-slate-600 text-[11px] flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                      <span>排序方式：</span>
                    </label>
                    <select 
                      id={rankSortOrderId}
                      value={rankSortOrder}
                      onChange={(e) => setRankSortOrder(e.target.value as 'desc' | 'asc')}
                      className="text-xs font-bold p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                    >
                      <option value="desc">⬇️ 由高到低 (降冪)</option>
                      <option value="asc">⬆️ 由低到高 (升冪)</option>
                    </select>
                  </div>
                </div>

                {/* Range Filter */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                      <span>數值範圍篩選（上下限，不設則留空）：</span>
                    </span>
                    <button 
                      onClick={() => { setRankMinVal(''); setRankMaxVal(''); }}
                      className="text-[10px] text-amber-700 hover:underline"
                    >
                      清除範圍
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <label htmlFor={minValInputId} className="text-[10px] font-bold text-slate-500 min-w-[28px]">下限:</label>
                      <input 
                        id={minValInputId}
                        type="number" 
                        value={rankMinVal}
                        onChange={(e) => setRankMinVal(e.target.value)}
                        placeholder="不設" 
                        step="any"
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-center space-x-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <label htmlFor={maxValInputId} className="text-[10px] font-bold text-slate-500 min-w-[28px]">上限:</label>
                      <input 
                        id={maxValInputId}
                        type="number" 
                        value={rankMaxVal}
                        onChange={(e) => setRankMaxVal(e.target.value)}
                        placeholder="不設" 
                        step="any"
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick 8 Buttons Grid & Full Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-700">選擇排行營養素（顯示前 20 種）：</span>
                    <span className="text-[10px] text-slate-400">含電解質及臨床關鍵指標</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                    {[
                      { key: 'pro', label: '💪 蛋白質' },
                      { key: 'k', label: '⚡ 鉀 (K)' },
                      { key: 'p', label: '🦴 磷 (P)' },
                      { key: 'ca', label: '🦴 鈣 (Ca)' },
                      { key: 'fe', label: '🩸 鐵 (Fe)' },
                      { key: 'fiber', label: '🥬 纖維' },
                      { key: 'na', label: '🧂 鈉 (Na)' },
                      { key: 'vitC', label: '🍊 維生素C' }
                    ].map(b => (
                      <button 
                        key={b.key}
                        onClick={() => setCurrentRankNutrient(b.key)}
                        className={`p-2 rounded-xl border text-center touch-press transition ${currentRankNutrient === b.key ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700'}`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <label htmlFor={rankNutrientSelectId} className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      <span>TFDA 食品資料庫全項檢驗指標完整清單：</span>
                    </label>
                    <select 
                      id={rankNutrientSelectId}
                      value={currentRankNutrient}
                      onChange={(e) => setCurrentRankNutrient(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-amber-500"
                    >
                      <optgroup label="🥩 三大營養素與能量代謝">
                        <option value="pro">粗蛋白質 (Crude Protein, g)</option>
                        <option value="fat">粗脂肪 (Crude Fat, g)</option>
                        <option value="cho">總碳水化合物 (Carbohydrate, g)</option>
                        <option value="fiber">膳食纖維 (Dietary Fiber, g)</option>
                        <option value="sugar">糖質總量 (Total Sugars, g)</option>
                        <option value="kcal">熱量密度 (高卡 kcal)</option>
                        <option value="lowKcal">熱量密度 (低卡 kcal)</option>
                      </optgroup>
                      <optgroup label="🧈 脂質與脂肪酸分析">
                        <option value="satFat">飽和脂肪酸 (SFA, g)</option>
                        <option value="mufa">單元不飽和脂肪酸 (MUFA, g)</option>
                        <option value="pufa">多元不飽和脂肪酸 (PUFA, g)</option>
                        <option value="chol">膽固醇 (Cholesterol, mg)</option>
                      </optgroup>
                      <optgroup label="💧 一般成分與基本物性">
                        <option value="water">水分含量 (Water, g)</option>
                        <option value="ash">灰分含量 (Ash, g)</option>
                      </optgroup>
                      <optgroup label="⛏️ 礦物質與微量元素 (臨床 CKD/DASH 關注)">
                        <option value="k">鉀離子 (Potassium, mg)</option>
                        <option value="p">磷 (Phosphorus, mg)</option>
                        <option value="na">高鈉含量 (Sodium, mg)</option>
                        <option value="lowNa">低鈉無負擔 (Sodium, mg)</option>
                        <option value="ca">鈣質 (Calcium, mg)</option>
                        <option value="fe">鐵質 (Iron, mg)</option>
                        <option value="zn">鋅元素 (Zinc, mg)</option>
                        <option value="mg">鎂 (Magnesium, mg)</option>
                        <option value="cu">銅 (Copper, mg)</option>
                        <option value="mn">錳 (Manganese, mg)</option>
                      </optgroup>
                      <optgroup label="💊 維生素群">
                        <option value="vitC">維生素 C (Ascorbic Acid, mg)</option>
                        <option value="vitA">維生素 A 總量 (Vitamin A, ug RAE)</option>
                        <option value="folate">葉酸 (Folate, mcg)</option>
                        <option value="vitD">維生素 D (Vitamin D, ug)</option>
                        <option value="vitE">維生素 E (Vitamin E, mg)</option>
                        <option value="vitB1">維生素 B1 (Thiamin, mg)</option>
                        <option value="vitB2">維生素 B2 (Riboflavin, mg)</option>
                        <option value="niacin">菸鹼素 (Niacin, mg)</option>
                        <option value="vitB6">維生素 B6 (Pyridoxine, mg)</option>
                        <option value="vitB12">維生素 B12 (Cobalamin, ug)</option>
                        <option value="alphaCaro">α-胡蘿蔔素 (Alpha-Carotene, ug)</option>
                        <option value="betaCaro">β-胡蘿蔔素 (Beta-Carotene, ug)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Ranking Pagination & View Mode Bar */}
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-xs gap-1 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-slate-700 text-[11px]">
                      {rankShowAll ? `全部食材 (${allRankedItems.length} 項)` : `第 ${rankPage} / ${rankTotalPages} 頁 (共 ${allRankedItems.length} 項)`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {/* 匯出排行榜 CSV 按鈕 */}
                    <button 
                      onClick={handleExportRankingCsv}
                      className="touch-press px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center gap-1 shadow-2xs"
                      title="匯出當前營養排行榜為 CSV 試算表 (相容 Excel)"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-amber-700" />
                      <span>匯出排行 CSV</span>
                    </button>

                    {/* 匯出排行榜 HTML 按鈕 */}
                    <button 
                      onClick={handleExportRankingHtml}
                      className="touch-press px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center gap-1 shadow-2xs"
                      title="匯出當前營養排行榜為 HTML 報表 (支援列印與瀏覽器檢視)"
                    >
                      <BookOpen className="w-3 h-3 text-amber-700" />
                      <span>匯出 HTML</span>
                    </button>

                    {/* 全部排行開關按鈕 */}
                    <button 
                      onClick={() => setRankShowAll(prev => !prev)}
                      className={`touch-press px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${rankShowAll ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                      title="切換顯示當前全部食材完整排行"
                    >
                      {rankShowAll ? '📑 恢復分頁模式' : '🌐 查看全部排行'}
                    </button>

                    {/* 上下頁分頁按鈕 (分頁模式時有效) */}
                    {!rankShowAll && (
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => setRankPage(prev => Math.max(1, prev - 1))}
                          disabled={rankPage <= 1}
                          className="touch-press px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] disabled:opacity-40 hover:bg-slate-100 transition"
                        >
                          上一頁
                        </button>
                        <span className="text-[10px] font-mono font-bold text-amber-700 px-1">
                          {rankPage}
                        </span>
                        <button 
                          onClick={() => setRankPage(prev => Math.min(rankTotalPages, prev + 1))}
                          disabled={rankPage >= rankTotalPages}
                          className="touch-press px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] disabled:opacity-40 hover:bg-slate-100 transition"
                        >
                          下一頁
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ranking List (20 items/page or All) */}
                <div className="space-y-2">
                  {displayRankedItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
                      <p className="font-bold text-xs text-slate-600">在此篩選條件下未找到符合之食材</p>
                      <p className="text-[10px] text-slate-400">請嘗試放寬分類複選、清除數值上下限或調整換算基準。</p>
                    </div>
                  ) : (
                    displayRankedItems.map((item, idx) => {
                      const f = item.food;
                      const meta = NUTRIENT_META_MAP[currentRankNutrient] || NUTRIENT_META_MAP.ca;
                      // 正確計算全域排名名次
                      const globalRankIndex = rankShowAll ? idx : (rankPage - 1) * rankPageSize + idx;

                      return (
                        <div 
                          key={`${f.id}_${globalRankIndex}`}
                          onClick={() => handleOpenDetail(f, item.gramsRequired)}
                          className="touch-press bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-amber-300 transition shadow-2xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            {globalRankIndex === 0 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-400 text-white font-black flex items-center justify-center text-xs shadow-xs">🥇</span>
                            ) : globalRankIndex === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-300 text-white font-black flex items-center justify-center text-xs shadow-xs">🥈</span>
                            ) : globalRankIndex === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-xs shadow-xs">🥉</span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs">{globalRankIndex + 1}</span>
                            )}
                            <span className="text-xl">{f.icon}</span>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="font-bold text-slate-800 text-xs">{f.name}</h4>
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-medium">{f.catName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                                <span>{f.kcal} kcal/百克</span>
                                {(rankDim !== 'gram' || rankCustomVal !== 100) && (
                                  <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                    需食用約 {item.gramsRequired}g
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-amber-600">{item.calculatedVal}</span>
                            <span className="text-[10px] text-slate-500 font-bold ml-0.5">{meta.unit}</span>
                            <div className="text-[9px] text-slate-400 truncate max-w-[100px]">{meta.name}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 底部翻頁條 (當項目多於一頁且非查看全部時顯示) */}
                {!rankShowAll && rankTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 pb-1 text-xs">
                    <button 
                      onClick={() => {
                        setRankPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={rankPage <= 1}
                      className="touch-press px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-30 shadow-2xs hover:bg-slate-50 transition"
                    >
                      ← 上一頁 (前20名)
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">
                      第 {rankPage} / {rankTotalPages} 頁
                    </span>
                    <button 
                      onClick={() => {
                        setRankPage(prev => Math.min(rankTotalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={rankPage >= rankTotalPages}
                      className="touch-press px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-30 shadow-2xs hover:bg-slate-50 transition"
                    >
                      下一頁 (後20名) →
                    </button>
                  </div>
                )}

                {/* 底部全清單匯出條 */}
                {allRankedItems.length > 0 && (
                  <div className="flex items-center justify-between pt-1 px-1">
                    <span className="text-[10px] text-slate-400">
                      當前條件共 {allRankedItems.length} 項食材
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={handleExportRankingCsv}
                        className="touch-press text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs"
                        title="匯出當前營養排行榜為 CSV 試算表"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                        <span>匯出排行 CSV</span>
                      </button>
                      <button
                        onClick={handleExportRankingHtml}
                        className="touch-press text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-2xs"
                        title="匯出當前營養排行榜為 HTML 報表"
                      >
                        <BookOpen className="w-3 h-3 text-amber-600" />
                        <span>匯出排行 HTML</span>
                      </button>
                    </div>
                  </div>
                )}
              </main>
            )}

            {/* SUB-TAB: COMPARE */}
            {atlasSubTab === 'compare' && (
              <main className="flex-1 p-3.5 space-y-3.5">
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                        <Scale className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-black text-slate-800">雙食材全指標 PK 對比</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const temp = { ...compSlotA };
                        setCompSlotA(compSlotB);
                        setCompSlotB(temp);
                      }}
                      className="touch-press px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 flex items-center space-x-1"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>左右對調</span>
                    </button>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex items-center justify-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                    <button 
                      onClick={() => setCompMode('custom')}
                      className={`w-1/2 py-1.5 rounded-lg transition text-center ${compMode === 'custom' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      依自訂設定份量
                    </button>
                    <button 
                      onClick={() => setCompMode('100g')}
                      className={`w-1/2 py-1.5 rounded-lg transition text-center ${compMode === '100g' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      統一每 100g 基準
                    </button>
                  </div>

                  {/* Slots Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Slot A */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor={compareSelectAId} className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">選手 A</label>
                        <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                          {compMode === '100g' ? '100g' : `${Math.round(compSlotA.grams)}g`}
                        </span>
                      </div>
                      <select 
                        id={compareSelectAId}
                        value={compSlotA.foodId}
                        onChange={(e) => setCompSlotA(prev => ({ ...prev, foodId: e.target.value }))}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 truncate"
                      >
                        {foods.map(f => (
                          <option key={f.id} value={f.id}>{f.icon} {f.name} ({f.catName})</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 truncate">
                        {compMode === '100g' ? '每 100g 基準' : compSlotA.conditionDesc}
                      </p>
                    </div>

                    {/* Slot B */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor={compareSelectBId} className="text-[10px] font-black text-amber-700 uppercase tracking-wider">選手 B</label>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                          {compMode === '100g' ? '100g' : `${Math.round(compSlotB.grams)}g`}
                        </span>
                      </div>
                      <select 
                        id={compareSelectBId}
                        value={compSlotB.foodId}
                        onChange={(e) => setCompSlotB(prev => ({ ...prev, foodId: e.target.value }))}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:border-amber-500 truncate"
                      >
                        {foods.map(f => (
                          <option key={f.id} value={f.id}>{f.icon} {f.name} ({f.catName})</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 truncate">
                        {compMode === '100g' ? '每 100g 基準' : compSlotB.conditionDesc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compare Table */}
                {foodA && foodB && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-black text-slate-700">
                      <span>資料庫全成分檢驗比較（含所有微量素）</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">綠色高亮為優勢指標</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {[
                        { label: '熱量 (Kcal)', key: 'kcal', unit: 'kcal', lowerBetter: true, dec: 0, group: '三大營養素與熱量' },
                        { label: '粗蛋白質', key: 'pro', unit: 'g', lowerBetter: false, dec: 1, group: '三大營養素與熱量' },
                        { label: '總碳水化合物', key: 'cho', unit: 'g', lowerBetter: false, dec: 1, group: '三大營養素與熱量' },
                        { label: '粗脂肪', key: 'fat', unit: 'g', lowerBetter: true, dec: 1, group: '三大營養素與熱量' },
                        { label: '膳食纖維', key: 'fiber', unit: 'g', lowerBetter: false, dec: 1, group: '三大營養素與熱量' },
                        { label: '糖質總量', key: 'sugar', unit: 'g', lowerBetter: true, dec: 1, group: '三大營養素與熱量' },
                        
                        { label: '鉀離子 (K)', key: 'k', unit: 'mg', lowerBetter: false, dec: 0, group: '臨床電解質與礦物質' },
                        { label: '磷 (P)', key: 'p', unit: 'mg', lowerBetter: true, dec: 0, group: '臨床電解質與礦物質' },
                        { label: '鈉含量 (Na)', key: 'na', unit: 'mg', lowerBetter: true, dec: 0, group: '臨床電解質與礦物質' },
                        { label: '鈣質 (Ca)', key: 'ca', unit: 'mg', lowerBetter: false, dec: 0, group: '臨床電解質與礦物質' },
                        { label: '鎂 (Mg)', key: 'mg', unit: 'mg', lowerBetter: false, dec: 0, group: '臨床電解質與礦物質' },
                        { label: '鐵質 (Fe)', key: 'fe', unit: 'mg', lowerBetter: false, dec: 1, group: '臨床電解質與礦物質' },
                        { label: '鋅 (Zn)', key: 'zn', unit: 'mg', lowerBetter: false, dec: 1, group: '臨床電解質與礦物質' },

                        { label: '水分含量 (Water)', key: 'water', unit: 'g', lowerBetter: false, dec: 1, group: '物性與脂肪酸分析' },
                        { label: '飽和脂肪酸 (SFA)', key: 'satFat', unit: 'g', lowerBetter: true, dec: 1, group: '物性與脂肪酸分析' },
                        { label: '單元不飽和脂肪 (MUFA)', key: 'mufa', unit: 'g', lowerBetter: false, dec: 1, group: '物性與脂肪酸分析' },
                        { label: '多元不飽和脂肪 (PUFA)', key: 'pufa', unit: 'g', lowerBetter: false, dec: 1, group: '物性與脂肪酸分析' },
                        { label: '膽固醇', key: 'chol', unit: 'mg', lowerBetter: true, dec: 0, group: '物性與脂肪酸分析' },

                        { label: '維生素 A 總量', key: 'vitA', unit: 'ug RAE', lowerBetter: false, dec: 0, group: '維生素群全分析' },
                        { label: '維生素 D', key: 'vitD', unit: 'ug', lowerBetter: false, dec: 2, group: '維生素群全分析' },
                        { label: '維生素 E', key: 'vitE', unit: 'mg', lowerBetter: false, dec: 1, group: '維生素群全分析' },
                        { label: '維生素 B1', key: 'vitB1', unit: 'mg', lowerBetter: false, dec: 2, group: '維生素群全分析' },
                        { label: '維生素 B2', key: 'vitB2', unit: 'mg', lowerBetter: false, dec: 2, group: '維生素群全分析' },
                        { label: '菸鹼素 (Niacin)', key: 'niacin', unit: 'mg', lowerBetter: false, dec: 2, group: '維生素群全分析' },
                        { label: '維生素 B6', key: 'vitB6', unit: 'mg', lowerBetter: false, dec: 2, group: '維生素群全分析' },
                        { label: '維生素 B12', key: 'vitB12', unit: 'ug', lowerBetter: false, dec: 2, group: '維生素群全分析' },
                        { label: '葉酸 (Folate)', key: 'folate', unit: 'mcg', lowerBetter: false, dec: 0, group: '維生素群全分析' },
                        { label: '維生素 C', key: 'vitC', unit: 'mg', lowerBetter: false, dec: 0, group: '維生素群全分析' }
                      ].map((m, idx, arr) => {
                        const ratioA = (compMode === '100g' ? 100 : compSlotA.grams) / 100;
                        const ratioB = (compMode === '100g' ? 100 : compSlotB.grams) / 100;

                        const vA = Number((((foodA[m.key as keyof FoodItem] as number) || 0) * ratioA).toFixed(m.dec));
                        const vB = Number((((foodB[m.key as keyof FoodItem] as number) || 0) * ratioB).toFixed(m.dec));

                        let aWins = false;
                        let bWins = false;
                        if (m.lowerBetter) {
                          if (vA < vB) aWins = true;
                          else if (vB < vA) bWins = true;
                        } else {
                          if (vA > vB) aWins = true;
                          else if (vB > vA) bWins = true;
                        }

                        const showGroupHeader = idx === 0 || arr[idx - 1].group !== m.group;

                        return (
                          <React.Fragment key={m.key}>
                            {showGroupHeader && (
                              <div className="px-3 py-1.5 bg-slate-100 font-black text-[10px] text-slate-600 tracking-wider">
                                🔹 {m.group}
                              </div>
                            )}
                            <div className="p-2.5 flex items-center justify-between hover:bg-slate-50/70 transition">
                              <div className={`w-28 text-left ${aWins ? 'font-black text-emerald-700' : 'text-slate-600'}`}>
                                <span>{vA}</span> <span className="text-[9px] text-slate-400">{m.unit}</span>
                                {aWins && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded ml-1 font-bold">優</span>}
                              </div>
                              <div className="flex-1 text-center font-bold text-slate-700 text-[11px] truncate">
                                {m.label}
                              </div>
                              <div className={`w-28 text-right ${bWins ? 'font-black text-amber-700' : 'text-slate-600'}`}>
                                {bWins && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded mr-1 font-bold">優</span>}
                                <span>{vB}</span> <span className="text-[9px] text-slate-400">{m.unit}</span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Similar Food Recommendations for Slot A */}
                {foodA && (
                  <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>與選手 A 相似之營養平替食材推薦</span>
                      </span>
                      <span className="text-[10px] text-slate-400">依多維營養向量契合度</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {foods
                        .filter(f => f.id !== foodA.id && f.id !== (foodB?.id || ''))
                        .sort((a, b) => Math.abs(a.kcal - foodA.kcal) - Math.abs(b.kcal - foodA.kcal))
                        .slice(0, 2)
                        .map(f => (
                          <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center space-x-2">
                            <span className="text-xl">{f.icon}</span>
                            <div className="truncate flex-1">
                              <span className="font-bold text-slate-800 text-[11px] block truncate">${f.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">${f.kcal} kcal · ${f.pro}g P</span>
                            </div>
                            <button 
                              onClick={() => setCompSlotB({ foodId: f.id, grams: 100, conditionDesc: '快速替換' })}
                              className="touch-press px-1.5 py-1 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-200"
                            >
                              選入
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </main>
            )}
          </div>
        )}

        {/* =========================================================================
            TOOL 2: 獨立臨床飲食分析評估系統 (ANALYZER)
            分成 2 部分：
            1. 飲食評估 (熱量蛋白質計算、飲食記錄、六大類代換、醣計數)
            2. 飲食分析 (飲食評估完結果加上 DRIs 分析、微量電解質監控、專科處方審核、診斷報告)
            ========================================================================= */}
        {activeTool === 'analyzer' && (
          <div className="flex-1 flex flex-col">
            {/* Analyzer Sub-Navigation (二級標籤：飲食評估 / 飲食分析) */}
            <div className="bg-white border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-slate-600 shadow-2xs">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl w-full">
                <button 
                  onClick={() => setAnalyzerSubTab('assessment')}
                  className={`w-1/2 py-2 rounded-lg transition text-center flex items-center justify-center space-x-1.5 ${
                    analyzerSubTab === 'assessment' 
                      ? 'bg-white text-emerald-800 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                  <span>1. 飲食評估 (記錄/熱量蛋白)</span>
                </button>
                <button 
                  onClick={() => setAnalyzerSubTab('analysis')}
                  className={`w-1/2 py-2 rounded-lg transition text-center flex items-center justify-center space-x-1.5 ${
                    analyzerSubTab === 'analysis' 
                      ? 'bg-white text-emerald-800 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. 飲食分析 (+ DRIs 分析)</span>
                </button>
              </div>
            </div>

            {/* =====================================================================
                PART 1: 飲食評估 (熱量蛋白質計算、飲食記錄、六大類代換、醣計數)
                ===================================================================== */}
            {analyzerSubTab === 'assessment' && (
              <main className="flex-1 p-3.5 space-y-3.5">
                {/* 飲食評估頂部資訊卡 */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-emerald-700" />
                        <span>飲食評估 (Diet Assessment)</span>
                      </h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        處方：{clinicalGoals.config.name} ({clinicalGoals.config.badge}) · 目標 {clinicalGoals.targetKcal} kcal · PRO {clinicalGoals.targetProG}g
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 flex-wrap">
                      {analysisBasket.length > 0 && (
                        <>
                          <button 
                            onClick={handleExportAssessmentCsv}
                            className="touch-press text-[10px] text-emerald-800 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1 transition shadow-2xs"
                            title="匯出飲食記錄與評估計算為 CSV 試算表"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                            <span>匯出 CSV</span>
                          </button>
                          <button 
                            onClick={handleExportAssessmentHtml}
                            className="touch-press text-[10px] text-emerald-800 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1 transition shadow-2xs"
                            title="匯出飲食評估與六大類代換為 HTML 臨床報告單 (支援列印與PDF)"
                          >
                            <BookOpen className="w-3 h-3 text-emerald-700" />
                            <span>匯出 HTML</span>
                          </button>
                          <button 
                            onClick={handleExportDietPlanReport}
                            className="touch-press text-[10px] text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition shadow-2xs"
                            title="匯出臨床飲食處方評估摘要單 (TXT 格式)"
                          >
                            <Download className="w-3 h-3 text-slate-600" />
                            <span>處方單</span>
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setActiveTool('atlas'); setAtlasSubTab('search'); }}
                        className="touch-press text-[10px] text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>加食材</span>
                      </button>
                      {analysisBasket.length > 0 && (
                        <button 
                          onClick={() => setAnalysisBasket([])}
                          className="touch-press text-[10px] text-red-600 hover:text-red-700 font-bold bg-red-50 px-2 py-1.5 rounded-lg border border-red-200 transition"
                        >
                          清空
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 餐別篩選列 */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                      {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(m => (
                        <button 
                          key={m}
                          onClick={() => setSelectedMealFilter(m)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex-shrink-0 ${
                            selectedMealFilter === m 
                              ? 'bg-slate-900 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {m === 'all' && `全部 (${analysisBasket.length})`}
                          {m === 'breakfast' && '早餐'}
                          {m === 'lunch' && '午餐'}
                          {m === 'dinner' && '晚餐'}
                          {m === 'snack' && '點心'}
                        </button>
                      ))}
                    </div>
                    
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 ml-1">
                      {filteredBasketItems.length} 項餐食
                    </span>
                  </div>
                </div>

                {/* 飲食記錄清單 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      <span>飲食記錄清單</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      點擊 +/- 或輸入克數可微調份量
                    </span>
                  </div>

                  {filteredBasketItems.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 space-y-2">
                      <PieChart className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-xs text-slate-600">
                        {selectedMealFilter === 'all' ? '目前飲食記錄為空' : '此餐別尚未加入餐食記錄'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        可切換至「台灣食材營養寶典」挑選食材，或點擊下方按鈕前往選取。
                      </p>
                      <button 
                        onClick={() => { setActiveTool('atlas'); setAtlasSubTab('search'); }}
                        className="touch-press mt-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>前往食材寶典挑選食材</span>
                      </button>
                    </div>
                  ) : (
                    filteredBasketItems.map((b) => {
                      const f = b.food;
                      const ratio = (b.portionGrams || 100) / 100;
                      const cal = Math.round(f.kcal * ratio);
                      const p = (f.pro * ratio).toFixed(1);
                      const c = (f.cho * ratio).toFixed(1);
                      const fatVal = (f.fat * ratio).toFixed(1);
                      const six = estimateSixFoodPortions(f, b.portionGrams || 100);
                      const mealLabel = b.mealType === 'breakfast' ? '早餐' : b.mealType === 'lunch' ? '午餐' : b.mealType === 'dinner' ? '晚餐' : '點心';

                      const oilGrams = Math.max(0, Number(b.cookingOilGrams) || 0);
                      const oilProf = getCookingOilProfile(b.cookingOilName);
                      const oilCal = Math.round(oilProf.kcal * (oilGrams / 100));
                      const oilFat = Number((oilProf.fat * (oilGrams / 100)).toFixed(1));
                      const totalItemCal = cal + oilCal;
                      const totalItemFat = (Number(fatVal) + oilFat).toFixed(1);
                      const totalOilExchanges = Number((six.oils + (oilGrams / 5)).toFixed(1));

                      return (
                        <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                              <span className="text-2xl flex-shrink-0">{f.icon}</span>
                              <div className="truncate">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                                    {mealLabel}
                                  </span>
                                  <h4 className="font-bold text-slate-800 text-xs truncate">{f.name}</h4>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-slate-800">{totalItemCal} kcal</span>
                                  {oilCal > 0 && <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-bold font-mono">含油+{oilCal}k</span>}
                                  <span>· P: {p}g</span>
                                  <span>· C: {c}g</span>
                                  <span>· F: {totalItemFat}g</span>
                                  <span className="text-slate-400">· K: {Math.round(f.k * ratio)}mg</span>
                                  <span className="text-slate-400">· P: {Math.round(f.p * ratio)}mg</span>
                                </div>
                                {/* 國健署份數標籤 */}
                                <div className="flex flex-wrap items-center gap-1 text-[9px] text-emerald-800 font-semibold mt-1">
                                  {six.cereals > 0 && <span>全穀 {six.cereals}份</span>}
                                  {six.proteins > 0 && <span>豆魚蛋肉 {six.proteins}份</span>}
                                  {six.dairy > 0 && <span>乳品 {six.dairy}份</span>}
                                  {six.vegetables > 0 && <span>蔬菜 {six.vegetables}份</span>}
                                  {six.fruits > 0 && <span>水果 {six.fruits}份</span>}
                                  {totalOilExchanges > 0 && (
                                    <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1 rounded">
                                      油脂 {totalOilExchanges}份
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                                <button 
                                  onClick={() => {
                                    const next = [...analysisBasket];
                                    const found = next.find(item => item.id === b.id);
                                    if (found) {
                                      found.portionGrams = Math.max(5, Math.round(found.portionGrams - 25));
                                      setAnalysisBasket([...next]);
                                    }
                                  }}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shadow-2xs transition"
                                >
                                  -
                                </button>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    step="any"
                                    value={b.portionGrams}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      const next = [...analysisBasket];
                                      const found = next.find(item => item.id === b.id);
                                      if (found) {
                                        found.portionGrams = !isNaN(val) && val > 0 ? Math.round(val * 10) / 10 : 100;
                                        setAnalysisBasket([...next]);
                                      }
                                    }}
                                    className="w-14 text-center font-black font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500 ml-1 mr-0.5">g</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const next = [...analysisBasket];
                                    const found = next.find(item => item.id === b.id);
                                    if (found) {
                                      found.portionGrams = Math.round(found.portionGrams + 25);
                                      setAnalysisBasket([...next]);
                                    }
                                  }}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shadow-2xs transition"
                                >
                                  +
                                </button>
                              </div>
                              <button 
                                onClick={() => {
                                  setAnalysisBasket(prev => prev.filter(item => item.id !== b.id));
                                }}
                                className="text-slate-300 hover:text-red-500 p-1 transition"
                                title="刪除此食材"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 烹調用油控制列 (油品下拉選單 + 填寫油量空格) */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] bg-slate-50/80 -mx-3 -mb-3 p-2.5 rounded-b-2xl">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-bold text-amber-900 flex items-center gap-0.5 text-[10px]">
                                <span>🫒</span>
                                <span>烹調用油:</span>
                              </span>
                              {/* 選擇油脂選單 */}
                              <select
                                value={b.cookingOilName || '無用油 / 不額外加油'}
                                onChange={(e) => {
                                  const next = [...analysisBasket];
                                  const found = next.find(item => item.id === b.id);
                                  if (found) {
                                    found.cookingOilName = e.target.value;
                                    if (found.cookingOilName.includes('無用油') || found.cookingOilName.includes('不額外加油')) {
                                      found.cookingOilGrams = 0;
                                    } else if (!found.cookingOilGrams || found.cookingOilGrams === 0) {
                                      found.cookingOilGrams = 5; // 預設 1 茶匙 (5g)
                                    }
                                    setAnalysisBasket([...next]);
                                  }
                                }}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-amber-500 max-w-[135px] truncate cursor-pointer shadow-2xs"
                              >
                                {COOKING_OIL_OPTIONS.map(oil => (
                                  <option key={oil.id} value={oil.name}>
                                    {oil.icon} {oil.name}
                                  </option>
                                ))}
                              </select>

                              {/* 填寫用油量空格 */}
                              <div className="flex items-center space-x-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  value={b.cookingOilGrams ?? 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    const next = [...analysisBasket];
                                    const found = next.find(item => item.id === b.id);
                                    if (found) {
                                      const g = !isNaN(val) && val >= 0 ? Math.round(val * 10) / 10 : 0;
                                      found.cookingOilGrams = g;
                                      if (g === 0) {
                                        found.cookingOilName = '無用油 / 不額外加油';
                                      } else if (!found.cookingOilName || found.cookingOilName.includes('無用油') || found.cookingOilName.includes('不額外加油')) {
                                        found.cookingOilName = '橄欖油 (高單元不飽和 MUFA)';
                                      }
                                      setAnalysisBasket([...next]);
                                    }
                                  }}
                                  className="w-10 text-center font-black font-mono text-[10px] text-slate-800 bg-transparent outline-none"
                                />
                                <span className="text-[9px] font-bold text-slate-500">g</span>
                              </div>
                            </div>

                            {oilGrams > 0 ? (
                              <span className="text-[9px] text-amber-800 bg-amber-100/80 border border-amber-300 font-mono font-bold px-1.5 py-0.2 rounded">
                                +{oilCal} kcal (約 {(oilGrams / 5).toFixed(1)} 份油脂)
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-mono">
                                無用油
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 熱量蛋白質即時計算與宏量平衡卡片 */}
                {analysisBasket.length > 0 && (
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span>熱量與蛋白質目標計算 (目前評估)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {selectedMealFilter === 'all' ? '全日記錄' : `${selectedMealFilter === 'breakfast' ? '早餐' : selectedMealFilter === 'lunch' ? '午餐' : selectedMealFilter === 'dinner' ? '晚餐' : '點心'}`}
                      </span>
                    </div>

                    {/* 熱量達成與差距 */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-slate-700">總熱量攝取</span>
                        <span className="font-mono text-emerald-700">
                          {Math.round(basketAnalysis.totals.kcal)} / {clinicalGoals.targetKcal} kcal
                          <span className="ml-1 text-[10px] font-normal text-slate-500">
                            ({Math.round((basketAnalysis.totals.kcal / clinicalGoals.targetKcal) * 100)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (basketAnalysis.totals.kcal / clinicalGoals.targetKcal) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>
                          差距：
                          {basketAnalysis.totals.kcal >= clinicalGoals.targetKcal ? (
                            <span className="text-amber-700 font-bold ml-0.5">超出 +{Math.round(basketAnalysis.totals.kcal - clinicalGoals.targetKcal)} kcal</span>
                          ) : (
                            <span className="text-slate-600 font-bold ml-0.5">尚差 -{Math.round(clinicalGoals.targetKcal - basketAnalysis.totals.kcal)} kcal</span>
                          )}
                        </span>
                        <span>處方建議：{clinicalGoals.kcalPerKg} kcal/kg/day</span>
                      </div>
                    </div>

                    {/* 蛋白質達成與體重換算 */}
                    <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200 space-y-1.5">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-blue-900">蛋白質攝取量</span>
                        <span className="font-mono text-blue-700">
                          {basketAnalysis.totals.pro.toFixed(1)} / {clinicalGoals.targetProG} g
                          <span className="ml-1 text-[10px] font-normal text-blue-600">
                            ({Math.round((basketAnalysis.totals.pro / clinicalGoals.targetProG) * 100)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (basketAnalysis.totals.pro / clinicalGoals.targetProG) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-blue-800">
                        <span>
                          實際負荷：
                          <span className="font-black font-mono ml-0.5">
                            {(basketAnalysis.totals.pro / (userProfile.weightKg || 55)).toFixed(2)} g/kg/day
                          </span>
                        </span>
                        <span>處方目標：{clinicalGoals.proPerKg} g/kg/day</span>
                      </div>
                    </div>

                    {/* 三大營養素宏量熱量分佈比例 */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>三大營養素供能平衡比例</span>
                        <span>處方目標: P {clinicalGoals.config.macroRatio.pro[0]}-{clinicalGoals.config.macroRatio.pro[1]}% · F {clinicalGoals.config.macroRatio.fat[0]}-{clinicalGoals.config.macroRatio.fat[1]}% · C {clinicalGoals.config.macroRatio.cho[0]}-{clinicalGoals.config.macroRatio.cho[1]}%</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-blue-700">蛋白質 (PRO)：{Math.round(basketAnalysis.totals.pro)}g ({basketAnalysis.proPct}%)</span>
                            <span className="text-slate-400">標準 {clinicalGoals.config.macroRatio.pro[0]}-{clinicalGoals.config.macroRatio.pro[1]}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (basketAnalysis.totals.pro / clinicalGoals.targetProG) * 100)}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-purple-700">脂肪 (FAT)：{Math.round(basketAnalysis.totals.fat)}g ({basketAnalysis.fatPct}%)</span>
                            <span className="text-slate-400">標準 20-30%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, basketAnalysis.fatPct * 2.5)}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-emerald-700">碳水化合物 (CHO)：{Math.round(basketAnalysis.totals.cho)}g ({basketAnalysis.choPct}%)</span>
                            <span className="text-slate-400">標準 50-60%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, basketAnalysis.choPct * 1.5)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 國健署六大類食物代換份數與醣類計數卡片 */}
                {analysisBasket.length > 0 && (
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Apple className="w-4 h-4 text-emerald-600" />
                        <span>國健署「六大類食物代換份數」與醣計數</span>
                      </span>
                      <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                        約 {basketAnalysis.carbExchanges} 份醣 (Carb Ex.)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2">
                        <div className="text-[10px] text-amber-800 font-bold">全穀雜糧類</div>
                        <div className="text-base font-black text-amber-950 mt-0.5">{basketAnalysis.sixGroups.cereals}</div>
                        <div className="text-[9px] text-amber-700">份 (15g醣/份)</div>
                      </div>
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2">
                        <div className="text-[10px] text-blue-800 font-bold">豆魚蛋肉類</div>
                        <div className="text-base font-black text-blue-950 mt-0.5">{basketAnalysis.sixGroups.proteins}</div>
                        <div className="text-[9px] text-blue-700">份 (7g蛋白/份)</div>
                      </div>
                      <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2">
                        <div className="text-[10px] text-indigo-800 font-bold">乳品類</div>
                        <div className="text-base font-black text-indigo-950 mt-0.5">{basketAnalysis.sixGroups.dairy}</div>
                        <div className="text-[9px] text-indigo-700">份 (240ml/份)</div>
                      </div>
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2">
                        <div className="text-[10px] text-emerald-800 font-bold">蔬菜類</div>
                        <div className="text-base font-black text-emerald-950 mt-0.5">{basketAnalysis.sixGroups.vegetables}</div>
                        <div className="text-[9px] text-emerald-700">份 (100g熟菜/份)</div>
                      </div>
                      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2">
                        <div className="text-[10px] text-rose-800 font-bold">水果類</div>
                        <div className="text-base font-black text-rose-950 mt-0.5">{basketAnalysis.sixGroups.fruits}</div>
                        <div className="text-[9px] text-rose-700">份 (15g醣/份)</div>
                      </div>
                      <div className="bg-amber-100/60 border border-amber-300 rounded-xl p-2">
                        <div className="text-[10px] text-amber-900 font-bold">油脂與堅果</div>
                        <div className="text-base font-black text-amber-950 mt-0.5">{basketAnalysis.sixGroups.oils}</div>
                        <div className="text-[9px] text-amber-800">份 (5g脂/份)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 飲食評估完成 -> 匯出試算表/報告 或 前往飲食分析與 DRIs 流程按鈕 */}
                {analysisBasket.length > 0 && (
                  <div className="pt-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={handleExportAssessmentCsv}
                        className="touch-press py-2.5 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition"
                        title="匯出飲食記錄與六大類代換、營養計算為 CSV 試算表"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>匯出 CSV</span>
                      </button>
                      <button 
                        onClick={handleExportAssessmentHtml}
                        className="touch-press py-2.5 px-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition"
                        title="匯出飲食評估與六大類代換為 HTML 臨床報告單"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>匯出 HTML</span>
                      </button>
                      <button 
                        onClick={handleExportDietPlanReport}
                        className="touch-press py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition"
                        title="匯出臨床飲食處方評估摘要單 (TXT 格式)"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>處方單 TXT</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        setAnalyzerSubTab('analysis');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="touch-press w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 transition"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>完成飲食評估，進行 DRIs 深入飲食分析</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </main>
            )}

            {/* =====================================================================
                PART 2: 飲食分析 (飲食評估結果加上 DRIs 分析、微量電解質、專科處方、診斷報告)
                ===================================================================== */}
            {analyzerSubTab === 'analysis' && (
              <main className="flex-1 p-3.5 space-y-3.5">
                {/* 飲食評估結果摘要看板 */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 shadow-md border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span>飲食分析與 DRIs 達成率報告</span>
                        </h2>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                          {clinicalGoals.config.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        個案：{userProfile.gender === 'female' ? '女性' : '男性'} / {userProfile.ageGroup}歲 / {userProfile.heightCm}cm / {userProfile.weightKg}kg (IBW {clinicalGoals.ibw}kg)
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <button 
                        onClick={handleExportAssessmentCsv}
                        disabled={analysisBasket.length === 0}
                        className="touch-press disabled:opacity-40 text-[10px] text-emerald-300 hover:text-white font-bold bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg border border-white/20 flex items-center gap-1 transition shadow-2xs"
                        title="匯出飲食記錄與 DRIs 全項分析報表為 CSV 試算表 (相容 Excel)"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        <span>匯出 CSV</span>
                      </button>
                      <button 
                        onClick={handleExportAssessmentHtml}
                        disabled={analysisBasket.length === 0}
                        className="touch-press disabled:opacity-40 text-[10px] text-teal-300 hover:text-white font-bold bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg border border-white/20 flex items-center gap-1 transition shadow-2xs"
                        title="匯出飲食分析與 DRIs 全項為 HTML 臨床分析報表 (支援列印)"
                      >
                        <BookOpen className="w-3 h-3 text-teal-400" />
                        <span>匯出 HTML</span>
                      </button>
                      <button 
                        onClick={handleExportDietPlanReport}
                        disabled={analysisBasket.length === 0}
                        className="touch-press disabled:opacity-40 text-[10px] text-slate-300 hover:text-white font-bold bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg border border-white/20 flex items-center gap-1 transition shadow-2xs"
                        title="匯出專業臨床飲食處方評估摘要單 (TXT 格式)"
                      >
                        <Download className="w-3 h-3" />
                        <span>處方單</span>
                      </button>
                    </div>
                  </div>

                  {/* 飲食評估成果快速摘要網格 */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1 border-t border-slate-700/60">
                    <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                      <div className="text-[9px] text-slate-400">總熱量攝取</div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5 font-mono">
                        {Math.round(wholeDayAnalysis.totals.kcal)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        目標 {clinicalGoals.targetKcal}k
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                      <div className="text-[9px] text-slate-400">粗蛋白質</div>
                      <div className="text-sm font-black text-blue-400 mt-0.5 font-mono">
                        {wholeDayAnalysis.totals.pro.toFixed(1)}g
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        {wholeDayAnalysis.proPct}% 供能比
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                      <div className="text-[9px] text-slate-400">碳水 / 醣代換</div>
                      <div className="text-sm font-black text-amber-400 mt-0.5 font-mono">
                        {wholeDayAnalysis.carbExchanges} 份
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        CHO {Math.round(wholeDayAnalysis.totals.cho)}g
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                      <div className="text-[9px] text-slate-400">評估食材品項</div>
                      <div className="text-sm font-black text-white mt-0.5 font-mono">
                        {analysisBasket.length} 項
                      </div>
                      <div className="text-[9px] text-slate-400">
                        涵蓋全餐別
                      </div>
                    </div>
                  </div>

                  {/* 返回修改捷徑 */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>基於已記錄的餐食進行衛福部 DRIs 第 8 版標準深度比對</span>
                    <button 
                      onClick={() => setAnalyzerSubTab('assessment')}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-0.5"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>返回飲食評估修改</span>
                    </button>
                  </div>
                </div>

                {/* DRIs 達成率與微量電解質分析卡片 (涵蓋 DRIs 所有營養素項目) */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <span>衛福部 DRIs 第 8 版全營養素達成率檢測</span>
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          RDA / AI / UL / CDRR 全項
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        個案基準：{userProfile.gender === 'female' ? '女性' : '男性'} {userProfile.ageGroup} 歲基準 · {clinicalGoals.config.name}
                      </p>
                    </div>

                    {/* DRIs 分類切換按鈕 */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                      <button 
                        onClick={() => setDriCategoryFilter('all')}
                        className={`touch-press px-2 py-1 rounded-lg transition ${driCategoryFilter === 'all' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        全部 (25項)
                      </button>
                      <button 
                        onClick={() => setDriCategoryFilter('macro')}
                        className={`touch-press px-2 py-1 rounded-lg transition ${driCategoryFilter === 'macro' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        熱量巨量 (7)
                      </button>
                      <button 
                        onClick={() => setDriCategoryFilter('mineral')}
                        className={`touch-press px-2 py-1 rounded-lg transition ${driCategoryFilter === 'mineral' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        礦物電解 (9)
                      </button>
                      <button 
                        onClick={() => setDriCategoryFilter('vitamin')}
                        className={`touch-press px-2 py-1 rounded-lg transition ${driCategoryFilter === 'vitamin' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        維生素群 (9)
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const allDriItems = [
                      // --- 能量與巨量營養素 ---
                      {
                        id: 'eer',
                        label: '熱量需求 (EER)',
                        current: Math.round(wholeDayAnalysis.totals.kcal),
                        target: activeDriStandard.eer,
                        unit: 'kcal',
                        isUl: false,
                        category: 'macro' as const,
                        desc: '每日能量總消耗平衡 (EER)'
                      },
                      {
                        id: 'pro',
                        label: '蛋白質 (Protein RDA)',
                        current: Number(wholeDayAnalysis.totals.pro.toFixed(1)),
                        target: activeDriStandard.pro,
                        unit: 'g',
                        isUl: false,
                        category: 'macro' as const,
                        desc: `處方特定目標 ${clinicalGoals.targetProG}g (${clinicalGoals.proPerKg}g/kg)`
                      },
                      {
                        id: 'cho',
                        label: '總碳水化合物 (Carbohydrate)',
                        current: Math.round(wholeDayAnalysis.totals.cho),
                        target: activeDriStandard.cho || 130,
                        unit: 'g',
                        isUl: false,
                        category: 'macro' as const,
                        desc: `最低建議 130g · 供能比 ${wholeDayAnalysis.choPct}% (${wholeDayAnalysis.carbExchanges} 份醣)`
                      },
                      {
                        id: 'fat',
                        label: '粗脂肪 (Lipid / Fat)',
                        current: Number(wholeDayAnalysis.totals.fat.toFixed(1)),
                        target: activeDriStandard.fat || Math.round((activeDriStandard.eer * 0.25) / 9),
                        unit: 'g',
                        isUl: false,
                        category: 'macro' as const,
                        desc: `供能比 ${wholeDayAnalysis.fatPct}% (DRIs 建議 20~30%)`
                      },
                      {
                        id: 'satFat',
                        label: '飽和脂肪上限 (Sat Fat UL)',
                        current: Number(wholeDayAnalysis.totals.satFat.toFixed(1)),
                        target: activeDriStandard.satFatUl || Number(((activeDriStandard.eer * 0.1) / 9).toFixed(1)),
                        unit: 'g',
                        isUl: true,
                        category: 'macro' as const,
                        desc: '心血管健康與得舒處方控管 (< 10% 總熱量)'
                      },
                      {
                        id: 'fiber',
                        label: '膳食纖維 (Fiber AI)',
                        current: Number(wholeDayAnalysis.totals.fiber.toFixed(1)),
                        target: activeDriStandard.fiber,
                        unit: 'g',
                        isUl: false,
                        category: 'macro' as const,
                        desc: '腸道益生菌平衡、排便順暢與延緩餐後血糖'
                      },
                      {
                        id: 'water',
                        label: '水分需求目安 (Water AI)',
                        current: Math.round(wholeDayAnalysis.totals.water),
                        target: activeDriStandard.water || Math.round((userProfile.weightKg || 60) * 32),
                        unit: 'mL',
                        isUl: false,
                        category: 'macro' as const,
                        desc: '維持血漿滲透壓、體溫調節與代謝廢物排泄'
                      },

                      // --- 巨量礦物質與電解質 ---
                      {
                        id: 'na',
                        label: '鈉攝取上限 (Na Limit / CDRR)',
                        current: Math.round(wholeDayAnalysis.totals.na),
                        target: clinicalGoals.config.naLimitMg,
                        unit: 'mg',
                        isUl: true,
                        category: 'mineral' as const,
                        desc: '高血壓、心血管疾病、腹水與水腫警戒值'
                      },
                      {
                        id: 'k',
                        label: '鉀離子 (Potassium AI)',
                        current: Math.round(wholeDayAnalysis.totals.k),
                        target: activeDriStandard.k,
                        unit: 'mg',
                        isUl: !!clinicalGoals.config.kLimitMg,
                        category: 'mineral' as const,
                        desc: clinicalGoals.config.kLimitMg ? '慢性腎病嚴格限鉀 (< 2000mg)' : '得舒飲食高鉀促進排鈉平穩血壓'
                      },
                      {
                        id: 'p',
                        label: '磷 (Phosphorus RDA)',
                        current: Math.round(wholeDayAnalysis.totals.p),
                        target: activeDriStandard.p,
                        unit: 'mg',
                        isUl: !!clinicalGoals.config.pLimitMg,
                        category: 'mineral' as const,
                        desc: clinicalGoals.config.pLimitMg ? '腎病限磷預防副甲狀腺機能亢進' : '骨骼晶格與高能磷酸鍵 ATP 構成'
                      },
                      {
                        id: 'ca',
                        label: '鈣質 (Calcium RDA)',
                        current: Math.round(wholeDayAnalysis.totals.ca),
                        target: activeDriStandard.ca,
                        unit: 'mg',
                        isUl: false,
                        category: 'mineral' as const,
                        desc: '骨質密度強化、肌漿網鈣離子傳遞與神經衝動'
                      },
                      {
                        id: 'mg',
                        label: '鎂 (Magnesium RDA)',
                        current: Math.round(wholeDayAnalysis.totals.mg),
                        target: activeDriStandard.mg,
                        unit: 'mg',
                        isUl: false,
                        category: 'mineral' as const,
                        desc: '300+ 種能量酵素輔因子、安神助眠與肌肉放鬆'
                      },

                      // --- 微量礦物質 ---
                      {
                        id: 'fe',
                        label: '鐵質 (Iron RDA)',
                        current: Number(wholeDayAnalysis.totals.fe.toFixed(1)),
                        target: activeDriStandard.fe,
                        unit: 'mg',
                        isUl: false,
                        category: 'mineral' as const,
                        desc: '血紅素合成、紅血球攜氧與肌紅蛋白儲氧'
                      },
                      {
                        id: 'zn',
                        label: '鋅 (Zinc RDA)',
                        current: Number(wholeDayAnalysis.totals.zn.toFixed(1)),
                        target: activeDriStandard.zn,
                        unit: 'mg',
                        isUl: false,
                        category: 'mineral' as const,
                        desc: '胸腺免疫淋巴細胞成熟、傷口癒合與味覺敏感'
                      },
                      {
                        id: 'cu',
                        label: '銅 (Copper RDA)',
                        current: Number(wholeDayAnalysis.totals.cu.toFixed(2)),
                        target: activeDriStandard.cu,
                        unit: 'mg',
                        isUl: false,
                        category: 'mineral' as const,
                        desc: '藍胞漿素造血酵素輔因子與膠原蛋白交聯'
                      },
                      {
                        id: 'mn',
                        label: '錳 (Manganese AI)',
                        current: Number(wholeDayAnalysis.totals.mn.toFixed(2)),
                        target: activeDriStandard.mn,
                        unit: 'mg',
                        isUl: false,
                        category: 'mineral' as const,
                        desc: '粒線體 Mn-SOD 超氧化物歧化酶與軟骨醣蛋白合成'
                      },

                      // --- 脂溶性維生素 ---
                      {
                        id: 'vitA',
                        label: '維生素 A (Vit A RDA)',
                        current: Math.round(wholeDayAnalysis.totals.vitA),
                        target: activeDriStandard.vitA,
                        unit: 'ug RAE',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: '視紫質夜間感光與呼吸道腸道黏膜上皮屏障'
                      },
                      {
                        id: 'vitD',
                        label: '維生素 D (Vit D AI)',
                        current: Number(wholeDayAnalysis.totals.vitD.toFixed(1)),
                        target: activeDriStandard.vitD,
                        unit: 'ug',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: '活化鈣結合蛋白促進小腸鈣吸收、骨礦化'
                      },
                      {
                        id: 'vitE',
                        label: '維生素 E (Vit E AI)',
                        current: Number(wholeDayAnalysis.totals.vitE.toFixed(1)),
                        target: activeDriStandard.vitE,
                        unit: 'mg',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: '細胞膜脂質雙層抗自由基過氧化關鍵保護'
                      },

                      // --- 水溶性維生素 ---
                      {
                        id: 'vitC',
                        label: '維生素 C (Vit C RDA)',
                        current: Math.round(wholeDayAnalysis.totals.vitC),
                        target: activeDriStandard.vitC,
                        unit: 'mg',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: '抗壞血酸水溶性抗氧化還原劑與膠原蛋白合成'
                      },
                      {
                        id: 'vitB1',
                        label: '維生素 B1 (硫胺素 RDA)',
                        current: Number(wholeDayAnalysis.totals.vitB1.toFixed(2)),
                        target: activeDriStandard.vitB1,
                        unit: 'mg',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: 'TPP 輔酶碳水化合物去羧氧化與神經能量代謝'
                      },
                      {
                        id: 'vitB2',
                        label: '維生素 B2 (核黃素 RDA)',
                        current: Number(wholeDayAnalysis.totals.vitB2.toFixed(2)),
                        target: activeDriStandard.vitB2,
                        unit: 'mg',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: 'FAD/FMN 電子傳遞呼吸鏈與皮膚黏膜完整性'
                      },
                      {
                        id: 'niacin',
                        label: '菸鹼素 (Niacin RDA)',
                        current: Number(wholeDayAnalysis.totals.niacin.toFixed(1)),
                        target: activeDriStandard.niacin,
                        unit: 'mg NE',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: 'NAD/NADP 輔酶三大營養素分解產能與 DNA 修復'
                      },
                      {
                        id: 'vitB6',
                        label: '維生素 B6 (吡哆醇 RDA)',
                        current: Number(wholeDayAnalysis.totals.vitB6.toFixed(2)),
                        target: activeDriStandard.vitB6,
                        unit: 'mg',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: 'PLP 輔酶胺基酸轉胺作用與血紅素前驅物合成'
                      },
                      {
                        id: 'vitB12',
                        label: '維生素 B12 (鈷胺素 RDA)',
                        current: Number(wholeDayAnalysis.totals.vitB12.toFixed(2)),
                        target: activeDriStandard.vitB12,
                        unit: 'ug',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: '紅血球分裂成熟、預防惡性貧血與維持神經髓鞘'
                      },
                      {
                        id: 'folate',
                        label: '葉酸 (Folate RDA)',
                        current: Math.round(wholeDayAnalysis.totals.folate),
                        target: activeDriStandard.folate,
                        unit: 'mcg',
                        isUl: false,
                        category: 'vitamin' as const,
                        desc: '單碳四氫葉酸嘌呤合成、胚胎神經管健全發育'
                      }
                    ];

                    const filteredItems = driCategoryFilter === 'all' 
                      ? allDriItems 
                      : allDriItems.filter(item => item.category === driCategoryFilter);

                    // 統計各項達成狀態
                    let normalAchieved = 0;
                    let normalShort = 0;
                    let ulWarn = 0;

                    allDriItems.forEach(r => {
                      if (r.isUl) {
                        if (r.current > r.target) ulWarn++;
                      } else {
                        const pct = Math.round((r.current / r.target) * 100);
                        if (pct >= 85) normalAchieved++;
                        else normalShort++;
                      }
                    });

                    return (
                      <div className="space-y-3 pt-0.5">
                        {/* 達成率概況指標條 */}
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400">總檢測指標</span>
                            <div className="text-xs font-black text-slate-800 font-mono mt-0.5">{allDriItems.length} 項</div>
                          </div>
                          <div>
                            <span className="text-emerald-600 font-bold">充足達標</span>
                            <div className="text-xs font-black text-emerald-700 font-mono mt-0.5">{normalAchieved} 項</div>
                          </div>
                          <div>
                            <span className="text-amber-600 font-bold">尚待補強</span>
                            <div className="text-xs font-black text-amber-700 font-mono mt-0.5">{normalShort} 項</div>
                          </div>
                          <div>
                            <span className="text-red-600 font-bold">超標警戒</span>
                            <div className="text-xs font-black text-red-700 font-mono mt-0.5">{ulWarn} 項</div>
                          </div>
                        </div>

                        {/* DRIs 指標細項列表 */}
                        <div className="space-y-2">
                          {filteredItems.map(r => {
                            const pct = Math.round((r.current / (r.target || 1)) * 100);
                            let barColor = 'bg-emerald-500';
                            let statusText = '適量達標';
                            let statusBadge = 'text-emerald-700 bg-emerald-50 border border-emerald-200';

                            if (r.isUl) {
                              if (r.current > r.target) {
                                barColor = 'bg-red-500';
                                statusText = '超標警示';
                                statusBadge = 'text-red-700 bg-red-50 font-black border border-red-200';
                              } else {
                                barColor = 'bg-slate-400';
                                statusText = '安全門檻內';
                                statusBadge = 'text-slate-600 bg-slate-100 border border-slate-200';
                              }
                            } else {
                              if (pct < 70) {
                                barColor = 'bg-amber-400';
                                statusText = '明顯不足';
                                statusBadge = 'text-amber-800 bg-amber-50 border border-amber-200';
                              } else if (pct < 85) {
                                barColor = 'bg-amber-300';
                                statusText = '稍偏低';
                                statusBadge = 'text-amber-700 bg-amber-50 border border-amber-100';
                              } else if (pct > 140) {
                                barColor = 'bg-blue-500';
                                statusText = '充沛超量';
                                statusBadge = 'text-blue-700 bg-blue-50 border border-blue-200';
                              } else {
                                barColor = 'bg-emerald-500';
                                statusText = '理想達標';
                                statusBadge = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
                              }
                            }

                            return (
                              <div key={r.id} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 hover:bg-white transition-colors">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-slate-900">{r.label}</span>
                                    <span className="text-[9px] text-slate-400 font-normal">({r.desc})</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${statusBadge}`}>
                                      {statusText}
                                    </span>
                                    <span className="font-mono text-xs font-black text-slate-800">
                                      {pct}%
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`${barColor} h-full rounded-full transition-all duration-300`} 
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  ></div>
                                </div>

                                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                  <span>目前攝取：<strong className="text-slate-800">{r.current}</strong> {r.unit}</span>
                                  <span>DRIs 目標：<strong className="text-slate-800">{r.target}</strong> {r.unit}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 臨床專科處方安全與合規審核卡片 */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>專科處方合規檢核 ({clinicalGoals.config.name})</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      臨床醫學準則
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {userProfile.clinicalDietType === 'ckd' && (
                      <div className="space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>慢性腎病 3-5 期控管要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          當前蛋白質負荷：{(wholeDayAnalysis.totals.pro / (userProfile.weightKg || 55)).toFixed(2)} g/kg/day (目標 0.6-0.8 g/kg)。
                          磷攝取量：{Math.round(wholeDayAnalysis.totals.p)} mg {wholeDayAnalysis.totals.p > 800 ? '⚠️ 超出 800mg 限磷標準' : '✅ 符合限磷安全門檻'}。
                          鉀攝取量：{Math.round(wholeDayAnalysis.totals.k)} mg {wholeDayAnalysis.totals.k > 2000 ? '⚠️ 超出 2000mg 限鉀標準' : '✅ 鉀離子安全'}。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'diabetes' && (
                      <div className="space-y-1">
                        <div className="font-bold text-blue-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                          <span>糖尿病醫學營養控管要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          全日醣類代換總量：{wholeDayAnalysis.carbExchanges} 份醣 (CHO {Math.round(wholeDayAnalysis.totals.cho)}g，供能比 {wholeDayAnalysis.choPct}%)。
                          膳食纖維：{wholeDayAnalysis.totals.fiber.toFixed(1)}g (建議 &gt; 25g 以延緩餐後血糖飆升)。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'athleteStrength' && (
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                          <span>肌力阻力運動員修復要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          蛋白質攝取：{(wholeDayAnalysis.totals.pro / (userProfile.weightKg || 55)).toFixed(2)} g/kg/day (建議 1.6-2.0 g/kg 以維持 MPS 最大化)。
                          總熱量：{Math.round(wholeDayAnalysis.totals.kcal)} kcal，提供充足能量避免肌肉異化流失。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'athleteEndurance' && (
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                          <span>耐力長跑自行車運動員肝醣超補要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          碳水化合物供能比：{wholeDayAnalysis.choPct}% (建議 60-70% 肝醣超補)。
                          醣類代換總數：{wholeDayAnalysis.carbExchanges} 份醣。注意訓前 2-3 小時低脂低纖維高醣補給。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'dash' && (
                      <div className="space-y-1">
                        <div className="font-bold text-indigo-900 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span>得舒飲食血壓管理要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          鈉攝取量：{Math.round(wholeDayAnalysis.totals.na)} mg (嚴格限鈉 &lt; 2000mg)。
                          鉀離子：{Math.round(wholeDayAnalysis.totals.k)} mg、鈣質：{Math.round(wholeDayAnalysis.totals.ca)} mg、蔬菜份數：{wholeDayAnalysis.sixGroups.vegetables} 份，多蔬果全穀促使血管擴張平穩。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'normal' && (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>成人均衡飲食評定：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          熱量與三大營養素比例均衡，六大類食物多元攝取，預防慢性病及維持理想健康體態。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'gout' && (
                      <div className="space-y-1">
                        <div className="font-bold text-rose-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>低普林防痛風飲食要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          避免高普林內臟海鮮濃湯，注意水分充足攝取 (&gt;2500ml) 促進尿酸代謝排泄。
                        </p>
                      </div>
                    )}

                    {userProfile.clinicalDietType === 'highProtein' && (
                      <div className="space-y-1">
                        <div className="font-bold text-blue-900 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                          <span>高蛋白傷口術後修復要點：</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          蛋白質負載：{(wholeDayAnalysis.totals.pro / (userProfile.weightKg || 55)).toFixed(2)} g/kg/day，加速肉芽組織生成及免疫球蛋白合成。
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 臨床營養師智慧飲食診斷報告卡片 */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-sm shadow-xs">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">臨床營養師智慧飲食診斷報告</h4>
                        <p className="text-[10px] text-emerald-800">依 DRIs & {clinicalGoals.config.name} 完整診斷評估</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">離線本機</span>
                  </div>
                  
                  <div className="space-y-2 pt-1">
                    <button 
                      onClick={() => setIsAiReportModalOpen(true)}
                      className="touch-press w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1.5 transition"
                    >
                      <Activity className="w-4 h-4" />
                      <span>查看全套診斷報告</span>
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={handleExportAssessmentCsv}
                        disabled={analysisBasket.length === 0}
                        className="touch-press disabled:opacity-40 py-2 px-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition"
                        title="匯出飲食記錄與 DRIs 全項分析報表為 CSV 試算表"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>匯出 CSV</span>
                      </button>
                      <button 
                        onClick={handleExportAssessmentHtml}
                        disabled={analysisBasket.length === 0}
                        className="touch-press disabled:opacity-40 py-2 px-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition"
                        title="匯出飲食分析與 DRIs 全項為 HTML 報告 (支援列印)"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>匯出 HTML</span>
                      </button>
                      <button 
                        onClick={handleExportDietPlanReport}
                        disabled={analysisBasket.length === 0}
                        className="touch-press disabled:opacity-40 py-2 px-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition"
                        title="匯出臨床飲食處方評估摘要單 (TXT 格式)"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>處方單 TXT</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>想調整餐食或增減克數？</span>
                    <button 
                      onClick={() => {
                        setAnalyzerSubTab('assessment');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>返回飲食評估修改</span>
                    </button>
                  </div>
                </div>
              </main>
            )}
          </div>
        )}

        {/* CLINICAL MENU GENERATOR (進階臨床營養菜單生成器) */}
        {activeTool === 'planner' && (
          <MenuPlannerView
            onImportToAnalyzer={(items) => {
              setAnalysisBasket(prev => [...prev, ...items]);
              setActiveTool('analyzer');
              setAnalyzerSubTab('assessment');
              setQuickToast({
                message: `已成功將菜單 ${items.length} 項食材匯入飲食評估記錄！`,
                sub: '可切換至「飲食評估」查看熱量與三大營養素，或「飲食分析」比對 DRIs。'
              });
            }}
            availableFoods={foods}
            clientTargetKcal={clinicalGoals.targetKcal}
            clientTargetProG={clinicalGoals.targetProG}
            clientDietName={clinicalGoals.config.name}
            clientWeightKg={userProfile.weightKg}
            clientHeightCm={userProfile.heightCm}
            clientGender={userProfile.gender}
          />
        )}

        {/* 全域版權宣告頁尾 (Global Copyright Footer) */}
        <footer className="mt-auto w-full py-5 px-4 bg-slate-900 text-slate-400 text-center text-[10px] border-t border-slate-800 space-y-1.5 select-text">
          <div className="flex items-center justify-center space-x-1.5 font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-white">版權宣告所有人：richardmimic / 營養吳理</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            營養師專業臨床工具包 (Dietitian Pro Suite) · TFDA 食材資料庫 · 飲食評估與 DRIs 分析 · 智慧菜單規劃
          </p>
          <div className="pt-0.5 text-[9px] text-slate-500 font-mono">
            Copyright © 2026 richardmimic / 營養吳理. All rights reserved.
          </div>
        </footer>

        {/* FOOD DETAIL DRAWER (支援選擇餐別一鍵加入飲食分析) */}
        {selectedDetailFood && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center">
            <div className="bg-white rounded-t-3xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedDetailFood.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black text-slate-900">{selectedDetailFood.name}</h3>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        {selectedDetailFood.catName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                      {selectedDetailFood.note || '衛福部檢驗食材'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDetailFood(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-700 text-xs">
                {/* 換算基準與食用份量 */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>設定換算基準與食用份量：</span>
                    <span className="text-emerald-700 font-mono font-black">
                      約食用 {Math.round(detailCalculatedGrams)} g
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 text-[10px] font-bold bg-white p-1 rounded-xl border border-slate-200">
                    {(['gram', 'kcal', 'pro', 'cho', 'fat'] as DimensionKey[]).map(dim => (
                      <button 
                        key={dim}
                        onClick={() => {
                          setDetailDim(dim);
                          setDetailPortionVal(RANK_DIM_CONFIG[dim].defaultVal);
                        }}
                        className={`py-1 rounded-lg text-center transition ${detailDim === dim ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}
                      >
                        {dim === 'gram' && '⚖️ 重量'}
                        {dim === 'kcal' && '🔥 熱量'}
                        {dim === 'pro' && '💪 蛋白'}
                        {dim === 'cho' && '🍚 碳水'}
                        {dim === 'fat' && '🥑 脂肪'}
                      </button>
                    ))}
                  </div>

                  {/* Manual Value Adjuster */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-1">
                      {RANK_DIM_CONFIG[detailDim].presets.map(p => (
                        <button 
                          key={p}
                          onClick={() => setDetailPortionVal(p)}
                          className="touch-press px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition"
                        >
                          {p}{RANK_DIM_CONFIG[detailDim].unit}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setDetailPortionVal(prev => Math.max(1, prev - (detailDim === 'kcal' ? 25 : 10)))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                      >
                        -
                      </button>
                      <label htmlFor={detailPortionInputId} className="sr-only">食用份量數值</label>
                      <input 
                        id={detailPortionInputId}
                        type="number" 
                        value={detailPortionVal}
                        min="1" 
                        step="any"
                        onChange={(e) => setDetailPortionVal(parseFloat(e.target.value) || 1)}
                        className="w-16 text-center font-black text-slate-900 bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-600 min-w-[18px]">
                        {RANK_DIM_CONFIG[detailDim].unit}
                      </span>
                      <button 
                        onClick={() => setDetailPortionVal(prev => prev + (detailDim === 'kcal' ? 25 : 10))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* 指定加入飲食分析之餐別 */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-indigo-700" />
                      <span>指定加入飲食分析之餐別：</span>
                    </span>
                    <span className="text-[10px] text-indigo-700 font-normal">直接寫入飲食日誌</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => (
                      <button 
                        key={meal}
                        onClick={() => setTargetMealToAdd(meal)}
                        className={`py-1 rounded-lg text-center transition ${targetMealToAdd === meal ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'}`}
                      >
                        {meal === 'breakfast' && '🌅 早餐'}
                        {meal === 'lunch' && '☀️ 午餐'}
                        {meal === 'dinner' && '🌙 晚餐'}
                        {meal === 'snack' && '🍪 點心'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 烹調用油設定 (保留烹調用油空格可填寫量，並設置選擇油脂的選單) */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                    <span className="flex items-center gap-1">
                      <span className="text-sm">🫒</span>
                      <span>烹調用油設定 (可填寫用油量並選擇油品)：</span>
                    </span>
                    {detailCookingOilGrams > 0 ? (
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold px-1.5 py-0.2 rounded">
                        +{Math.round(getCookingOilProfile(detailCookingOilName).kcal * (detailCookingOilGrams / 100))} kcal · 約 {(detailCookingOilGrams / 5).toFixed(1)} 份油脂
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">無額外用油</span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {/* 選擇油脂的選單 */}
                    <div>
                      <label htmlFor={detailCookingOilSelectId} className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        選擇油脂品項：
                      </label>
                      <select
                        id={detailCookingOilSelectId}
                        value={detailCookingOilName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDetailCookingOilName(val);
                          if (val.includes('無用油') || val.includes('不額外加油')) {
                            setDetailCookingOilGrams(0);
                          } else if (detailCookingOilGrams === 0) {
                            setDetailCookingOilGrams(5); // 預設 1 茶匙 (5g)
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
                      >
                        {COOKING_OIL_OPTIONS.map(oil => (
                          <option key={oil.id} value={oil.name}>
                            {oil.icon} {oil.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 烹調用油空格可填寫量 */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                        <label htmlFor={detailCookingOilInputId}>烹調用油量 (g)：</label>
                        <span className="text-slate-400 font-normal">1茶匙=5g(1份油) · 1湯匙=15g</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <input
                            id={detailCookingOilInputId}
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={detailCookingOilGrams || ''}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              const g = !isNaN(v) && v >= 0 ? v : 0;
                              setDetailCookingOilGrams(g);
                              if (g > 0 && (detailCookingOilName.includes('無用油') || detailCookingOilName.includes('不額外加油'))) {
                                setDetailCookingOilName('橄欖油 (高單元不飽和 MUFA)');
                              } else if (g === 0) {
                                setDetailCookingOilName('無用油 / 不額外加油');
                              }
                            }}
                            placeholder="0"
                            className="w-16 text-center font-black font-mono text-xs text-slate-900 outline-none"
                          />
                          <span className="text-xs font-bold text-slate-600 pr-1">g</span>
                        </div>

                        {/* 油量快捷選項 */}
                        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar flex-1 justify-end">
                          {[
                            { g: 0, label: '無油' },
                            { g: 3, label: '3g(微油)' },
                            { g: 5, label: '5g(1茶匙)' },
                            { g: 8, label: '8g(清炒)' },
                            { g: 10, label: '10g(2茶匙)' },
                            { g: 15, label: '15g(1大匙)' }
                          ].map(chip => (
                            <button
                              key={chip.g}
                              type="button"
                              onClick={() => {
                                setDetailCookingOilGrams(chip.g);
                                if (chip.g > 0 && (detailCookingOilName.includes('無用油') || detailCookingOilName.includes('不額外加油'))) {
                                  setDetailCookingOilName('橄欖油 (高單元不飽和 MUFA)');
                                } else if (chip.g === 0) {
                                  setDetailCookingOilName('無用油 / 不額外加油');
                                }
                              }}
                              className={`touch-press px-1.5 py-0.5 rounded text-[9px] font-bold border transition ${
                                detailCookingOilGrams === chip.g
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 國健署六大類份數估算 */}
                {detailSixFoodPortions && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <Apple className="w-3.5 h-3.5 text-emerald-700" />
                      <span>國健署食物代換估算 (每 {Math.round(detailCalculatedGrams)}g)：</span>
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-bold flex-wrap pt-0.5">
                      {detailSixFoodPortions.cereals > 0 && <span>全穀雜糧 {detailSixFoodPortions.cereals} 份 (約 {detailSixFoodPortions.cereals} 份醣)</span>}
                      {detailSixFoodPortions.proteins > 0 && <span>豆魚蛋肉 {detailSixFoodPortions.proteins} 份</span>}
                      {detailSixFoodPortions.dairy > 0 && <span>乳品 {detailSixFoodPortions.dairy} 份</span>}
                      {detailSixFoodPortions.vegetables > 0 && <span>蔬菜 {detailSixFoodPortions.vegetables} 份</span>}
                      {detailSixFoodPortions.fruits > 0 && <span>水果 {detailSixFoodPortions.fruits} 份</span>}
                      {(detailSixFoodPortions.oils + (detailCookingOilGrams / 5)) > 0 && (
                        <span className={detailCookingOilGrams > 0 ? "text-amber-800 font-black" : ""}>
                          油脂 {Number((detailSixFoodPortions.oils + (detailCookingOilGrams / 5)).toFixed(1))} 份
                          {detailCookingOilGrams > 0 && ` (含烹調油 ${(detailCookingOilGrams / 5).toFixed(1)}份)`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dynamic Macros Grid */}
                {(() => {
                  const ratio = detailCalculatedGrams / 100;
                  const f = selectedDetailFood;
                  const oilGrams = Math.max(0, detailCookingOilGrams || 0);
                  const oilProf = getCookingOilProfile(detailCookingOilName);
                  const oilCal = Math.round(oilProf.kcal * (oilGrams / 100));
                  const oilFat = Number((oilProf.fat * (oilGrams / 100)).toFixed(1));
                  const totalCal = Math.round(f.kcal * ratio) + oilCal;
                  const totalFat = Number(((f.fat * ratio) + oilFat).toFixed(1));

                  return (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                        <div className="text-[9px] text-amber-700 font-bold">總熱量</div>
                        <div className="text-sm font-black text-amber-900 mt-0.5">{totalCal}</div>
                        <div className="text-[9px] text-amber-600 font-mono">
                          {oilCal > 0 ? `含油+${oilCal}k` : 'kcal'}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
                        <div className="text-[9px] text-blue-700 font-bold">粗蛋白質</div>
                        <div className="text-sm font-black text-blue-900 mt-0.5">{(f.pro * ratio).toFixed(1)}</div>
                        <div className="text-[9px] text-blue-600 font-mono">g</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                        <div className="text-[9px] text-emerald-700 font-bold">碳水化合物</div>
                        <div className="text-sm font-black text-emerald-900 mt-0.5">{(f.cho * ratio).toFixed(1)}</div>
                        <div className="text-[9px] text-emerald-600 font-mono">g</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-2 rounded-xl">
                        <div className="text-[9px] text-purple-700 font-bold">粗脂肪</div>
                        <div className="text-sm font-black text-purple-900 mt-0.5">{totalFat}</div>
                        <div className="text-[9px] text-purple-600 font-mono">
                          {oilFat > 0 ? `含油+${oilFat}g` : 'g'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Key Micronutrients */}
                {(() => {
                  const ratio = detailCalculatedGrams / 100;
                  const f = selectedDetailFood;
                  const keyMicros = [
                    { label: '鉀 (K)', val: Number((f.k * ratio).toFixed(0)), unit: 'mg', target: activeDriStandard.k, isUl: !!clinicalGoals.config.kLimitMg },
                    { label: '磷 (P)', val: Number((f.p * ratio).toFixed(0)), unit: 'mg', target: clinicalGoals.config.pLimitMg || 1000, isUl: !!clinicalGoals.config.pLimitMg },
                    { label: '鈣質 (Ca)', val: Number((f.ca * ratio).toFixed(0)), unit: 'mg', target: activeDriStandard.ca, isUl: false },
                    { label: '鐵質 (Fe)', val: Number((f.fe * ratio).toFixed(1)), unit: 'mg', target: activeDriStandard.fe, isUl: false },
                    { label: '膳食纖維', val: Number((f.fiber * ratio).toFixed(1)), unit: 'g', target: activeDriStandard.fiber, isUl: false },
                    { label: '鈉上限', val: Number((f.na * ratio).toFixed(0)), unit: 'mg', target: clinicalGoals.config.naLimitMg, isUl: true }
                  ];

                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">主要微量元素與 DRIs 達成率：</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                          {clinicalGoals.config.badge}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {keyMicros.map(m => {
                          const pct = Math.round((m.val / m.target) * 100);
                          let badgeColor = 'text-emerald-700 bg-emerald-50';
                          if (m.isUl && m.val > 500) badgeColor = 'text-amber-700 bg-amber-50';
                          if (pct >= 50 && !m.isUl) badgeColor = 'text-emerald-800 bg-emerald-100 font-black';

                          return (
                            <div key={m.label} className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                              <div className="text-[10px] text-slate-500 font-medium">{m.label}</div>
                              <div className="text-xs font-black text-slate-800 mt-0.5">
                                {m.val} <span className="text-[9px] font-normal text-slate-400">{m.unit}</span>
                              </div>
                              <div className={`text-[9px] mt-1 ${badgeColor} rounded py-0.2 font-bold`}>
                                {m.isUl ? `佔上限 ${pct}%` : `達標 ${pct}%`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Expandable: Full Components Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => setIsFullTableOpen(!isFullTableOpen)}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>展開 TFDA 食品資料庫全項檢驗指標完整表格</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFullTableOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFullTableOpen && (
                    <div className="p-3 space-y-3 bg-white text-[11px] divide-y divide-slate-100">
                      {(() => {
                        const ratio = detailCalculatedGrams / 100;
                        const f = selectedDetailFood;
                        return (
                          <>
                            <div className="space-y-1">
                              <span className="font-bold text-slate-900 text-xs">📋 一般成分與脂質分析</span>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 pt-1">
                                <div>水分：<span className="font-mono font-bold">{(f.water * ratio).toFixed(1)}</span> g</div>
                                <div>糖質：<span className="font-mono font-bold">{(f.sugar * ratio).toFixed(1)}</span> g</div>
                                <div>飽和脂肪：<span className="font-mono font-bold">{(f.satFat * ratio).toFixed(1)}</span> g</div>
                                <div>單元不飽和：<span className="font-mono font-bold">{(f.mufa * ratio).toFixed(1)}</span> g</div>
                                <div>多元不飽和：<span className="font-mono font-bold">{(f.pufa * ratio).toFixed(1)}</span> g</div>
                                <div>膽固醇：<span className="font-mono font-bold">{Math.round(f.chol * ratio)}</span> mg</div>
                                <div>灰分：<span className="font-mono font-bold">{(f.ash * ratio).toFixed(1)}</span> g</div>
                              </div>
                            </div>
                            <div className="space-y-1 pt-2">
                              <span className="font-bold text-slate-900 text-xs">⛏️ 礦物質與電解質</span>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 pt-1">
                                <div>鉀 (K)：<span className="font-mono font-bold">{Math.round(f.k * ratio)}</span> mg</div>
                                <div>磷 (P)：<span className="font-mono font-bold">{Math.round(f.p * ratio)}</span> mg</div>
                                <div>鈉 (Na)：<span className="font-mono font-bold">{Math.round(f.na * ratio)}</span> mg</div>
                                <div>鎂 (Mg)：<span className="font-mono font-bold">{Math.round(f.mg * ratio)}</span> mg</div>
                                <div>鋅 (Zn)：<span className="font-mono font-bold">{(f.zn * ratio).toFixed(1)}</span> mg</div>
                                <div>銅 (Cu)：<span className="font-mono font-bold">{(f.cu * ratio).toFixed(2)}</span> mg</div>
                                <div>錳 (Mn)：<span className="font-mono font-bold">{(f.mn * ratio).toFixed(2)}</span> mg</div>
                              </div>
                            </div>
                            <div className="space-y-1 pt-2">
                              <span className="font-bold text-slate-900 text-xs">💊 維生素群分析</span>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 pt-1">
                                <div>維生素 A：<span className="font-mono font-bold">{Math.round(f.vitA * ratio)}</span> ug RAE</div>
                                <div>葉酸：<span className="font-mono font-bold">{Math.round(f.folate * ratio)}</span> mcg</div>
                                <div>維生素 D：<span className="font-mono font-bold">{(f.vitD * ratio).toFixed(2)}</span> ug</div>
                                <div>維生素 E：<span className="font-mono font-bold">{(f.vitE * ratio).toFixed(1)}</span> mg</div>
                                <div>維生素 B1：<span className="font-mono font-bold">{(f.vitB1 * ratio).toFixed(2)}</span> mg</div>
                                <div>維生素 B2：<span className="font-mono font-bold">{(f.vitB2 * ratio).toFixed(2)}</span> mg</div>
                                <div>菸鹼素：<span className="font-mono font-bold">{(f.niacin * ratio).toFixed(1)}</span> mg</div>
                                <div>維生素 B6：<span className="font-mono font-bold">{(f.vitB6 * ratio).toFixed(2)}</span> mg</div>
                                <div>維生素 B12：<span className="font-mono font-bold">{(f.vitB12 * ratio).toFixed(2)}</span> ug</div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Similar Foods */}
                {detailSimilarFoods.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>同類相似營養替換推薦：</span>
                    </span>
                    <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                      {detailSimilarFoods.map(s => (
                        <div 
                          key={s.food.id}
                          onClick={() => handleOpenDetail(s.food)}
                          className="touch-press flex-shrink-0 bg-white border border-slate-200 rounded-xl p-2 cursor-pointer hover:border-emerald-400 transition text-center min-w-[105px] shadow-2xs"
                        >
                          <span className="text-xl block mb-0.5">{s.food.icon}</span>
                          <span className="text-[11px] font-bold text-slate-800 block truncate">{s.food.name}</span>
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold inline-block mt-0.5">
                            相似度 {s.similarity}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Action Buttons */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleAddDetailToBasket(false)}
                  className="touch-press py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>加入飲食分析</span>
                </button>
                <button 
                  onClick={handleAddDetailToCompare}
                  className="touch-press py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-sm transition"
                >
                  <Scale className="w-4 h-4" />
                  <span>放入雙物對比</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PROFESSIONAL CLINICAL PROFILE SETTING */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-700" />
                  <span>個案臨床體位與飲食處方設定</span>
                </h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* 臨床疾病與運動員飲食型態選擇 */}
                <div>
                  <label htmlFor={clinicalDietTypeId} className="font-bold text-slate-700 block mb-1">
                    臨床飲食處方型態：
                  </label>
                  <select 
                    id={clinicalDietTypeId}
                    value={userProfile.clinicalDietType || 'normal'}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, clinicalDietType: e.target.value as ClinicalDietType }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="normal">一般健康成人均衡飲食 (DRIs 第八版)</option>
                    <option value="athleteStrength">運動員處方：阻力肌力與增肌塑形 (1.8g/kg 高蛋白/白胺酸/MPS)</option>
                    <option value="athleteEndurance">運動員處方：耐力長跑與肝醣超補 (高碳水 60-70%/耐力電解質)</option>
                    <option value="ckd">慢性腎臟病 (CKD 3-5 期非洗腎，低蛋白限磷鉀)</option>
                    <option value="diabetes">糖尿病醣類計數與低升糖 (DM & GI，控醣高纖)</option>
                    <option value="dash">DASH 得舒降壓飲食 (高血壓/高鉀高鎂高鈣)</option>
                    <option value="highProtein">高蛋白高熱量營養支持 (肌少症/術後/透析)</option>
                    <option value="gout">低普林與高水代謝 (痛風/高尿酸)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    {clinicalGoals.config.desc}
                  </p>
                </div>

                {/* 身高體重體位資訊 */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <label htmlFor={heightInputId} className="font-bold text-slate-600 block text-[10px] mb-0.5">身高 (cm)：</label>
                    <input 
                      id={heightInputId}
                      type="number" 
                      value={userProfile.heightCm || 160}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, heightCm: parseFloat(e.target.value) || 160 }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor={weightInputId} className="font-bold text-slate-600 block text-[10px] mb-0.5">體重 (kg)：</label>
                    <input 
                      id={weightInputId}
                      type="number" 
                      value={userProfile.weightKg || 55}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, weightKg: parseFloat(e.target.value) || 55 }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold font-mono text-slate-800"
                    />
                  </div>
                  <div className="col-span-2 text-[10px] text-emerald-800 font-bold pt-1 flex justify-between">
                    <span>理想體重 (IBW): {clinicalGoals.ibw} kg</span>
                    <span>BMI: {clinicalGoals.bmi}</span>
                  </div>
                </div>

                {/* 生理性別與年齡 */}
                <div>
                  <span className="font-bold text-slate-700 block mb-1">生理性別：</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setUserProfile(prev => ({ ...prev, gender: 'female' }))}
                      className={`py-2 rounded-xl border font-bold text-center ${userProfile.gender === 'female' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      女性
                    </button>
                    <button 
                      onClick={() => setUserProfile(prev => ({ ...prev, gender: 'male', pregnancy: 'none' }))}
                      className={`py-2 rounded-xl border font-bold text-center ${userProfile.gender === 'male' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                      男性
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor={profileAgeGroupId} className="font-bold text-slate-700 block mb-1">年齡族群：</label>
                  <select 
                    id={profileAgeGroupId}
                    value={userProfile.ageGroup}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, ageGroup: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="1-3">1-3 歲幼兒</option>
                    <option value="4-6">4-6 歲學齡前</option>
                    <option value="7-9">7-9 歲學童</option>
                    <option value="10-12">10-12 歲學童</option>
                    <option value="13-15">13-15 歲青少年</option>
                    <option value="16-18">16-18 歲青少年</option>
                    <option value="19-30">19-30 歲青年</option>
                    <option value="31-50">31-50 歲壯年</option>
                    <option value="51-70">51-70 歲中年</option>
                    <option value="71+">71 歲以上銀髮</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={profileActivityId} className="font-bold text-slate-700 block mb-1">身體活動強度：</label>
                  <select 
                    id={profileActivityId}
                    value={userProfile.activity}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, activity: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="light">輕度（辦公久坐、靜態生活）</option>
                    <option value="moderate">中度（通勤走動、規律輕量運動）</option>
                    <option value="heavy">重度（高強度勞動、運動員）</option>
                  </select>
                </div>

                {userProfile.gender === 'female' && (
                  <div>
                    <label htmlFor={profilePregnancyId} className="font-bold text-slate-700 block mb-1">懷孕 / 哺乳特殊生理階段：</label>
                    <select 
                      id={profilePregnancyId}
                      value={userProfile.pregnancy}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, pregnancy: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="none">無（一般生理狀態）</option>
                      <option value="p1">懷孕第一期（0-12週）</option>
                      <option value="p2">懷孕第二期（13-24週）</option>
                      <option value="p3">懷孕第三期（25週至分娩）</option>
                      <option value="lact">哺乳期（產後哺乳）</option>
                    </select>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="touch-press w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
              >
                儲存處方並自動換算每日臨床目標
              </button>
              <div className="text-center text-[9px] text-slate-400 font-medium pt-0.5">
                版權宣告所有人：richardmimic / 營養吳理
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CLINICAL NUTRITIONIST REPORT */}
        {isAiReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-emerald-200" />
                  <div>
                    <h3 className="text-xs font-black">臨床營養師專業診斷報告</h3>
                    <p className="text-[9px] text-emerald-100">本機 DRIs & 臨床醫學處方引擎運算</p>
                  </div>
                </div>
                <button onClick={() => setIsAiReportModalOpen(false)} className="text-emerald-100 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-slate-700 text-xs leading-relaxed">
                {(() => {
                  const totals = basketAnalysis.totals;
                  const totalKcal = Math.round(totals.kcal);
                  const targetKcal = clinicalGoals.targetKcal;
                  const kcalPct = Math.round((totalKcal / targetKcal) * 100);
                  const targetPro = clinicalGoals.targetProG;
                  const proPctGoal = Math.round((totals.pro / targetPro) * 100);
                  const caPct = Math.round((totals.ca / activeDriStandard.ca) * 100);
                  const fePct = Math.round((totals.fe / activeDriStandard.fe) * 100);
                  const fiberPct = Math.round((totals.fiber / activeDriStandard.fiber) * 100);
                  const naVal = Math.round(totals.na);
                  const kVal = Math.round(totals.k);
                  const pVal = Math.round(totals.p);

                  const highlights: string[] = [];
                  const warnings: string[] = [];
                  const tips: string[] = [];

                  // 熱量與蛋白質判斷
                  if (kcalPct < 75) {
                    warnings.push(`熱量攝取不足（達成率 ${kcalPct}%，提供 ${totalKcal} / 目標 ${targetKcal} kcal），可能導致蛋白質被燃燒分解。`);
                  } else if (kcalPct > 115) {
                    warnings.push(`熱量超出目標（達成率 ${kcalPct}%，提供 ${totalKcal} / 目標 ${targetKcal} kcal），需控制體重管理。`);
                  } else {
                    highlights.push(`熱量控制良好（達成率 ${kcalPct}%，提供 ${totalKcal} kcal），符合處方設定。`);
                  }

                  // 臨床處方特定判定
                  if (userProfile.clinicalDietType === 'athleteStrength') {
                    if (proPctGoal >= 90 && proPctGoal <= 125) {
                      highlights.push(`蛋白質攝取極佳（達標 ${proPctGoal}%，提供 ${totals.pro.toFixed(1)}g / 目標 ${targetPro}g），能有效啟動肌肉蛋白質合成 (MPS) 促進肌纖維增生。`);
                    } else if (proPctGoal < 90) {
                      warnings.push(`蛋白質攝取未達肌力運動員目標（提供 ${totals.pro.toFixed(1)}g / 目標 ${targetPro}g），建議於訓後 45 分鐘內補充乳清蛋白、水煮蛋、雞胸肉。`);
                    } else {
                      highlights.push(`蛋白質攝取充沛 (${totals.pro.toFixed(1)}g)，超出日常維持量以支援大重量肌力阻力破壞修復。`);
                    }
                    if (basketAnalysis.choPct < 45) {
                      warnings.push(`碳水化合物偏低 (${basketAnalysis.choPct}%)，易造成重訓時肌力耐受度下降，阻力運動仍需充足醣類保護蛋白質不被氧化。`);
                    } else {
                      highlights.push(`碳水與熱量充足 (${totalKcal} kcal)，提供足夠熱量防止訓練期肌肉流失 (Anti-catabolic)。`);
                    }
                  } else if (userProfile.clinicalDietType === 'athleteEndurance') {
                    if (basketAnalysis.choPct >= 60) {
                      highlights.push(`碳水化合物供能比高達 ${basketAnalysis.choPct}% (約 ${basketAnalysis.carbExchanges} 份醣)，符合耐力型運動員肝醣超補 (Glycogen Supercompensation) 需求！`);
                    } else {
                      warnings.push(`碳水化合物佔比僅 ${basketAnalysis.choPct}% (建議 60-70%)，長跑或高耐力項目可能提早耗盡肌肝醣撞牆。`);
                    }
                    highlights.push(`鈉攝取 ${naVal} mg (上限放寬至 3,500 mg)，有效補償耐力劇烈排汗造成之電解質損失，預防肌肉痙攣。`);
                  } else if (userProfile.clinicalDietType === 'ckd') {
                    if (totals.pro > targetPro * 1.15) {
                      warnings.push(`⚠️ 腎病蛋白質超標！提供 ${totals.pro.toFixed(1)}g / 上限 ${targetPro}g，易加重腎臟負擔與含氮廢物累積。`);
                    } else {
                      highlights.push(`蛋白質攝取符合低蛋白腎病處方要求 (${totals.pro.toFixed(1)}g / ${targetPro}g)。`);
                    }

                    if (kVal > (clinicalGoals.config.kLimitMg || 2000)) {
                      warnings.push(`⚠️ 鉀離子高達 ${kVal} mg（已達或超出上限 2000 mg），有高血鉀症心律不整風險！應避生菜、果乾與含鉀濃湯。`);
                    }
                    if (pVal > (clinicalGoals.config.pLimitMg || 800)) {
                      warnings.push(`⚠️ 磷攝取量 ${pVal} mg 超出限磷標準 (800 mg)，需留意加工食品無機磷及堅果豆類。`);
                    }
                  } else if (userProfile.clinicalDietType === 'diabetes') {
                    highlights.push(`醣類計數約 ${basketAnalysis.carbExchanges} 份醣 (總碳水 ${Math.round(totals.cho)}g)，建議分餐平均分配。`);
                    if (fiberPct >= 80) {
                      highlights.push(`膳食纖維豐富 (${totals.fiber.toFixed(1)}g)，有助於延緩飯後血糖上升波動。`);
                    } else {
                      warnings.push(`膳食纖維僅 ${totals.fiber.toFixed(1)}g，建議增加全穀或綠色蔬菜以改善升糖指數 (GI)。`);
                    }
                  } else if (userProfile.clinicalDietType === 'dash') {
                    if (kVal >= 3000) highlights.push(`得舒高鉀達標 (${kVal} mg)，有助於鈉排泄與血管張力放鬆。`);
                    else warnings.push(`得舒飲食目標鉀量偏低 (${kVal} mg / 建議 3500 mg)，可補充香蕉、菠菜、番茄。`);
                  }

                  if (naVal > clinicalGoals.config.naLimitMg) {
                    warnings.push(`⚠️ 鈉含量 ${naVal} mg 超出處方上限 (${clinicalGoals.config.naLimitMg} mg)，請注意調味料與醃漬品。`);
                  } else {
                    highlights.push(`鈉攝取理想 (${naVal} mg / 上限 ${clinicalGoals.config.naLimitMg} mg)。`);
                  }

                  if (caPct < 60) {
                    tips.push('補鈣建議：傳統板豆腐、低脂鮮乳、黑芝麻、芥藍菜。');
                  }
                  if (fePct < 60) {
                    tips.push('補鐵建議：文蛤、鵝肉、紅莧菜、豬血、瘦肉。');
                  }

                  return (
                    <>
                      <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{profileLabel}</span>
                          <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[9px]">臨床指引</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          處方備註：{clinicalGoals.config.warningNotice}
                        </div>
                      </div>

                      {/* 宏量營養素與代換摘要 */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-blue-50 border border-blue-200 p-1.5 rounded-xl">
                          <div className="text-[9px] text-blue-700 font-bold">蛋白質比</div>
                          <div className="text-xs font-black text-blue-900 mt-0.5">{basketAnalysis.proPct}%</div>
                          <div className="text-[9px] text-blue-600 font-mono">({Math.round(totals.pro)}g)</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-xl">
                          <div className="text-[9px] text-emerald-700 font-bold">碳水化合物比</div>
                          <div className="text-xs font-black text-emerald-900 mt-0.5">{basketAnalysis.choPct}%</div>
                          <div className="text-[9px] text-emerald-600 font-mono">({basketAnalysis.carbExchanges}份醣)</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 p-1.5 rounded-xl">
                          <div className="text-[9px] text-purple-700 font-bold">脂肪比</div>
                          <div className="text-xs font-black text-purple-900 mt-0.5">{basketAnalysis.fatPct}%</div>
                          <div className="text-[9px] text-purple-600 font-mono">({Math.round(totals.fat)}g)</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>飲食優勢亮點</span>
                        </h4>
                        <ul className="space-y-1 text-[10px] text-slate-600 pl-1">
                          {highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>需留意的臨床缺口與警戒</span>
                        </h4>
                        <ul className="space-y-1 text-[10px] text-slate-600 pl-1">
                          {warnings.length > 0 ? (
                            warnings.map((w, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-500 font-bold">!</span>
                                <span>${w}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400">目前各項關鍵指標皆在理想標準內！</li>
                          )}
                        </ul>
                      </div>

                      {tips.length > 0 && (
                        <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl space-y-1">
                          <h4 className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>營養師食材處方建議</span>
                          </h4>
                          <div className="space-y-0.5 text-[9px] text-emerald-800">
                            {tips.map((t, i) => (
                              <p key={i}>• {t}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] gap-2">
                <div className="flex flex-col text-slate-600">
                  <div className="flex items-center space-x-1 text-emerald-800 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">100% 離線本地運算</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-medium">版權宣告：richardmimic / 營養吳理</span>
                </div>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button 
                    onClick={handleExportAssessmentCsv}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg font-bold flex items-center gap-1 transition shadow-2xs"
                    title="匯出 DRIs 分析報表為 CSV 試算表"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                    <span>匯出 CSV</span>
                  </button>
                  <button 
                    onClick={handleExportAssessmentHtml}
                    className="px-2.5 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 border border-teal-300 rounded-lg font-bold flex items-center gap-1 transition shadow-2xs"
                    title="匯出 DRIs 分析為完整 HTML 診斷報告"
                  >
                    <BookOpen className="w-3 h-3 text-teal-700" />
                    <span>匯出 HTML</span>
                  </button>
                  <button 
                    onClick={handleExportDietPlanReport}
                    className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 flex items-center gap-1 transition shadow-2xs"
                    title="匯出處方評估摘要單 (TXT 格式)"
                  >
                    <Download className="w-3 h-3" />
                    <span>處方單 TXT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DATABASE INFO & CLOUD SYNC */}
        {isDbModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>食品資料庫與 DRIs 雲端連線</span>
                </h3>
                <button onClick={() => setIsDbModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p className="font-medium">
                  本系統內建食材指標與雲端試算表完整遵循台灣<strong className="text-slate-900">衛生福利部食品藥物管理署 (TFDA)</strong> 官方標準：
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1 text-[11px] text-amber-900">
                  <div className="font-bold flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-amber-700" />
                    <span>純淨雲端資料庫架構</span>
                  </div>
                  <p className="text-amber-800 text-[10px]">
                    完全依賴雲端試算表動態同步，支援離線快速暫存與隨時重新擷取。
                  </p>
                </div>

                {/* Cloud Database Sync Status */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 space-y-2 text-indigo-950">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[11px] flex items-center gap-1 text-indigo-900">
                      <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>Google 試算表雲端同步</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${syncStatus === 'success' ? 'bg-emerald-100 text-emerald-800' : syncStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                      {syncStatus === 'success' ? '同步成功' : syncStatus === 'error' ? '連線中斷' : '連線中...'}
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-tight">
                    {syncMessage}
                  </p>
                  {isCloudDrisLoaded && (
                    <div className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>DRIs 標準：已同步雲端試算表設定</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <button 
                      onClick={fetchCloudDatabase}
                      disabled={syncStatus === 'syncing'}
                      className="touch-press flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[11px] text-center transition flex items-center justify-center space-x-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>從 Google 試算表重新同步</span>
                    </button>
                  </div>

                  {/* 端點安全設定抽屜 */}
                  <div className="pt-1 border-t border-indigo-100 flex items-center justify-between text-[9px]">
                    <button 
                      type="button"
                      onClick={() => setIsCustomUrlInputVisible(!isCustomUrlInputVisible)}
                      className="touch-press text-indigo-700 hover:text-indigo-900 font-bold underline flex items-center gap-0.5"
                    >
                      <span>{isCustomUrlInputVisible ? '收合端點設定' : '⚙️ 檢視或自訂同步端點 URL'}</span>
                    </button>
                    <span className="text-slate-400 font-mono">
                      {cloudSyncUrl ? '已載入端點' : '未配置端點'}
                    </span>
                  </div>

                  {isCustomUrlInputVisible && (
                    <div className="pt-1 space-y-1 bg-white/70 p-2 rounded-lg border border-indigo-100">
                      <label className="text-[10px] text-slate-700 font-bold block">
                        Google Apps Script Web App URL：
                      </label>
                      <input 
                        type="url"
                        value={cloudSyncUrl}
                        onChange={(e) => setCloudSyncUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full text-[10px] p-1.5 border border-indigo-200 rounded-lg bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <p className="text-[8px] text-slate-400 leading-tight">
                        資安防護：推薦在根目錄 <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">.env</code> 中設定 <code className="font-mono">VITE_GOOGLE_SHEETS_WEB_APP_URL</code>，避免敏感部署 ID 提交至 Git。
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <a 
                    href="https://consumer.fda.gov.tw/Food/TFND.aspx?nodeID=178" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="touch-press block w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center border border-slate-200 transition"
                  >
                    🌐 前往衛福部 TFDA 官方整合查詢平台
                  </a>
                  <button 
                    onClick={handleExportCsv}
                    className="touch-press w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-center transition flex items-center justify-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>匯出當前資料庫為 CSV (UTF-8 BOM)</span>
                  </button>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 font-medium py-0.5">
                版權宣告所有人：richardmimic / 營養吳理
              </div>

              <button 
                onClick={() => setIsDbModalOpen(false)}
                className="touch-press w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
              >
                關閉
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
