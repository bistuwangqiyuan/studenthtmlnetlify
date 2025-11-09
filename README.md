# 🎓 学生信息管理系统

一个现代化的学生信息管理系统，部署在 Netlify，使用 Neon PostgreSQL 数据库。

[![部署状态](https://api.netlify.com/api/v1/badges/b4a1fb5c-3bca-4ce8-ad30-49c22f6a22e5/deploy-status)](https://app.netlify.com/sites/studentmnextnetlify/deploys)

🌐 **在线演示**: https://studentmnextnetlify.netlify.app

## ✨ 功能特性

- ✅ **管理员系统** - 安全的登录/注册，JWT 认证
- ✅ **学生管理** - 完整的增删改查功能，支持搜索
- ✅ **课程管理** - 课程信息管理，学分统计
- ✅ **教师管理** - 教师信息维护
- ✅ **实时搜索** - 前端即时搜索，无需等待
- ✅ **响应式设计** - 完美支持手机、平板、电脑
- ✅ **中文优化** - UTF-8 编码，无乱码
- ✅ **现代 UI** - 人性化界面，流畅动画

## 🛠️ 技术栈

### 前端
- 原生 **HTML5 / CSS3 / JavaScript**
- 无框架依赖，轻量高效
- 移动优先的响应式设计

### 后端
- **Netlify Functions** (Serverless)
- **Node.js** 运行时
- JWT 认证 + bcrypt 密码加密

### 数据库
- **Neon PostgreSQL** (Serverless)
- 连接池优化
- SSL 加密连接

### 部署
- **Netlify** 自动化部署
- CDN 加速
- HTTPS 默认开启

## 🚀 快速开始

### 1️⃣ 克隆项目

```bash
git clone https://github.com/bistuwangqiyuan/studenthtmlnetlify.git
cd studenthtmlnetlify
```

### 2️⃣ 安装依赖

```bash
npm install
```

### 3️⃣ 配置环境变量

在 Netlify 中设置：

```bash
netlify env:set NEON_DATABASE_URL "你的数据库URL"
netlify env:set JWT_SECRET "随机生成的长字符串"
```

### 4️⃣ 初始化数据库

```bash
node scripts/init-db.js
```

### 5️⃣ 部署到 Netlify

```bash
netlify deploy --prod
```

⚠️ **重要**：部署前请先在 Netlify 控制台移除 Next.js 插件，详见 [`DEPLOYMENT_FIX.md`](./DEPLOYMENT_FIX.md)

## 📖 默认账号

- 用户名：`admin`
- 密码：`admin`

**⚠️ 首次登录后请立即修改密码！**

## 📁 项目结构

```
studenthtmlnetlify/
├── src/                      # 前端静态资源
│   ├── index.html           # 主页面
│   ├── styles.css           # 全局样式
│   └── app.js               # 前端逻辑
├── netlify/functions/       # Serverless API
│   ├── _shared/             # 共享模块
│   ├── auth.js              # 认证 API
│   ├── students.js          # 学生 API
│   ├── courses.js           # 课程 API
│   └── teachers.js          # 教师 API
├── scripts/init-db.js       # 数据库初始化
├── netlify.toml             # Netlify 配置
└── package.json             # 依赖管理
```

## 🔌 API 接口

所有 API 端点前缀：`/api`

### 认证相关
- `POST /auth/login` - 管理员登录
- `POST /auth/register` - 注册管理员
- `GET /auth/me` - 获取当前用户

### 学生管理
- `GET /students` - 获取所有学生
- `POST /students` - 新增学生
- `PUT /students/:id` - 更新学生
- `DELETE /students/:id` - 删除学生

### 课程管理
- `GET /courses` - 获取所有课程
- `POST /courses` - 新增课程
- `PUT /courses/:id` - 更新课程
- `DELETE /courses/:id` - 删除课程

### 教师管理
- `GET /teachers` - 获取所有教师
- `POST /teachers` - 新增教师
- `PUT /teachers/:id` - 更新教师
- `DELETE /teachers/:id` - 删除教师

## 🧪 测试

完整测试指南请查看 [`COMPLETE_TESTING_GUIDE.md`](./COMPLETE_TESTING_GUIDE.md)

快速测试：

```bash
# 运行自动化 API 测试
TEST_URL=https://studentmnextnetlify.netlify.app node test-api.js
```

## ❓ 常见问题

### Q: 部署失败，提示 "Next.js build output not found"

**A**: 需要在 Netlify 控制台移除 Next.js 插件，详见 [`DEPLOYMENT_FIX.md`](./DEPLOYMENT_FIX.md)

### Q: 登录失败

**A**: 检查环境变量和数据库初始化：
```bash
netlify env:list
node scripts/init-db.js
```

## 🔒 安全建议

1. ✅ 部署后立即修改默认密码
2. ✅ 使用强随机字符串作为 JWT_SECRET
3. ✅ 定期更新依赖包
4. ✅ 不要在代码中硬编码敏感信息

## 📝 许可证

ISC License

## 👨‍💻 作者

Wang Qiyuan - wangqiyuan@bistu.edu.cn

---

⭐ 如果这个项目对你有帮助，请给个 Star！
