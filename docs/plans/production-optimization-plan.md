# 生产环境优化与安全加固计划

## 1. 安全加固 (Security Hardening)

- [ ] **Supabase 服务**: 移除 `services/supabase.ts` 中的硬编码 URL 和 Anon Key。强制使用环境变量，防止凭据泄露。
- [ ] **AI 服务**: 检查 `services/GeminiService.ts`，确保 API Key 仅通过环境变量传递。
- [ ] **敏感信息扫描**: 全局扫描代码库，清除任何残留的硬编码凭据 (API Keys, Secrets)。

## 2. 也是最佳实践 (Best Practices)

- [ ] **环境变量**: 确保所有外部服务配置都提取到环境变量中，并在 `.env.example` 中有对应文档。
- [ ] **错误处理**: 当关键环境变量缺失时，提供清晰的错误提示，而不是静默失败或使用不安全的默认值。

## 3. 资源优化 (Asset Optimization)

- [ ] **图片审计**: 检查 `public/assets` (特别是塔罗牌图片) 的大小，评估是否需要压缩。

## 4. 最终验证 (Pre-flight Check)

- [ ] 运行类型检查 (`tsc`) 确保重构安全。
- [ ] 提交更改并触发部署。
