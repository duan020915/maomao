# 冒冒 iOS 测试版准备

此分支是独立的 iOS 工程，不会修改现有的公司 App。冒冒使用独立标识 `com.duan020915.maomao`，Xcode 自动签名团队为 Yuzeum, Inc.（`JM6LGTVJX8`）。冒冒已有独立的 App Store Connect 记录。

## 当前状态

- Capacitor iOS 工程已创建；iPhone 16e（iOS 18.6）模拟器已安装并启动连接正式后端的构建，登录界面可见。
- GitHub Pages 网页版与 iOS 共用根目录源码，均连接独立 Supabase 项目 `gjmgepuszmoxdacwnfhb`；构建脚本要求提供它的 URL 和 publishable key。
- 买不买申请和投票已增加 Supabase 持久化及群组成员访问限制。四段 SQL 已在新项目执行成功；邮箱确认已开启，验证链接会返回 App。
- Build 6 已通过外部 Beta App Review。Build 7 已上传、完成出口合规声明，并分配给内部组 WIFI 和外部组 WFI，状态为 Testing。Build 7 使用与 GitHub Pages 相同的网页源码，补充小日程正文的系统黑体、推送令牌保存重试，并将 iOS 启动画面和 WebView 背景设为浅色。已在 iPhone 16 Pro（iOS 18.6）模拟器验证页面能打开；一位测试者反馈 Build 6 在 iPhone 15 Pro Max（iOS 27.0.1）持续黑屏，需在更新 Build 7 后复测。

## 新 Supabase 项目

新项目地址：`https://gjmgepuszmoxdacwnfhb.supabase.co`。数据库已在 2026-10-23 按顺序执行：

1. `supabase/schema.sql`
2. `supabase/migrations/20261021_timeline_rsvp.sql`
3. `supabase/migrations/20261022_rsvp_reason.sql`
4. `supabase/migrations/20261023_approvals.sql`

iOS 邮箱验证回跳地址为 `maomao-duan020915://auth-callback`。网页版的 `https://duan020915.github.io/maomao/` 已加入 Authentication → URL Configuration 的 Redirect URLs；iOS 回跳地址继续保留。测试者验证邮箱后回到 App，再使用邮箱和密码登录。正式构建使用项目的 URL 和 **publishable** key；不要使用 `service_role` key。

## 本地构建

需要 Node.js 22+ 和 Xcode。先运行 `npm install`。仅检查排版时运行 `npm run ios:web:demo && npx cap sync ios`；它包含明确的演示数据，不能作为真实 TestFlight 包。

正式构建前，在当前终端设置 `MAOMAO_SUPABASE_URL`、`MAOMAO_SUPABASE_PUBLISHABLE_KEY`，可选 `MAOMAO_AUTH_REDIRECT_URL`，然后运行 `npm run ios:sync`。`www/` 和 iOS 工程内同步的网页文件由脚本生成，不提交到 Git。

Xcode 已选择 Yuzeum, Inc. 团队并成功归档。Build 7 已分配给内部测试组 WIFI 和外部测试组 WFI。推送数据库事件与 Edge Function 已部署；只有登录账号且在 App 的「有人喊你」页面开启手机通知、成功登记生产环境设备的用户，才能收到新内容的系统通知。游客模式只保存在本机。还需在真机上验证通知、登录、创建圈子、发布内容、上传照片、审批和投票。
