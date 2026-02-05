# 🔍 空壳代码检测报告

**生成时间:** 2025/12/31 03:03:59
**扫描目录:** /Users/alex/Develop/silksparks
**扫描文件数:** 75
**发现问题数:** 87

## 📊 问题统计

| 严重性 | 数量 | 比例  |
| ------ | ---- | ----- |
| 🔴 高  | 4    | 4.6%  |
| 🟡 中  | 16   | 18.4% |
| 🟢 低  | 67   | 77.0% |

## 🎯 问题类型分布

| 模式                    | 数量 | 描述                               |
| ----------------------- | ---- | ---------------------------------- |
| empty-state-placeholder | 35   | 空初始状态 (检查是否真正使用)      |
| console-error           | 23   | console.warn/error (可能是临时的)  |
| console-log             | 8    | console.log 调试语句               |
| mock-data-keyword       | 5    | 模拟/假数据变量                    |
| hardcoded-fake-data     | 4    | 硬编码的测试/假数据                |
| return-null-component   | 3    | 组件返回 null (可能是未完成的特性) |
| ts-ignore               | 3    | TypeScript 忽略 (可能隐藏类型问题) |
| empty-arrow-handler     | 2    | 空箭头函数事件处理器               |
| placeholder-href        | 2    | 占位符链接 href="#"                |
| coming-soon             | 1    | 占位符文字提示                     |
| magic-number            | 1    | 硬编码的超时时间 (可能需要配置化)  |

## 📁 按文件分类的详细问题

### [scripts/shell-detector.ts](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts)

**问题数:** 16 (🔴4 🟡12 🟢0)

| 行号                                                                          | 严重性 | 类型                | 内容                                                                    |
| ----------------------------------------------------------------------------- | ------ | ------------------- | ----------------------------------------------------------------------- |
| [L7](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L7)     | 🔴     | empty-arrow-handler | `* 1. 空事件处理器 - onClick={() => {}}, onChange={() => {}}`           |
| [L7](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L7)     | 🔴     | empty-arrow-handler | `* 1. 空事件处理器 - onClick={() => {}}, onChange={() => {}}`           |
| [L9](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L9)     | 🔴     | placeholder-href    | `* 3. 占位符链接 - href="#"`                                            |
| [L69](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L69)   | 🔴     | placeholder-href    | `description: '占位符链接 href="#"'`                                    |
| [L105](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L105) | 🟡     | mock-data-keyword   | `regex: /\b(mockData\|MOCK_\|fakeData\|dummyData\|sampleData)\b/g,`     |
| [L105](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L105) | 🟡     | mock-data-keyword   | `regex: /\b(mockData\|MOCK_\|fakeData\|dummyData\|sampleData)\b/g,`     |
| [L105](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L105) | 🟡     | mock-data-keyword   | `regex: /\b(mockData\|MOCK_\|fakeData\|dummyData\|sampleData)\b/g,`     |
| [L105](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L105) | 🟡     | mock-data-keyword   | `regex: /\b(mockData\|MOCK_\|fakeData\|dummyData\|sampleData)\b/g,`     |
| [L105](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L105) | 🟡     | mock-data-keyword   | `regex: /\b(mockData\|MOCK_\|fakeData\|dummyData\|sampleData)\b/g,`     |
| [L179](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L179) | 🟡     | ts-ignore           | `regex: /@ts-ignore\|@ts-nocheck\|@ts-expect-error/g,`                  |
| [L179](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L179) | 🟡     | ts-ignore           | `regex: /@ts-ignore\|@ts-nocheck\|@ts-expect-error/g,`                  |
| [L179](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L179) | 🟡     | ts-ignore           | `regex: /@ts-ignore\|@ts-nocheck\|@ts-expect-error/g,`                  |
| [L246](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L246) | 🟡     | hardcoded-fake-data | `"Lorem ipsum"`                                                         |
| [L246](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L246) | 🟡     | hardcoded-fake-data | `"Test User"`                                                           |
| [L246](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L246) | 🟡     | hardcoded-fake-data | `"example@email.com"`                                                   |
| [L507](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L507) | 🟡     | coming-soon         | `1. **空事件处理器** - 添加实际逻辑或使用 toast/modal 提示"功能开发中"` |

