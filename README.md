# 学生信息管理系统（Netlify + Neon）

一个部署在 Netlify 上的前后端一体化学生信息管理系统，使用 Netlify Functions 作为后端访问 Neon 云端 PostgreSQL 数据库，提供管理员认证及学生 / 课程 / 教师信息的增删改查功能。

## 主要特性

- ✨ **响应式界面**：移动优先布局，中文界面无乱码。
- 🔐 **管理员认证**：支持登录 / 注册，密码使用 `bcrypt` 加密存储，JWT 持久化登录状态。
- 📚 **多模块管理**：学生、课程、教师信息模块支持新增、编辑、删除、模糊查询。
- ☁️ **云端部署友好**：无传统后端服务器，全部逻辑运行于 Netlify Functions；使用 Neon 数据库。
- 🧰 **一键初始化**：提供脚本自动创建数据表并注入默认管理员与示例数据。

## 技术栈

- 前端：原生 HTML、CSS、JavaScript
- 后端：Netlify Functions（Node.js 18）
- 数据库：Neon PostgreSQL
- 鉴权：JWT（`jsonwebtoken`）+ `bcryptjs`

## 项目结构

```
.
├── netlify.toml                 # Netlify 构建与函数配置
├── package.json                 # 依赖声明
├── src/                         # 静态前端资源（由 Netlify 直接发布）
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── netlify/
│   └── functions/               # Netlify Functions 源码
│       ├── _shared/             # 公共工具（数据库、HTTP、鉴权等）
│       ├── auth.js              # 管理员登录、注册、会话查询
│       ├── students.js          # 学生信息 CRUD
│       ├── courses.js           # 课程信息 CRUD
│       └── teachers.js          # 教师信息 CRUD
├── scripts/
│   └── init-db.js               # 数据库初始化脚本（创建表与默认数据）
└── env.example                  # 环境变量示例
```

## 前置准备

1. **Neon 数据库**
   - 在 [Neon](https://neon.tech/) 中创建项目与数据库。
   - 获取数据库连接 URL（形如 `postgres://user:password@host/db`）。

2. **Netlify 环境变量**
   - 在 Netlify 项目中设置以下环境变量：
     - `NEON_DATABASE_URL`：Neon 的 PostgreSQL 连接字符串。
     - `JWT_SECRET`：用于签发 JWT 的长随机字符串。

3. **本地调试（可选）**
   - 安装 Netlify CLI：`npm install -g netlify-cli`
   - 在项目根目录创建 `.env`，参考 `env.example`。

## 初始化数据库

> 初次部署前请运行一次，创建数据表并插入默认数据（包括 `admin / admin` 管理员账号）。

```bash
cp env.example .env # Windows 可手动复制
# 编辑 .env，填入 NEON_DATABASE_URL 与 JWT_SECRET
node scripts/init-db.js
```

如果成功，将看到类似输出：

```
🔧 Initialising database schema...
✅ Tables ensured.
👤 Default administrator account created (admin/admin).
🎓 Seeded sample students.
📚 Seeded sample courses.
👩‍🏫 Seeded sample teachers.
✅ Database initialisation completed successfully.
```

## 本地开发与调试

```bash
npm install
netlify dev
```

Netlify CLI 会启动本地开发服务器：

- 前端：`http://localhost:8888`
- API：通过 `/api/*` 代理到本地函数

确保 `.env` 中的环境变量已配置，否则函数会报错。

## 部署

1. 将代码推送至 Git 仓库并连接到 Netlify。
2. 在 Netlify 项目的 “Site settings → Build & deploy → Environment” 中填入 `NEON_DATABASE_URL` 与 `JWT_SECRET`。
3. 触发部署。构建命令会运行 `npm run build:noop`（无实际打包步骤），Netlify 会把 `src/` 目录作为静态资源发布，并自动部署函数。
4. 完成后访问站点域名，即可使用系统功能。

## 默认管理员账号

- 账号：`admin`
- 密码：`admin`

建议首次登录后立即在系统内创建新的管理员账号，并停用默认密码。

## 常见问题

| 问题 | 解决方案 |
| --- | --- |
| 前端提示 “登录已过期” | 确认 Netlify 的 `JWT_SECRET` 与本地 `.env` 一致。 |
| CRUD 接口报 500 错 | 查看 Netlify Functions 日志，确认数据库连接信息正确，Neon 项目未休眠。 |
| 注册提示需登录 | 出于安全考虑，系统仅允许在已登录状态下新增管理员账号。 |
| 中文显示乱码 | 页面统一使用 UTF-8 编码，若仍存在问题，检查浏览器编码设置。 |

## 后续改进思路

- 增加分页及批量导入导出功能。
- 支持课程与教师之间的关联管理。
- 引入更完善的表单校验与操作日志。
- 接入角色权限，区分不同管理员的操作范围。

---

如需二次开发或集成更多功能，欢迎在 issue 中提出需求或想法。祝开发顺利！🎉

