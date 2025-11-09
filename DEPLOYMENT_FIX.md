# 部署问题修复指南

## 问题
Netlify 尝试使用 Next.js 插件构建项目，但这是一个纯静态 HTML/JS 项目，不是 Next.js 项目。

## 解决方案

### 步骤 1：移除 Next.js 插件

1. 访问 Netlify 网站控制台：
   **https://app.netlify.com/sites/studentmnextnetlify/configuration/integrations**

2. 找到 `@netlify/plugin-nextjs` 或 "Next.js Runtime" 插件

3. 点击卸载/移除该插件

### 步骤 2：重新部署

移除插件后，运行：

```powershell
netlify deploy --prod
```

## 已修复的问题

✅ 环境变量名称已修复：
- 添加了 `NEON_DATABASE_URL`（代码中需要）
- 设置了安全的 `JWT_SECRET`

✅ 数据库已初始化：
- 创建了所有表（administrators, students, courses, teachers）
- 预置了默认管理员账号 `admin/admin`
- 插入了示例数据

✅ API 响应头已修复：
- 添加了 `Content-Type: application/json; charset=utf-8`
- 确保中文不会乱码

## 测试

移除插件并部署后，访问：
**https://studentmnextnetlify.netlify.app**

使用默认账号登录：
- 用户名：`admin`
- 密码：`admin`

## 如果仍有问题

检查浏览器控制台（F12）和网络请求，查看具体错误信息。

