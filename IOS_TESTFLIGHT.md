# 冒冒 iOS 测试版准备

此分支是独立的 iOS 工程，不会修改现有的公司 App。冒冒使用独立标识 `com.duan020915.maomao`，Xcode 自动签名团队为 Yuzeum, Inc.（`JM6LGTVJX8`）。TestFlight 上传时需为冒冒新建独立的 App Store Connect 记录。

## 当前状态

- Capacitor iOS 工程已创建；iPhone 16e（iOS 18.6）模拟器已安装并启动连接正式后端的构建，登录界面可见。
- GitHub Pages 网页版与 iOS 共用根目录源码，均连接独立 Supabase 项目 `gjmgepuszmoxdacwnfhb`；构建脚本要求提供它的 URL 和 publishable key。
- 买不买申请和投票已增加 Supabase 持久化及群组成员访问限制。四段 SQL 已在新项目执行成功；邮箱确认已开启，验证链接会返回 App。
- 最新共享源码已成功生成 iOS 签名归档；尚未在真实 iPhone 上验证，也尚未上传 TestFlight。现有 App Store 描述文件缺少小组件 App Group 和推送权限，导出待 Apple Developer 签名配置更新。

## 新 Supabase 项目

新项目地址：`https://gjmgepuszmoxdacwnfhb.supabase.co`。数据库已在 2026-10-23 按顺序执行：

1. `supabase/schema.sql`
2. `supabase/migrations/20261021_timeline_rsvp.sql`
3. `supabase/migrations/20261022_rsvp_reason.sql`
4. `supabase/migrations/20261023_approvals.sql`

iOS 邮箱验证回跳地址为 `maomao-duan020915://auth-callback`。网页版还需要在 Authentication → URL Configuration 的 Redirect URLs 中允许 `https://duan020915.github.io/maomao/`。测试者验证邮箱后回到 App，再使用邮箱和密码登录。正式构建使用项目的 URL 和 **publishable** key；不要使用 `service_role` key。

## 本地构建

需要 Node.js 22+ 和 Xcode。先运行 `npm install`。仅检查排版时运行 `npm run ios:web:demo && npx cap sync ios`；它包含明确的演示数据，不能作为真实 TestFlight 包。

正式构建前，在当前终端设置 `MAOMAO_SUPABASE_URL`、`MAOMAO_SUPABASE_PUBLISHABLE_KEY`，可选 `MAOMAO_AUTH_REDIRECT_URL`，然后运行 `npm run ios:sync`。`www/` 和 iOS 工程内同步的网页文件由脚本生成，不提交到 Git。

Xcode 已选择 Yuzeum, Inc. 团队并成功归档。完成真机登录、创建圈子、发布内容、上传照片、审批和投票测试后，上传到 **新建的 App Store Connect App 记录**。内部测试员需要 App Store Connect 权限；外部测试可能需要 Apple 的 TestFlight 审核。
