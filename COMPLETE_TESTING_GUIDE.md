# 🚀 完整部署和测试指南

## ⚠️ 紧急修复：移除 Next.js 插件

### 第一步：移除不必要的插件

1. 访问 Netlify 站点集成设置页面：
   ```
   https://app.netlify.com/sites/studentmnextnetlify/configuration/integrations
   ```

2. 找到并卸载以下插件：
   - ✖️ **@netlify/plugin-nextjs** (Next.js Runtime)
   - ✖️ 任何其他 Next.js 相关插件

3. 保留必要的插件：
   - ✅ **Neon** (数据库扩展)

### 第二步：触发重新部署

移除插件后，在项目目录运行：

```powershell
netlify deploy --prod
```

或者直接在 Netlify 控制台点击 "Trigger deploy" → "Deploy site"

---

## ✅ 已完成的修复

### 1. 环境变量配置 ✅

已设置的环境变量：
- `NEON_DATABASE_URL` - Neon 数据库连接字符串（pooled）
- `JWT_SECRET` - 安全的 JWT 密钥

### 2. 数据库初始化 ✅

已创建的表：
- `administrators` - 管理员表
- `students` - 学生信息表
- `courses` - 课程信息表
- `teachers` - 教师信息表

已插入的数据：
- 默认管理员：`admin / admin`
- 3 条示例学生数据
- 3 条示例课程数据
- 3 条示例教师数据

### 3. 代码修复 ✅

- ✅ API 响应头添加 `Content-Type: application/json; charset=utf-8`
- ✅ 确保中文不会出现乱码
- ✅ CORS 头配置正确
- ✅ JWT 认证流程完整
- ✅ 前端错误处理完善

---

## 📋 完整测试清单

### 部署后立即测试

1. **访问站点**
   ```
   https://studentmnextnetlify.netlify.app
   ```

2. **检查页面加载**
   - [ ] 页面正常显示
   - [ ] 中文显示无乱码
   - [ ] 无控制台错误（按 F12 查看）

3. **登录测试**
   - [ ] 使用 `admin / admin` 登录
   - [ ] 登录成功后看到管理面板
   - [ ] 顶部显示用户名

### 功能测试

#### 学生信息管理
- [ ] 查看学生列表（应该有 3 条示例数据）
- [ ] 搜索学生（输入"张伟"或"计算机"）
- [ ] 新增学生
  ```
  学号：2024001
  姓名：李明
  性别：男
  年龄：19
  专业：软件工程
  班级：软工2401
  联系方式：13912345678
  备注：新增测试
  ```
- [ ] 编辑学生（点击"编辑"按钮）
- [ ] 删除学生（点击"删除"按钮）

#### 课程信息管理
- [ ] 切换到"课程信息"标签
- [ ] 查看课程列表（应该有 3 条示例数据）
- [ ] 新增课程
  ```
  课程代码：CS401
  课程名称：软件测试
  学分：3
  授课教师：李老师
  课程描述：软件测试理论与实践
  ```
- [ ] 编辑和删除课程

#### 教师信息管理
- [ ] 切换到"教师信息"标签
- [ ] 查看教师列表（应该有 3 条示例数据）
- [ ] 新增教师
  ```
  教师编号：T004
  姓名：李老师
  职称：讲师
  邮箱：li@example.com
  电话：13700007777
  院系：软件学院
  ```
- [ ] 编辑和删除教师

### 安全测试
- [ ] 退出登录
- [ ] 验证无法访问管理面板
- [ ] 重新登录
- [ ] 尝试创建新管理员（需要先登录）

### 响应式测试
- [ ] 在手机屏幕下测试（Chrome DevTools → Toggle Device Toolbar）
- [ ] 表格可以横向滚动
- [ ] 表单字段正常显示

### 中文编码测试
- [ ] 所有中文字符显示正确
- [ ] 输入中文后保存，再次查看仍显示正确
- [ ] 搜索中文内容正常工作

---

## 🔧 手动测试 API

可以用浏览器控制台或 `test-api.js` 脚本测试：

### 浏览器控制台测试

打开网站后按 F12，在 Console 中运行：

```javascript
// 1. 登录
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' })
});
const { token } = await loginRes.json();
console.log('Token:', token);

// 2. 获取学生列表
const studentsRes = await fetch('/api/students', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const students = await studentsRes.json();
console.log('Students:', students);
```

### 使用测试脚本

```powershell
# 测试线上环境
$env:TEST_URL="https://studentmnextnetlify.netlify.app"; node test-api.js

# 测试本地环境
netlify dev
# 另开一个终端：
node test-api.js
```

---

## ❌ 常见问题排查

### 问题1：部署失败 "Next.js build output not found"

**原因**：Next.js 插件仍然启用

**解决**：
1. 访问 https://app.netlify.com/sites/studentmnextnetlify/configuration/integrations
2. 卸载 `@netlify/plugin-nextjs`
3. 重新部署

### 问题2：登录失败 "Environment variable NEON_DATABASE_URL is not set"

**原因**：环境变量未设置或名称错误

**解决**：
```powershell
netlify env:set NEON_DATABASE_URL "你的数据库URL"
```

### 问题3：登录失败 "Invalid username or password"

**原因**：数据库未初始化

**解决**：
```powershell
node scripts/init-db.js
```

### 问题4：中文乱码

**原因**：数据库连接字符集问题或响应头缺失

**解决**：已在代码中修复，确保部署最新代码

### 问题5：API 404 错误

**原因**：Netlify 重定向规则未生效

**解决**：检查 `netlify.toml` 配置是否正确

---

## 📊 预期结果

部署成功后，你应该能看到：

1. ✅ 一个现代化、响应式的学生信息管理系统
2. ✅ 完整的登录/注册功能
3. ✅ 学生、课程、教师的增删改查
4. ✅ 实时搜索功能
5. ✅ 中文完美支持
6. ✅ 移动端友好界面

---

## 🎯 下一步

部署成功后：

1. **修改默认密码**
   - 创建新的管理员账号
   - 删除或更改默认的 `admin/admin` 账号

2. **清理测试数据**
   - 删除测试时添加的数据
   - 添加真实的学生/课程/教师信息

3. **自定义配置**
   - 根据需要调整 JWT 过期时间
   - 配置更强的密码策略
   - 添加更多字段或功能

---

## 📞 需要帮助？

如果遇到任何问题，请提供：
1. 浏览器控制台的错误信息（F12 → Console）
2. 网络请求的详细信息（F12 → Network）
3. 具体的操作步骤


