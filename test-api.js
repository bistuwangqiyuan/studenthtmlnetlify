// 本地 API 测试脚本
// 运行: node test-api.js

const BASE_URL = process.env.TEST_URL || 'http://localhost:8888';

let authToken = null;
let testStudentId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRequest(name, path, options = {}) {
  log(`\n测试: ${name}`, 'blue');
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (authToken && !options.noAuth) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data = null;

    if (response.status !== 204 && contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (response.ok) {
      log(`✅ ${name} - 成功 (${response.status})`, 'green');
      return { success: true, data, response };
    } else {
      log(`❌ ${name} - 失败 (${response.status}): ${data?.error || '未知错误'}`, 'red');
      return { success: false, data, response };
    }
  } catch (error) {
    log(`❌ ${name} - 异常: ${error.message}`, 'red');
    return { success: false, error };
  }
}

async function runTests() {
  log('开始 API 测试...', 'yellow');
  log(`目标地址: ${BASE_URL}`, 'yellow');

  // 1. 测试登录
  const loginResult = await testRequest(
    '管理员登录',
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin',
      }),
    }
  );

  if (!loginResult.success) {
    log('\n❌ 登录失败，无法继续测试', 'red');
    return;
  }

  authToken = loginResult.data.token;
  log(`Token: ${authToken.substring(0, 20)}...`, 'green');

  // 2. 测试获取当前管理员信息
  await testRequest('获取管理员信息', '/api/auth/me');

  // 3. 测试获取学生列表
  const studentsResult = await testRequest('获取学生列表', '/api/students');
  
  if (studentsResult.success && studentsResult.data.students.length > 0) {
    log(`   已有学生数量: ${studentsResult.data.students.length}`, 'green');
  }

  // 4. 测试新增学生
  const newStudentResult = await testRequest(
    '新增学生',
    '/api/students',
    {
      method: 'POST',
      body: JSON.stringify({
        studentNumber: 'TEST' + Date.now(),
        name: '测试学生',
        gender: '男',
        age: 20,
        major: '测试专业',
        className: '测试班级',
        contact: '13800138000',
        notes: '这是一条测试数据',
      }),
    }
  );

  if (newStudentResult.success) {
    testStudentId = newStudentResult.data.student.id;
    log(`   学生ID: ${testStudentId}`, 'green');
  }

  // 5. 测试更新学生
  if (testStudentId) {
    await testRequest(
      '更新学生',
      `/api/students/${testStudentId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          studentNumber: 'TEST' + Date.now(),
          name: '测试学生（已修改）',
          gender: '女',
          age: 21,
          major: '测试专业（已修改）',
          className: '测试班级',
          contact: '13900139000',
          notes: '这是修改后的测试数据',
        }),
      }
    );
  }

  // 6. 测试搜索学生
  await testRequest('搜索学生', '/api/students?search=测试');

  // 7. 测试获取课程列表
  const coursesResult = await testRequest('获取课程列表', '/api/courses');
  
  if (coursesResult.success && coursesResult.data.courses.length > 0) {
    log(`   已有课程数量: ${coursesResult.data.courses.length}`, 'green');
  }

  // 8. 测试获取教师列表
  const teachersResult = await testRequest('获取教师列表', '/api/teachers');
  
  if (teachersResult.success && teachersResult.data.teachers.length > 0) {
    log(`   已有教师数量: ${teachersResult.data.teachers.length}`, 'green');
  }

  // 9. 测试删除学生
  if (testStudentId) {
    await testRequest(
      '删除学生',
      `/api/students/${testStudentId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // 10. 测试中文编码
  log('\n检查中文编码...', 'blue');
  const studentsCheck = await testRequest('验证中文显示', '/api/students');
  if (studentsCheck.success && studentsCheck.data.students.length > 0) {
    const firstStudent = studentsCheck.data.students[0];
    log(`   示例学生姓名: ${firstStudent.name}`, 'green');
    if (firstStudent.name.includes('�') || firstStudent.name.includes('?')) {
      log('   ⚠️ 检测到乱码问题！', 'red');
    } else {
      log('   ✅ 中文显示正常', 'green');
    }
  }

  // 11. 测试未授权访问
  await testRequest(
    '测试无Token访问',
    '/api/students',
    { noAuth: true }
  );

  log('\n\n测试完成！', 'yellow');
}

runTests().catch(error => {
  log(`\n致命错误: ${error.message}`, 'red');
  console.error(error);
});

