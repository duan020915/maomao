# 冒冒

在你的世界，冒个泡。朋友之间分享心情、日常与按天日程的网页应用。

- 线上应用：https://duan020915.github.io/maomao/
- 邮箱注册与登录、邮箱验证、账号云端保存。
- 创建多个群组、邀请码加入、群组切换和成员筛选。
- 「哪天见」：全员按天日程，日／周／月视图、日期前后切换、手机左右滑动、日期跳转。没有时间轴；暂无安排不等同于有空。
- 「冒个泡」：心情、文字、照片、评论和回应。
- 「约一约」：发起按日期的群组邀约、报名，显示到共享日历。
- 「我的小窝」：资料编辑、当前群组个人统计、退出登录。
- 「有人喊你」：朋友对自己分享的回应和报名。

未登录时可以使用游客模式；游客的圈子、日程、心情、评论和审批仅保存在当前浏览器或 iOS 设备。登录后读取 Supabase 账号内容，游客内容不会自动导入。账号可加入多个群组；登录状态每 30 秒自动刷新。

## 本地运行

使用任意静态 HTTP 服务器，例如 `npx http-server . -p 4173`。`npm run check` 验证 JavaScript 语法。网页使用固定版本 Supabase SDK；无需构建。

## 云端

前端由 GitHub Actions 从 `main` 分支根目录发布到 GitHub Pages。Capacitor iOS 构建也从同一目录复制网页文件。两端连接同一个独立 Supabase 项目，账号内容使用 `mm_` 表同步。网站邮箱验证回跳地址需在 Supabase Authentication → URL Configuration 的 Redirect URLs 中包含 `https://duan020915.github.io/maomao/`。

`config.js` 仅包含公开 Publishable key。数据库用 Row Level Security 限制群组成员读取，作者只能编辑自己的内容；创建和加入群组经 RPC 校验。邀请码允许登录用户加入，请只发给想邀请的朋友。

在其他 Supabase 项目部署时执行 `supabase/schema.sql`，替换 `config.js` 中的公开 URL 和 Publishable key，并在 Authentication → URL Configuration 加入网站 Redirect URL。保留邮箱验证。正式开放大量注册前配置自己的 SMTP 服务。

## 当前版本范围

此版本支持指定日期的活动报名。多候选日期投票、日程提醒推送、成员移除／退出群组、私密忙碌状态和历史回忆页尚未实现。通知为站内回应记录，不发送系统推送。照片压缩后保存到数据库，仅群内可读。多人同时编辑同一条自己的记录时，后保存的内容生效。