### [pages/AppFeatures.tsx](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx)

**问题数:** 12 (🔴0 🟡0 🟢12)

| 行号                                                                      | 严重性 | 类型                    | 内容                                                                           |
| ------------------------------------------------------------------------- | ------ | ----------------------- | ------------------------------------------------------------------------------ |
| [L73](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L73)   | 🟢     | empty-state-placeholder | `const [analysis, setAnalysis] = React.useState<string \| null>(null);`        |
| [L74](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L74)   | 🟢     | empty-state-placeholder | `const [planets, setPlanets] = React.useState<any>(null);`                     |
| [L75](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L75)   | 🟢     | empty-state-placeholder | `const [elements, setElements] = React.useState<any>(null);`                   |
| [L76](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L76)   | 🟢     | empty-state-placeholder | `const [recommendations, setRecommendations] = React.useState<Product[]>([]);` |
| [L128](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L128) | 🟢     | console-error           | `console.error(err);`                                                          |
| [L351](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L351) | 🟢     | empty-state-placeholder | `const [card, setCard] = React.useState<any>(null);`                           |
| [L352](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L352) | 🟢     | empty-state-placeholder | `const [interpretation, setInterpretation] = React.useState<string>("");`      |
| [L353](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L353) | 🟢     | empty-state-placeholder | `const [recommendations, setRecommendations] = React.useState<Product[]>([]);` |
| [L393](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L393) | 🟢     | console-error           | `console.error("AI Error", e);`                                                |
| [L710](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L710) | 🟢     | empty-state-placeholder | `const [cards, setCards] = React.useState<any[]>([]);`                         |
| [L711](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L711) | 🟢     | empty-state-placeholder | `const [interpretation, setInterpretation] = React.useState<string>("");`      |
| [L712](file:////Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L712) | 🟢     | empty-state-placeholder | `const [recommendations, setRecommendations] = React.useState<Product[]>([]);` |

### [supabase/functions/ai-generate/index.ts](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts)

**问题数:** 10 (🔴0 🟡0 🟢10)

| 行号                                                                                        | 严重性 | 类型          | 内容                                                                         |
| ------------------------------------------------------------------------------------------- | ------ | ------------- | ---------------------------------------------------------------------------- |
| [L52](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L52)   | 🟢     | console-log   | `console.log(\`[AI-Generate] Request Type: ${type}, Locale: ${locale}\`);`   |
| [L53](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L53)   | 🟢     | console-log   | `console.log(`                                                               |
| [L61](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L61)   | 🟢     | console-log   | `console.log("[AI-Generate] Using provided 'messages' from request");`       |
| [L67](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L67)   | 🟢     | console-log   | `console.log("[AI-Generate] Building prompts internally based on payload");` |
| [L85](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L85)   | 🟢     | console-log   | `console.log("[AI-Generate] Attempting OpenRouter Provider...");`            |
| [L98](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L98)   | 🟢     | console-error | `console.warn(\`[AI-Generate] OpenRouter Failed: ${error.message}\`);`       |
| [L102](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L102) | 🟢     | console-log   | `console.log(`                                                               |
| [L118](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L118) | 🟢     | console-log   | `console.log("[AI-Generate] Using Gemini Direct Provider (Primary)...");`    |
| [L140](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L140) | 🟢     | console-error | `console.error("[AI-Generate] Global Error:", error.message);`               |
| [L203](file:////Users/alex/Develop/silksparks/supabase/functions/ai-generate/index.ts#L203) | 🟢     | magic-number  | `await new Promise((resolve) => setTimeout(resolve, 1000));`                 |

### [pages/Consultation.tsx](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx)

**问题数:** 6 (🔴0 🟡0 🟢6)

| 行号                                                                       | 严重性 | 类型                    | 内容                                                                            |
| -------------------------------------------------------------------------- | ------ | ----------------------- | ------------------------------------------------------------------------------- |
| [L11](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx#L11)   | 🟢     | empty-state-placeholder | `const [experts, setExperts] = React.useState<any[]>([]);`                      |
| [L248](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx#L248) | 🟢     | empty-state-placeholder | `const [expert, setExpert] = React.useState<any>(null);`                        |
| [L251](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx#L251) | 🟢     | empty-state-placeholder | `const [calendarDays, setCalendarDays] = React.useState<Date[]>([]);`           |
| [L252](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx#L252) | 🟢     | empty-state-placeholder | `const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);`     |
| [L253](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx#L253) | 🟢     | empty-state-placeholder | `const [selectedSlot, setSelectedSlot] = React.useState<string \| null>(null);` |
| [L708](file:////Users/alex/Develop/silksparks/pages/Consultation.tsx#L708) | 🟢     | empty-state-placeholder | `const [expert, setExpert] = React.useState<any>(null);`                        |

### [context/UserContext.tsx](file:////Users/alex/Develop/silksparks/context/UserContext.tsx)

**问题数:** 4 (🔴0 🟡0 🟢4)

| 行号                                                                        | 严重性 | 类型                    | 内容                                                     |
| --------------------------------------------------------------------------- | ------ | ----------------------- | -------------------------------------------------------- |
| [L104](file:////Users/alex/Develop/silksparks/context/UserContext.tsx#L104) | 🟢     | empty-state-placeholder | `const [session, setSession] = useState<any>(null);`     |
| [L161](file:////Users/alex/Develop/silksparks/context/UserContext.tsx#L161) | 🟢     | console-error           | `console.error("Error creating profile:", insertError);` |
| [L243](file:////Users/alex/Develop/silksparks/context/UserContext.tsx#L243) | 🟢     | console-error           | `console.error("Error fetching user profile:", error);`  |
| [L344](file:////Users/alex/Develop/silksparks/context/UserContext.tsx#L344) | 🟢     | console-error           | `console.error("Error creating appointment:", e);`       |

### [pages/Admin.tsx](file:////Users/alex/Develop/silksparks/pages/Admin.tsx)

**问题数:** 4 (🔴0 🟡0 🟢4)

| 行号                                                                | 严重性 | 类型                    | 内容                                                             |
| ------------------------------------------------------------------- | ------ | ----------------------- | ---------------------------------------------------------------- |
| [L260](file:////Users/alex/Develop/silksparks/pages/Admin.tsx#L260) | 🟢     | empty-state-placeholder | `const [currencies, setCurrencies] = React.useState<any[]>([]);` |
| [L382](file:////Users/alex/Develop/silksparks/pages/Admin.tsx#L382) | 🟢     | empty-state-placeholder | `const [zones, setZones] = React.useState<any[]>([]);`           |
| [L533](file:////Users/alex/Develop/silksparks/pages/Admin.tsx#L533) | 🟢     | console-error           | `console.error("Error fetching AI settings:", err);`             |
| [L552](file:////Users/alex/Develop/silksparks/pages/Admin.tsx#L552) | 🟢     | console-error           | `console.error("Error saving settings:", err);`                  |

### [pages/Commerce.tsx](file:////Users/alex/Develop/silksparks/pages/Commerce.tsx)

**问题数:** 4 (🔴0 🟡0 🟢4)

| 行号                                                                   | 严重性 | 类型                    | 内容                                                       |
| ---------------------------------------------------------------------- | ------ | ----------------------- | ---------------------------------------------------------- |
| [L15](file:////Users/alex/Develop/silksparks/pages/Commerce.tsx#L15)   | 🟢     | empty-state-placeholder | `const [products, setProducts] = useState<any[]>([]);`     |
| [L17](file:////Users/alex/Develop/silksparks/pages/Commerce.tsx#L17)   | 🟢     | empty-state-placeholder | `const [filters, setFilters] = useState<string[]>([]);`    |
| [L23](file:////Users/alex/Develop/silksparks/pages/Commerce.tsx#L23)   | 🟢     | empty-state-placeholder | `const [recs, setRecs] = useState<Product[]>([]);`         |
| [L412](file:////Users/alex/Develop/silksparks/pages/Commerce.tsx#L412) | 🟢     | empty-state-placeholder | `const [product, setProduct] = React.useState<any>(null);` |

### [services/ai/GeminiProvider.ts](file:////Users/alex/Develop/silksparks/services/ai/GeminiProvider.ts)

**问题数:** 4 (🔴0 🟡0 🟢4)

| 行号                                                                              | 严重性 | 类型          | 内容                                                                     |
| --------------------------------------------------------------------------------- | ------ | ------------- | ------------------------------------------------------------------------ |
| [L50](file:////Users/alex/Develop/silksparks/services/ai/GeminiProvider.ts#L50)   | 🟢     | console-error | `console.warn("[GeminiProvider] API Key 未配置，将使用 Mock 模式。");`   |
| [L76](file:////Users/alex/Develop/silksparks/services/ai/GeminiProvider.ts#L76)   | 🟢     | console-error | `console.warn("[GeminiProvider] 获取远程配置失败，使用默认配置:", err);` |
| [L139](file:////Users/alex/Develop/silksparks/services/ai/GeminiProvider.ts#L139) | 🟢     | console-error | `console.error("[GeminiProvider] 生成失败:", error);`                    |
| [L253](file:////Users/alex/Develop/silksparks/services/ai/GeminiProvider.ts#L253) | 🟢     | console-log   | `console.log("[GeminiProvider] 缓存已清除");`                            |

### [admin/pages/settings/list.tsx](file:////Users/alex/Develop/silksparks/admin/pages/settings/list.tsx)

**问题数:** 3 (🔴0 🟡0 🟢3)

| 行号                                                                              | 严重性 | 类型                    | 内容                                                                  |
| --------------------------------------------------------------------------------- | ------ | ----------------------- | --------------------------------------------------------------------- |
| [L29](file:////Users/alex/Develop/silksparks/admin/pages/settings/list.tsx#L29)   | 🟢     | empty-state-placeholder | `const [editingKey, setEditingKey] = useState<string \| null>(null);` |
| [L30](file:////Users/alex/Develop/silksparks/admin/pages/settings/list.tsx#L30)   | 🟢     | empty-state-placeholder | `const [editValue, setEditValue] = useState<string>("");`             |
| [L113](file:////Users/alex/Develop/silksparks/admin/pages/settings/list.tsx#L113) | 🟢     | console-error           | `console.error("Save error:", error);`                                |

### [pages/BirthChart.tsx](file:////Users/alex/Develop/silksparks/pages/BirthChart.tsx)

**问题数:** 3 (🔴0 🟡2 🟢1)

| 行号                                                                   | 严重性 | 类型                    | 内容                                                        |
| ---------------------------------------------------------------------- | ------ | ----------------------- | ----------------------------------------------------------- |
| [L25](file:////Users/alex/Develop/silksparks/pages/BirthChart.tsx#L25) | 🟡     | return-null-component   | `return null;`                                              |
| [L32](file:////Users/alex/Develop/silksparks/pages/BirthChart.tsx#L32) | 🟡     | return-null-component   | `return null;`                                              |
| [L14](file:////Users/alex/Develop/silksparks/pages/BirthChart.tsx#L14) | 🟢     | empty-state-placeholder | `const [aiAnalysis, setAiAnalysis] = useState<string>("");` |

### [services/GeminiService.ts](file:////Users/alex/Develop/silksparks/services/GeminiService.ts)

**问题数:** 3 (🔴0 🟡0 🟢3)

| 行号                                                                        | 严重性 | 类型          | 内容            |
| --------------------------------------------------------------------------- | ------ | ------------- | --------------- |
| [L24](file:////Users/alex/Develop/silksparks/services/GeminiService.ts#L24) | 🟢     | console-error | `console.warn(` |
| [L38](file:////Users/alex/Develop/silksparks/services/GeminiService.ts#L38) | 🟢     | console-error | `console.warn(` |
| [L53](file:////Users/alex/Develop/silksparks/services/GeminiService.ts#L53) | 🟢     | console-error | `console.warn(` |

### [App.tsx](file:////Users/alex/Develop/silksparks/App.tsx)

**问题数:** 2 (🔴0 🟡0 🟢2)

| 行号                                                      | 严重性 | 类型                    | 内容                                                                          |
| --------------------------------------------------------- | ------ | ----------------------- | ----------------------------------------------------------------------------- |
| [L27](file:////Users/alex/Develop/silksparks/App.tsx#L27) | 🟢     | empty-state-placeholder | `const [productId, setProductId] = useState<string \| undefined>(undefined);` |
| [L28](file:////Users/alex/Develop/silksparks/App.tsx#L28) | 🟢     | empty-state-placeholder | `const [expertId, setExpertId] = useState<string \| undefined>(undefined);`   |

### [admin/App.tsx](file:////Users/alex/Develop/silksparks/admin/App.tsx)

**问题数:** 2 (🔴0 🟡1 🟢1)

| 行号                                                              | 严重性 | 类型                  | 内容                    |
| ----------------------------------------------------------------- | ------ | --------------------- | ----------------------- |
| [L124](file:////Users/alex/Develop/silksparks/admin/App.tsx#L124) | 🟡     | return-null-component | `return null;`          |
| [L65](file:////Users/alex/Develop/silksparks/admin/App.tsx#L65)   | 🟢     | console-error         | `console.error(error);` |

### [components/Auth.tsx](file:////Users/alex/Develop/silksparks/components/Auth.tsx)

**问题数:** 2 (🔴0 🟡0 🟢2)

| 行号                                                                  | 严重性 | 类型                    | 内容                                                            |
| --------------------------------------------------------------------- | ------ | ----------------------- | --------------------------------------------------------------- |
| [L17](file:////Users/alex/Develop/silksparks/components/Auth.tsx#L17) | 🟢     | empty-state-placeholder | `const [error, setError] = useState<string \| null>(null);`     |
| [L18](file:////Users/alex/Develop/silksparks/components/Auth.tsx#L18) | 🟢     | empty-state-placeholder | `const [message, setMessage] = useState<string \| null>(null);` |

### [pages/Home.tsx](file:////Users/alex/Develop/silksparks/pages/Home.tsx)

**问题数:** 2 (🔴0 🟡0 🟢2)

| 行号                                                             | 严重性 | 类型                    | 内容                                                                             |
| ---------------------------------------------------------------- | ------ | ----------------------- | -------------------------------------------------------------------------------- |
| [L21](file:////Users/alex/Develop/silksparks/pages/Home.tsx#L21) | 🟢     | empty-state-placeholder | `const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);`       |
| [L25](file:////Users/alex/Develop/silksparks/pages/Home.tsx#L25) | 🟢     | empty-state-placeholder | `const [selectedProduct, setSelectedProduct] = useState<Product \| null>(null);` |

### [pages/UserDashboard.tsx](file:////Users/alex/Develop/silksparks/pages/UserDashboard.tsx)

**问题数:** 2 (🔴0 🟡0 🟢2)

| 行号                                                                        | 严重性 | 类型                    | 内容                                                                   |
| --------------------------------------------------------------------------- | ------ | ----------------------- | ---------------------------------------------------------------------- |
| [L538](file:////Users/alex/Develop/silksparks/pages/UserDashboard.tsx#L538) | 🟢     | empty-state-placeholder | `const [consultations, setConsultations] = React.useState<any[]>([]);` |
| [L656](file:////Users/alex/Develop/silksparks/pages/UserDashboard.tsx#L656) | 🟢     | empty-state-placeholder | `const [products, setProducts] = React.useState<any[]>([]);`           |

### [services/ai/SupabaseAIProvider.ts](file:////Users/alex/Develop/silksparks/services/ai/SupabaseAIProvider.ts)

**问题数:** 2 (🔴0 🟡0 🟢2)

| 行号                                                                                | 严重性 | 类型          | 内容                                                                 |
| ----------------------------------------------------------------------------------- | ------ | ------------- | -------------------------------------------------------------------- |
| [L67](file:////Users/alex/Develop/silksparks/services/ai/SupabaseAIProvider.ts#L67) | 🟢     | console-error | `console.error("[SupabaseAIProvider] Edge Function error:", error);` |
| [L85](file:////Users/alex/Develop/silksparks/services/ai/SupabaseAIProvider.ts#L85) | 🟢     | console-error | `console.error("[SupabaseAIProvider] 调用失败:", error);`            |

### [components/CartDrawer.tsx](file:////Users/alex/Develop/silksparks/components/CartDrawer.tsx)

**问题数:** 1 (🔴0 🟡0 🟢1)

| 行号                                                                        | 严重性 | 类型          | 内容                                       |
| --------------------------------------------------------------------------- | ------ | ------------- | ------------------------------------------ |
| [L66](file:////Users/alex/Develop/silksparks/components/CartDrawer.tsx#L66) | 🟢     | console-error | `console.error("Checkout error:", error);` |

### [components/Layouts.tsx](file:////Users/alex/Develop/silksparks/components/Layouts.tsx)

**问题数:** 1 (🔴0 🟡0 🟢1)

| 行号                                                                     | 严重性 | 类型                    | 内容                                                             |
| ------------------------------------------------------------------------ | ------ | ----------------------- | ---------------------------------------------------------------- |
| [L20](file:////Users/alex/Develop/silksparks/components/Layouts.tsx#L20) | 🟢     | empty-state-placeholder | `const [notifications, setNotifications] = useState<any[]>([]);` |

### [context/CartContext.tsx](file:////Users/alex/Develop/silksparks/context/CartContext.tsx)

**问题数:** 1 (🔴0 🟡0 🟢1)

| 行号                                                                      | 严重性 | 类型          | 内容                                       |
| ------------------------------------------------------------------------- | ------ | ------------- | ------------------------------------------ |
| [L32](file:////Users/alex/Develop/silksparks/context/CartContext.tsx#L32) | 🟢     | console-error | `console.error("Failed to load cart", e);` |

### [services/RecommendationEngine.ts](file:////Users/alex/Develop/silksparks/services/RecommendationEngine.ts)

**问题数:** 1 (🔴0 🟡0 🟢1)

| 行号                                                                               | 严重性 | 类型          | 内容                                                         |
| ---------------------------------------------------------------------------------- | ------ | ------------- | ------------------------------------------------------------ |
| [L35](file:////Users/alex/Develop/silksparks/services/RecommendationEngine.ts#L35) | 🟢     | console-error | `console.error("Error fetching products for recs:", error);` |

### [services/ai/index.ts](file:////Users/alex/Develop/silksparks/services/ai/index.ts)

**问题数:** 1 (🔴0 🟡0 🟢1)

| 行号                                                                   | 严重性 | 类型          | 内容                                                                       |
| ---------------------------------------------------------------------- | ------ | ------------- | -------------------------------------------------------------------------- |
| [L71](file:////Users/alex/Develop/silksparks/services/ai/index.ts#L71) | 🟢     | console-error | `console.warn(\`[AIService] 提供商 "${provider}" 未实现，保持当前设置\`);` |

### [tests/e2e/favorites.spec.ts](file:////Users/alex/Develop/silksparks/tests/e2e/favorites.spec.ts)

**问题数:** 1 (🔴0 🟡1 🟢0)

| 行号                                                                          | 严重性 | 类型                | 内容          |
| ----------------------------------------------------------------------------- | ------ | ------------------- | ------------- |
| [L34](file:////Users/alex/Develop/silksparks/tests/e2e/favorites.spec.ts#L34) | 🟡     | hardcoded-fake-data | `"Test User"` |

## 🚨 高优先级问题汇总

这些问题应该优先处理：

### empty-arrow-handler (2处)

**描述:** 空箭头函数事件处理器

| 文件                                                                                             | 行号 |
| ------------------------------------------------------------------------------------------------ | ---- |
| [scripts/shell-detector.ts](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L7) | L7   |
| [scripts/shell-detector.ts](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L7) | L7   |

### placeholder-href (2处)

**描述:** 占位符链接 href="#"

| 文件                                                                                              | 行号 |
| ------------------------------------------------------------------------------------------------- | ---- |
| [scripts/shell-detector.ts](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L9)  | L9   |
| [scripts/shell-detector.ts](file:////Users/alex/Develop/silksparks/scripts/shell-detector.ts#L69) | L69  |

## 💡 建议操作

### 高优先级修复 (🔴)

1. **空事件处理器** - 添加实际逻辑或使用 toast/modal 提示"功能开发中"
2. **alert() 调用** - 替换为正式的 UI 组件 (如 Toast, Dialog)
3. **占位符链接** - 替换为真实路由或移除
4. **空 Promise 回调** - 添加错误处理逻辑

### 中优先级修复 (🟡)

1. **TODO/FIXME** - 逐一审查并创建 issue 跟踪
2. **模拟数据** - 替换为真实 API 调用
3. **TypeScript 忽略** - 修复类型问题

### 低优先级清理 (🟢)

1. **console.log** - 在生产构建中移除或使用日志库
2. **ESLint disable** - 检查是否有更好的解决方案

---

_报告由 shell-detector.js 自动生成_
