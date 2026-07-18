# Cloudflare Pages 部署指南

本项目是纯静态前端（React 18 + Vite 5），输出 `dist/` 目录，可零成本托管到 Cloudflare Pages（全球 CDN + 免费 HTTPS + 持续部署）。

---

## 方式一：通过 GitHub 集成（推荐 · 自动部署）

### 1. 前置条件
- 已有一个 GitHub 账号
- 已有一个 Cloudflare 账号（[注册](https://dash.cloudflare.com/sign-up)）
- 本项目已推送到 GitHub（参考：`git remote add origin git@github.com:mengxianqiu-code/Game3Body.git`）

### 2. 创建 Pages 项目
1. 登录 Cloudflare Dashboard：<https://dash.cloudflare.com/>
2. 左侧栏选择 **Workers 和 Pages** → **Pages**
3. 点击 **创建应用程序** → 选择 **Pages** → **连接到 Git**
4. 授权 Cloudflare 访问你的 GitHub 账号，选择仓库 `Game3Body`

### 3. 配置构建设置
Cloudflare 会自动识别 Vite 项目，确认以下字段：

| 字段 | 值 |
|---|---|
| 项目名称 | `game3body`（或自定义，会成为 `*.game3body.pages.dev` 的子域） |
| 生产分支 | `main` |
| 框架预设 | **Vite**（自动检测） |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| 根目录 | `game` ← **重要**：因为源码在 `game/` 子目录里 |
| Node.js 版本 | `20`（在环境变量里设置 `NODE_VERSION=20`） |

> 💡 **根目录**：本仓库把游戏源码放在 `game/` 子目录下。Cloudflare Pages 默认以仓库根为构建根，必须把"根目录"改为 `game`，否则会找不到 `package.json`。

### 4. 设置环境变量（可选）
在 **设置 → 环境变量** 添加：
- `NODE_VERSION` = `20`
- `npm_config_production` = `false`（保留 devDependencies 用于构建）

### 5. 点击 **保存并部署**
首次部署通常 1-3 分钟。完成后会得到一个 `https://game3body.pages.dev` 的 URL。

### 6. 后续更新
之后 `git push origin main` 即可触发自动部署，每次 commit 都会生成一个 preview URL。

---

## 方式二：通过 Wrangler CLI（手动部署）

适合想要本地控制部署节奏、或无法连接 GitHub 的场景。

### 1. 安装 Wrangler
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler login
```
浏览器会弹出授权页，确认后终端返回登录成功。

### 3. 本地构建
```bash
cd game
npm install
npm run build
```
构建产物在 `game/dist/`。

### 4. 首次部署
```bash
cd game
wrangler pages deploy dist --project-name=game3body
```
首次会询问是否创建项目，回答 `yes`。之后每次部署会自动覆盖生产环境。

### 5. 自定义部署（preview / branch）
```bash
# 部署到预览环境（不覆盖生产）
wrangler pages deploy dist --project-name=game3body --branch=preview

# 指定 commit 消息
wrangler pages deploy dist --project-name=game3body --commit-message="fix: 修正 飞船 bug"
```

---

## 自定义域名（可选）

### 添加根域名
1. Cloudflare Pages 项目页 → **自定义域**
2. 点击 **设置自定义域** → 输入 `yourdomain.com`
3. Cloudflare 会提示添加 DNS 记录（如果域名托管在 Cloudflare 上则自动）
4. 等 SSL 证书签发（约 1-5 分钟）

### 添加子域
同上，输入 `game.yourdomain.com`，DNS 添加 CNAME 指向 `game3body.pages.dev`。

---

## 部署前检查清单

- [ ] **本地构建通过**：`npm run build` 无错误
- [ ] **产物大小合理**：`dist/` 应该 < 500 KB（本项目 ~280 KB）
- [ ] **路径无硬编码**：本项目所有路由都是 `index.html` 内的 state（`GAME_PHASE`），不需要 SPA fallback
- [ ] **localStorage 兼容**：Cloudflare Pages 是静态托管，浏览器 localStorage 可正常使用
- [ ] **Web Audio 兼容**：纯静态资源，无需服务端 API

---

## 常见问题

### Q1: 部署后页面空白 / 资源 404
**A**: 大概率是"根目录"配置错了。检查 Cloudflare Pages → 设置 → 构建 → 根目录是否设置为 `game`。
也可以看构建日志：构建成功 → 部署失败 → 检查 `dist/` 路径里有没有 `index.html`。

### Q2: 想跳过子目录直接部署根仓库
**A**: 可以用 Cloudflare Dashboard 在仓库根创建一个 `package.json` 转发到 `game/`，或者把项目提到仓库根（本项目因为含三个开发成员的子目录结构才用了 `game/`）。

### Q3: 需要 Cloudflare Workers 做后端吗？
**A**: 不需要。本项目是纯前端游戏，数据存在 localStorage。如果未来想加多人联机 / 在线排行榜，再扩展 Workers 即可。

### Q4: 部署到 Pages 后访问慢？
**A**: Pages 默认走 Cloudflare 全球 CDN（300+ 节点），国内访问延迟可能偏高。如果目标用户在大陆：
- 选项 A：用 Cloudflare Workers + 自定义域名套国内 CDN（CF 合作伙伴）
- 选项 B：直接部署到 Vercel / Netlify（同样有全球 CDN）
- 选项 C：部署到阿里云 / 腾讯云 OSS + CDN（国内速度最快）

### Q5: 怎么回滚到上一个版本？
**A**: Cloudflare Pages → 部署 → 找到历史部署 → 点击 **回滚到该部署**。所有构建都保留 30 天。

---

## 部署后访问地址

部署成功后：
- **生产 URL**：`https://game3body.pages.dev`
- **预览 URL**：每次 push 会生成 `https://<commit-hash>.game3body.pages.dev`

打开 URL 即可看到游戏主菜单。

---

## 参考资料

- Cloudflare Pages 官方文档：<https://developers.cloudflare.com/pages/>
- Wrangler CLI 文档：<https://developers.cloudflare.com/workers/wrangler/>
- Vite 部署指南：<https://vitejs.dev/guide/static-deploy.html#cloudflare-pages>