# 冒冒下一版：时间轴、邀约回复、通知与桌面体验

## 当前分支已实现（源码原型）

- 「哪天见」日视图改为 00:00–23:00 小时时间轴。可在新增/编辑计划和邀约时设置开始、结束时间；旧记录没有时间时显示在「全天 / 未填写时间」。
- 「约一约」新增参加、不参加、待定三种回复，使用数据库 RPC 原子地替换同一用户的旧回复。旧版「我也去」兼容显示。
- 「有人喊你」增加当前圈子的最近分享列表，并保留别人对自己内容的回应。
- 网页打开期间，每 30 秒查询最新分享；检测到别人的新记录显示站内 toast 弹窗。**非手机系统推送**。
- 添加 PWA manifest 和网站图标，用于 iPhone 主屏幕独立网页体验。**这不是 iOS WidgetKit 小组件**。

## 使用前必须完成的步骤

1. 得到原作者允许后再独立使用代码。
2. **不要**把本 Fork 当前的 `config.js` 用于测试：它仍指向原开发者的 Supabase。
3. 新建自己的 Supabase 项目，先运行 `supabase/schema.sql`，再运行 `supabase/migrations/20261021_timeline_rsvp.sql`。
4. 把 `config.js` 的 Supabase URL 和公开 publishable key 修改为你自己的项目，并配置 Authentication Redirect URLs。
5. 在隔离环境测试多账号数据、旧数据兼容、手机和桌面日历后再合并这个分支并部署。当前代码未在真实多人环境完成端到端测试。

## 系统 Push Notification（待开发）

要给已安装到 iPhone 主屏幕的 PWA 发送真正的锁屏通知，需要 Service Worker、PushSubscription 注册/撤销、数据库设备订阅表，以及可安全地访问 VAPID 私钥的后端发送服务（可用 Supabase Edge Functions）。发送者的客户端 **不能**直接掌握推送私钥。iOS/iPadOS 16.4+ 支持添加到主屏幕的 Web App 经用户点击授权后接收 Web Push。建议通知类型：新邀约、邀约回复、好友更新（可关闭）、日程提醒；避免过量推送。

## 真正的 iOS/macOS 小组件（待开发）

可添加到主屏幕/桌面的 **WidgetKit** 小组件，需要 Apple 平台原生 App + Widget Extension；仅靠 GitHub Pages/PWA 图标无法提供动态原生 Widget。可使用轻量 SwiftUI 宿主 App 读取同一 Supabase 用户账号和日程数据，再由 WidgetKit 显示「今天小圈子时间轴/下次邀约」。需要处理登录令牌安全、刷新频率与 WidgetKit 时间线策略。

## 建议验收

- 两个人加入同一个群组，创建不同时段的日程，两边按时间顺序可见。
- 同一受邀人依次选择可以、不能、待定，保证只留一个当前 RSVP。
- 不在群组的账户无法回复或读取活动。
- 打开网页收到别人的新分享时显示站内 toast；关闭网页不会收到系统推送（待开发）。
- 未迁移数据库时不要尝试写入：新字段和 RSVP RPC 会报错。
