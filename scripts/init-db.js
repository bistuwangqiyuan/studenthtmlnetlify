/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('Missing NEON_DATABASE_URL in environment.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const run = async () => {
  try {
    console.log('🔧 Initialising database schema...');

    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS administrators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        gender TEXT,
        age INT,
        major TEXT,
        class_name TEXT,
        contact TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        credit_hours INT,
        teacher TEXT,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        title TEXT,
        email TEXT,
        phone TEXT,
        department TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Tables ensured.');

    const defaultAdminUsername = 'admin';
    const defaultAdminPassword = 'admin';

    const { rows: adminExists } = await pool.query(
      'SELECT 1 FROM administrators WHERE username = $1',
      [defaultAdminUsername]
    );

    if (adminExists.length === 0) {
      const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);
      await pool.query(
        `INSERT INTO administrators (username, password_hash)
         VALUES ($1, $2);`,
        [defaultAdminUsername, passwordHash]
      );
      console.log('👤 Default administrator account created (admin/admin).');
    } else {
      console.log('👤 Default administrator already exists.');
    }

    const { rows: studentCountRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM students;'
    );

    if (studentCountRows[0].count === 0) {
      await pool.query(
        `
        INSERT INTO students
          (student_number, name, gender, age, major, class_name, contact, notes)
        VALUES
          ('2023001', '张伟', '男', 20, '计算机科学', '计科2301', '13800001111', '热爱编程'),
          ('2023002', '李娜', '女', 19, '软件工程', '软工2302', '13900002222', '学生会成员'),
          ('2023003', '王强', '男', 21, '信息管理', '信管2301', '13700003333', '喜欢篮球');
      `
      );
      console.log('🎓 Seeded sample students.');
    } else {
      console.log('🎓 Students table already has data, skipping seed.');
    }

    const { rows: courseCountRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM courses;'
    );

    if (courseCountRows[0].count === 0) {
      await pool.query(
        `
        INSERT INTO courses
          (course_code, name, credit_hours, teacher, description)
        VALUES
          ('CS101', '程序设计基础', 4, '赵老师', 'C 语言的基础语法与程序设计思维'),
          ('CS205', '数据结构', 3, '钱老师', '线性表、树与图的结构与算法'),
          ('CS310', 'Web 开发', 3, '孙老师', '前端与后端的综合实践课程');
      `
      );
      console.log('📚 Seeded sample courses.');
    } else {
      console.log('📚 Courses table already has data, skipping seed.');
    }

    const { rows: teacherCountRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM teachers;'
    );

    if (teacherCountRows[0].count === 0) {
      await pool.query(
        `
        INSERT INTO teachers
          (teacher_code, name, title, email, phone, department)
        VALUES
          ('T001', '赵老师', '教授', 'zhao@example.com', '13600004444', '计算机学院'),
          ('T002', '钱老师', '副教授', 'qian@example.com', '13500005555', '软件学院'),
          ('T003', '孙老师', '讲师', 'sun@example.com', '13400006666', '信息学院');
      `
      );
      console.log('👩‍🏫 Seeded sample teachers.');
    } else {
      console.log('👩‍🏫 Teachers table already has data, skipping seed.');
    }

    console.log('✅ Database initialisation completed successfully.');
  } catch (error) {
    console.error('❌ Database initialisation failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();

