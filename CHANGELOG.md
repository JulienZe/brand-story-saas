# Brand Story SaaS 更新日志

## [3.0.0] - 2026-05-07

### 🔧 修复：模型接入功能缺陷

**问题原因：**
1. `.env` 中缺少 `AI_PROVIDER`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL` 环境变量
2. 前端品牌故事创作页未传递模型配置参数到 API
3. 系统默认回退到 `mock` 模式，导致模型从未真正接入
4. Claude API 版本过旧（`2023-06-01`），部分请求失败
5. API 错误处理不完善，前端无法获知具体失败原因

**解决方案：**
1. 添加 `AI_PROVIDER`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL` 环境变量配置
2. 前端新增 AI 模型配置面板，支持运行时切换服务商和模型
3. API 路由增加前置校验：未配置 API Key 时返回明确错误（`API_KEY_MISSING`）
4. 更新 Claude API 版本至 `2024-10-22`，模型默认 `claude-3-5-sonnet-20241022`
5. 所有模型调用增加详细错误信息（HTTP 状态码 + API 返回消息）
6. OpenAI/DeepSeek 调用增加 `response_format: { type: 'json_object' }` 确保 JSON 输出
7. Ollama 调用增加健康检查（3秒超时），提前发现服务不可用

### ✨ 新增功能

- **前端模型选择器**：支持 DeepSeek、OpenAI、Claude、Ollama、模拟模式 5 种服务商
- **API Key 输入**：用户可在前端临时输入 API Key（仅本次会话有效，不存储）
- **自定义 Base URL**：支持代理/中转 API 地址
- **模型状态检测**：GET `/api/brand-story/generate` 返回当前配置状态和支持的服务商列表
- **生成结果元信息**：返回中包含 `provider`、`model`、`isMock` 标识

### 🔄 兼容性说明

- 向后兼容：未配置 AI 环境变量时自动回退到 `mock` 模式
- 前端 AI 配置为可选项，不填写时使用服务器默认配置
- `ContentGenerator` 接口不变，新增 `getConfig()` 方法
- `GenerationResult` 接口新增 `tokensUsed` 字段（预留）
- 数据库 schema 无变更，无需迁移

### 📋 测试结果

| 测试项 | 结果 |
|--------|------|
| GET /api/brand-story/generate 返回配置状态 | ✅ 通过 |
| DeepSeek API 连接（服务器配置） | ✅ 通过 |
| 模拟模式回退 | ✅ 通过 |
| 前端模型选择器 UI | ✅ 通过 |
| API Key 缺失时错误提示 | ✅ 通过 |
| Vercel 部署 | ✅ 通过 |

---

## [2.1.0] - 2026-05-06

### 初始 SaaS 版本

- 基于 nextjs/saas-starter 模版搭建
- 品牌故事五阶段 AI 工作流
- Stripe 支付集成
- Neon Postgres 数据库
- 用户认证与团队管理
