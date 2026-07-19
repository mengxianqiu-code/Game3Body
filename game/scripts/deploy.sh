#!/usr/bin/env bash
# scripts/deploy.sh
# 在 mydesktop 服务器上部署《三体 · 星际逃亡》到 nginx
# 用法：bash scripts/deploy.sh
# 前置：本仓库已 git clone 到 /opt/project/Game3Body，nginx site game3body 已启用

set -euo pipefail

# ============== 配置 ==============
REPO_DIR="/opt/project/Game3Body"
GAME_DIR="$REPO_DIR/game"
NGINX_SITE="game3body"
BRANCH="main"

# ============== 1. 同步代码 ==============
echo "▶ [1/5] git pull ($BRANCH)..."
cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
HEAD=$(git rev-parse --short HEAD)
echo "  当前 HEAD: $HEAD"

# ============== 2. 安装依赖 ==============
echo "▶ [2/5] npm ci..."
cd "$GAME_DIR"
# 没 node_modules 才装（避免每次都重装）
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund
else
  echo "  node_modules 已存在，跳过 npm ci"
fi

# ============== 3. 构建 ==============
echo "▶ [3/5] npm run build..."
npm run build

# ============== 4. 验证 nginx 配置 ==============
echo "▶ [4/5] nginx -t..."
nginx -t

# ============== 5. 热重载 ==============
echo "▶ [5/5] nginx reload..."
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  # 兜底：直接发 SIGHUP
  nginx -s reload
fi

# ============== 完成 ==============
DIST_SIZE=$(du -sh "$GAME_DIR/dist" 2>/dev/null | cut -f1)
echo ""
echo "✅ 部署完成"
echo "   HEAD:    $HEAD"
echo "   dist:    $DIST_SIZE"
echo "   URL:     https://game.duckdreams.top"
