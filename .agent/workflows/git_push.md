---
description: 带有 Vercel 构建检查的完整 Git 推送工作流：涵盖本地质量检查、Vercel 构建模拟，以及最后的 Git Commit & Push
---

# 🛸 Full Git & Vercel Push Workflow（最终部署推送检查）

> 此工作流继承了 `pre_flight` 的所有本地检查，并增加了 **Vercel 本地构建模拟**。
> 只有在本地环境和 Vercel 构建模拟全部通过后，才会执行 `git add`, `commit` 和 `push`。

---

## 阶段 1: 继承 Pre-Flight 本地检查

1. **依赖与格式检查**
   // turbo
   - 运行 `npm ci`
   - 运行 `npx prettier --check .`
   - 运行 `npx tsc --noEmit`

2. **本地项目构建**
   // turbo
   - 运行 `npm run build`
   - 确保本地 Vite 构建无误

---

## 阶段 2: Vercel 环境验证（核心）

3. **拉取 Vercel 远程配置**
   // turbo
   - 运行 `vercel pull --yes --environment=preview`
   - 确保本地环境变量与远程同步

4. **模拟 Vercel 云端构建**
   // turbo
   - 运行 `vercel build`
   - 这一步会严格执行 Vercel 端的构建逻辑，包括环境变量和文件大小写检查

---

## 阶段 3: Git 提交与推送

5. **执行本地提交**
   - 询问用户 commit message（或者使用默认信息）
     // turbo
   - 运行 `git add .`
   - 运行 `git commit -m "[user provided message]"`

6. **推送到 GitHub**
   // turbo
   - 运行 `git push origin main`

---

## 结果汇总

7. **生成报告**
   - 汇总构建与推送结果：
     ```
     ✅ 本地基础检查: 通过
     ✅ Vercel 构建模拟: 通过
     ✅ Git 提交: 成功
     ✅ GitHub 推送: 已完成
     ```

8. **通知用户**
   - ✅ 任务完成，代码已安全送达 GitHub 并准备好在 Vercel 生产环境生效！

---

## 触发方式

- `/git_push`
- "完整推送"
- "Vercel 检查并推送"
- "git 推送带部署验证"
