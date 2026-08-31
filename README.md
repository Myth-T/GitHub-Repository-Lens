# RepoLens · 仓库透镜

一个纯前端的 **GitHub 仓库阅读器**。在命令栏输入 `owner` 或 `owner/repo`（或直接粘贴 GitHub 链接），浏览器会直连 GitHub REST API，把一座仓库「读」成一份可交互的档案：

- **概览** — Star / Fork / Watcher、主语言、最近推送时间、话题标签
- **语言构成** — 按字节占比的彩色语言条 + 图例
- **活跃度** — 52 周提交热力曲线（悬停查看每周提交数）
- **目录结构** — 可展开的文件树（来自 Git Trees API）
- **提交记录** — 最近提交的时间线
- **贡献者** — 头像 + 提交数排行
- **README 渲染** — 直接在页内渲染仓库的 `README.md`

> 纯前端实现：无后端、无数据库。你的浏览器直接向 `api.github.com` 发请求，数据即时返回、即时渲染；命令历史只存在于页面内存，刷新即清空。

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3000)
npm run dev

# 类型检查
npm run typecheck

# 生产构建（产物输出到 dist/）
npm run build
```

## 技术栈

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4

## 部署到 GitHub Pages（可选）

1. 在 `vite.config.js` 里加一行 `base: "/你的仓库名/"`（仓库主页路径需要）。
2. `npm run build` 生成 `dist/`。
3. 在仓库 **Settings → Pages** 中，把构建产物指向 `dist/`（或用 GitHub Actions 自动部署）。

## 许可

MIT
