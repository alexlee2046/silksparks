# Supabase Edge Functions

本目录包含 Supabase Edge Functions，用于安全地代理 AI 请求。

## 目录结构

```
supabase/functions/
├── ai-generate/        # AI 生成代理
│   └── index.ts        # 主函数入口
├── deno.json           # Deno 配置
└── README.md           # 本文档
```

## 本地开发

### 1. 登录 Supabase

```bash
supabase login
```

### 2. 链接项目

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. 设置 Secrets

```bash
# 设置 Gemini API Key (生产环境)
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

### 4. 本地运行函数

```bash
# 启动本地 Edge Function 服务器
supabase functions serve ai-generate --env-file .env.local
```

### 5. 测试函数

```bash
curl -X POST http://localhost:54321/functions/v1/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "daily_spark",
    "payload": { "sign": "Taurus" },
    "locale": "zh-CN"
  }'
```

## 部署到生产

### 1. 部署函数

```bash
supabase functions deploy ai-generate
```

### 2. 验证部署

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"type": "daily_spark", "payload": {"sign": "Taurus"}}'
```

## 支持的请求类型

### 1. 星盘分析 (birth_chart)

```json
{
  "type": "birth_chart",
  "payload": {
    "name": "Alex",
    "planets": { "Sun": "Taurus", "Moon": "Cancer", ... },
    "elements": { "Wood": 20, "Fire": 30, ... }
  },
  "locale": "zh-CN"
}
```

### 2. 塔罗解读 (tarot)

```json
{
  "type": "tarot",
  "payload": {
    "cards": [{ "name": "The Fool", "isReversed": false }],
    "question": "What message does today hold?",
    "spreadType": "single"
  },
  "locale": "en-US"
}
```

### 3. 每日灵感 (daily_spark)

```json
{
  "type": "daily_spark",
  "payload": { "sign": "Leo" },
  "locale": "zh-CN"
}
```

## 响应格式

```json
{
  "success": true,
  "data": {
    "text": "AI 生成的内容..."
  },
  "meta": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "latencyMs": 1234
  }
}
```

## 故障排除

### 401 Unauthorized

- 确保请求头包含有效的 `Authorization: Bearer YOUR_ANON_KEY`

### 500 Internal Server Error

- 检查 `GEMINI_API_KEY` 是否正确设置：`supabase secrets list`

### CORS 错误

- Edge Function 已配置 CORS，如仍有问题请检查请求来源
