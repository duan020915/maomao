# 冒冒 iOS 测试版准备

此分支是独立的 iOS 工程，不会修改现有的公司 App 或 App Store Connect 记录。冒冒暂用独立标识 `com.duan020915.maomao`，上传前需要在所选 Apple 开发团队确认可注册。用户已决定暂不使用公司的 Yuzeum 开发团队；Xcode 的签名团队保持 None。

## 当前状态

- Capacitor iOS 工程已创建；无签名的 iOS 模拟器构建可通过。
- 网页预览仍使用模拟数据。iOS 正式构建连接新建的独立 Supabase 项目 `gjmgepuszmoxdacwnfhb`；构建脚本要求提供它的 URL 和 publishable key。
- 买不买申请和投票已增加 Supabase 持久化及群组成员访问限制。四段 SQL 已在新项目执行成功；邮箱确认已开启，验证链接会返回 App。
- 尚未在真实 iPhone 上验证，也尚未签名或上传 TestFlight。继续上传需要非公司 Apple Developer Program 团队。

## 新 Supabase 项目

新项目地址：`https://gjmgepuszmoxdacwnfhb.supabase.co`。数据库已在 2026-10-23 按顺序执行：

1. `supabase/schema.sql`
2. `supabase/migrations/20261021_timeline_rsvp.sql`
3. `supabase/migrations/20261022_rsvp_reason.sql`
4. `supabase/migrations/20261023_approvals.sql`

Authentication → URL Configuration 已把 Site URL 和允许的跳转地址设为 `maomao-duan020915://auth-callback`。测试者验证邮箱后回到 App，再使用邮箱和密码登录。正式构建使用项目的 URL 和 **publishable** key；不要使用 `service_role` key。

## 本地构建

需要 Node.js 22+ 和 Xcode。先运行 `npm install`。仅检查排版时运行 `npm run ios:web:demo && npx cap sync ios`；它包含明确的演示数据，不能作为真实 TestFlight 包。

正式构建前，在当前终端设置 `MAOMAO_SUPABASE_URL`、`MAOMAO_SUPABASE_PUBLISHABLE_KEY`，可选 `MAOMAO_AUTH_REDIRECT_URL`，然后运行 `npm run ios:sync`。`www/` 和 iOS 工程内同步的网页文件由脚本生成，不提交到 Git。

在 Xcode 中确认 `com.duan020915.maomao` 可在你选定的非公司开发团队使用，并选择该团队。完成真机登录、创建圈子、发布内容、上传照片、审批和投票测试后，再单独归档并上传到 **新建的 App Store Connect App 记录**。内部测试员需要 App Store Connect 权限；外部测试可能需要 Apple 的 TestFlight 审核。
