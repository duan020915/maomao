# 冒冒 Next.js 手账原型

独立迁移原型，**不会替换现有 preview 或 main**。当前仅「冒个泡」为真实 React 组件；其他导航条目是尚未迁移的占位入口。

## 本地运行

```bash
git fetch origin
git switch nextjs-migration
cd next-app
npm install
npm run dev
```

浏览 `http://localhost:3000/maomao/`。如本机 3000 端口被占用，以终端提示端口为准。

## 当前范围

- 彩色不规则撕纸纸条、纸张背景、胶带、右侧心情 PNG 贴纸
- 12 种心情选择；本地添加纸条、点赞和评论（仅内存状态，刷新后重置）
- 手机与桌面响应式布局

尚未迁移：Supabase 登录、真实好友动态、日历、邀约、「买不买」审批、通知和正式部署。旧版功能都保留在 preview 分支。

## 静态部署

`next.config.ts` 设置了 `output: "export"` 和 GitHub Pages 的 `/maomao` basePath。`npm run build` 后静态产物位于 `next-app/out`，正式切换前须配置 GitHub Pages 构建发布流程，不能把仓库分支直接切过去。
