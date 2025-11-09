const state = {
  token: localStorage.getItem('authToken'),
  admin: null,
  students: [],
  courses: [],
  teachers: [],
  editing: {
    student: null,
    course: null,
    teacher: null,
  },
};

const elements = {
  currentYear: document.getElementById('current-year'),
  authSection: document.getElementById('auth-section'),
  dashboard: document.getElementById('dashboard'),
  greetingName: document.getElementById('greeting-name'),
  adminDetails: document.getElementById('admin-details'),
  adminName: document.getElementById('admin-name'),
  adminTime: document.getElementById('admin-time'),
  logoutButton: document.getElementById('logout-button'),
  authTabs: document.querySelectorAll('.tab'),
  authForms: {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
  },
  authMessage: document.getElementById('auth-message'),
  moduleTabs: document.querySelectorAll('.module-tab'),
  panels: {
    students: document.getElementById('students-panel'),
    courses: document.getElementById('courses-panel'),
    teachers: document.getElementById('teachers-panel'),
  },
  tables: {
    students: document.getElementById('students-table-body'),
    courses: document.getElementById('courses-table-body'),
    teachers: document.getElementById('teachers-table-body'),
  },
  forms: {
    student: document.getElementById('student-form'),
    course: document.getElementById('course-form'),
    teacher: document.getElementById('teacher-form'),
  },
  formTitles: {
    student: document.getElementById('student-form-title'),
    course: document.getElementById('course-form-title'),
    teacher: document.getElementById('teacher-form-title'),
  },
  searchInputs: {
    student: document.getElementById('student-search'),
    course: document.getElementById('course-search'),
    teacher: document.getElementById('teacher-search'),
  },
  globalMessage: document.getElementById('global-message'),
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const showAuthMessage = (type, message) => {
  elements.authMessage.textContent = message;
  elements.authMessage.className = `message ${type}`;
};

const clearAuthMessage = () => {
  elements.authMessage.textContent = '';
  elements.authMessage.className = 'message';
};

const showGlobalMessage = (type, message) => {
  elements.globalMessage.textContent = message;
  elements.globalMessage.className = `message ${type}`;
  if (message) {
    setTimeout(() => {
      elements.globalMessage.textContent = '';
      elements.globalMessage.className = 'message';
    }, 4000);
  }
};

const apiFetch = async (path, options = {}) => {
  const init = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (state.token) {
    init.headers.Authorization = `Bearer ${state.token}`;
  }

  if (options.body) {
    init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const response = await fetch(`/api${path}`, init);

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || '请求失败，请稍后重试。');
    error.status = response.status;
    throw error;
  }

  return payload;
};

const updateLayout = () => {
  const isAuthenticated = Boolean(state.token && state.admin);

  if (isAuthenticated) {
    elements.authSection.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    elements.adminDetails.classList.add('visible');
    elements.adminName.textContent = state.admin.username;
    elements.greetingName.textContent = state.admin.username;
    elements.adminTime.textContent = `最近登录：${new Date().toLocaleString('zh-CN')}`;
  } else {
    elements.authSection.classList.remove('hidden');
    elements.dashboard.classList.add('hidden');
    elements.adminDetails.classList.remove('visible');
    elements.adminName.textContent = '';
    elements.greetingName.textContent = '';
    elements.adminTime.textContent = '';
  }
};

const handleUnauthorized = () => {
  state.token = null;
  state.admin = null;
  localStorage.removeItem('authToken');
  updateLayout();
  showAuthMessage('error', '登录已过期，请重新登录。');
};

const renderStudents = () => {
  const term = elements.searchInputs.student.value.trim().toLowerCase();
  const rows = state.students
    .filter((student) => {
      if (!term) {
        return true;
      }
      return (
        student.studentNumber.toLowerCase().includes(term) ||
        student.name.toLowerCase().includes(term) ||
        (student.major || '').toLowerCase().includes(term)
      );
    })
    .map(
      (student) => `
      <tr data-id="${student.id}">
        <td>${escapeHtml(student.studentNumber)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.gender || '-')}</td>
        <td>${student.age ?? '-'}</td>
        <td>${escapeHtml(student.major || '-')}</td>
        <td>${escapeHtml(student.className || '-')}</td>
        <td>${escapeHtml(student.contact || '-')}</td>
        <td>${escapeHtml(student.notes || '-')}</td>
        <td>
          <div class="table-actions">
            <button class="action-button edit" data-action="edit" data-entity="student">编辑</button>
            <button class="action-button delete" data-action="delete" data-entity="student">删除</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  elements.tables.students.innerHTML = rows || `
    <tr><td colspan="9">暂无学生数据，可通过右侧表单新增。</td></tr>
  `;
};

const renderCourses = () => {
  const term = elements.searchInputs.course.value.trim().toLowerCase();
  const rows = state.courses
    .filter((course) => {
      if (!term) {
        return true;
      }
      return (
        course.courseCode.toLowerCase().includes(term) ||
        course.name.toLowerCase().includes(term)
      );
    })
    .map(
      (course) => `
      <tr data-id="${course.id}">
        <td>${escapeHtml(course.courseCode)}</td>
        <td>${escapeHtml(course.name)}</td>
        <td>${course.creditHours ?? '-'}</td>
        <td>${escapeHtml(course.teacher || '-')}</td>
        <td>${escapeHtml(course.description || '-')}</td>
        <td>
          <div class="table-actions">
            <button class="action-button edit" data-action="edit" data-entity="course">编辑</button>
            <button class="action-button delete" data-action="delete" data-entity="course">删除</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  elements.tables.courses.innerHTML = rows || `
    <tr><td colspan="6">暂无课程数据，可通过右侧表单新增。</td></tr>
  `;
};

const renderTeachers = () => {
  const term = elements.searchInputs.teacher.value.trim().toLowerCase();
  const rows = state.teachers
    .filter((teacher) => {
      if (!term) {
        return true;
      }
      return (
        teacher.teacherCode.toLowerCase().includes(term) ||
        teacher.name.toLowerCase().includes(term) ||
        (teacher.department || '').toLowerCase().includes(term)
      );
    })
    .map(
      (teacher) => `
      <tr data-id="${teacher.id}">
        <td>${escapeHtml(teacher.teacherCode)}</td>
        <td>${escapeHtml(teacher.name)}</td>
        <td>${escapeHtml(teacher.title || '-')}</td>
        <td>${escapeHtml(teacher.email || '-')}</td>
        <td>${escapeHtml(teacher.phone || '-')}</td>
        <td>${escapeHtml(teacher.department || '-')}</td>
        <td>
          <div class="table-actions">
            <button class="action-button edit" data-action="edit" data-entity="teacher">编辑</button>
            <button class="action-button delete" data-action="delete" data-entity="teacher">删除</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  elements.tables.teachers.innerHTML = rows || `
    <tr><td colspan="7">暂无教师数据，可通过右侧表单新增。</td></tr>
  `;
};

const loadStudents = async () => {
  const { students } = await apiFetch('/students');
  state.students = students;
  renderStudents();
};

const loadCourses = async () => {
  const { courses } = await apiFetch('/courses');
  state.courses = courses;
  renderCourses();
};

const loadTeachers = async () => {
  const { teachers } = await apiFetch('/teachers');
  state.teachers = teachers;
  renderTeachers();
};

const resetEditingState = (entity) => {
  state.editing[entity] = null;
  elements.forms[entity].dataset.editId = '';
  const titles = {
    student: '新增学生',
    course: '新增课程',
    teacher: '新增教师',
  };
  elements.formTitles[entity].textContent = titles[entity];
};

const fillForm = (entity, data) => {
  const form = elements.forms[entity];
  Object.entries(data).forEach(([key, value]) => {
    if (form.elements[key] !== undefined) {
      form.elements[key].value = value ?? '';
    }
  });
};

const handleLogin = async (event) => {
  event.preventDefault();
  clearAuthMessage();

  const form = event.target;
  const formData = new FormData(form);
  const payload = {
    username: formData.get('username').trim(),
    password: formData.get('password'),
  };

  if (!payload.username || !payload.password) {
    showAuthMessage('error', '请输入用户名和密码。');
    return;
  }

  try {
    const { token, admin } = await apiFetch('/auth/login', {
      method: 'POST',
      body: payload,
    });
    state.token = token;
    state.admin = admin;
    localStorage.setItem('authToken', token);
    showAuthMessage('success', `欢迎回来，${admin.username}！`);
    form.reset();
    await Promise.all([loadStudents(), loadCourses(), loadTeachers()]);
    updateLayout();
  } catch (error) {
    showAuthMessage('error', error.message);
  }
};

const handleRegister = async (event) => {
  event.preventDefault();
  clearAuthMessage();

  const form = event.target;
  const formData = new FormData(form);
  const payload = {
    username: formData.get('username').trim(),
    password: formData.get('password'),
  };

  if (!payload.username || !payload.password) {
    showAuthMessage('error', '请输入用户名和密码。');
    return;
  }

  try {
    const { admin } = await apiFetch('/auth/register', {
      method: 'POST',
      body: payload,
    });
    showAuthMessage('success', `管理员 ${admin.username} 创建成功！`);
    form.reset();
  } catch (error) {
    if (error.status === 401) {
      showAuthMessage('error', '请先登录，再创建新的管理员账号。');
    } else {
      showAuthMessage('error', error.message);
    }
  }
};

const handleLogout = () => {
  state.token = null;
  state.admin = null;
  localStorage.removeItem('authToken');
  updateLayout();
  showAuthMessage('info', '您已退出登录。');
};

const handleModuleTabClick = (event) => {
  const button = event.currentTarget;
  const panelId = button.dataset.panel;

  elements.moduleTabs.forEach((tab) => tab.classList.toggle('active', tab === button));
  Object.values(elements.panels).forEach((panel) => panel.classList.add('hidden'));

  if (panelId === 'students-panel') {
    elements.panels.students.classList.remove('hidden');
  } else if (panelId === 'courses-panel') {
    elements.panels.courses.classList.remove('hidden');
  } else if (panelId === 'teachers-panel') {
    elements.panels.teachers.classList.remove('hidden');
  }
};

const attachTableActions = () => {
  elements.tables.students.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const row = button.closest('tr');
    const id = row?.dataset.id;
    if (!id) return;

    const action = button.dataset.action;

    if (action === 'edit') {
      const student = state.students.find((item) => item.id === id);
      if (!student) return;
      state.editing.student = id;
      elements.forms.student.dataset.editId = id;
      elements.formTitles.student.textContent = '编辑学生';
      fillForm('student', {
        studentNumber: student.studentNumber,
        name: student.name,
        gender: student.gender || '',
        age: student.age ?? '',
        major: student.major || '',
        className: student.className || '',
        contact: student.contact || '',
        notes: student.notes || '',
      });
      elements.forms.student.scrollIntoView({ behavior: 'smooth' });
    }

    if (action === 'delete') {
      if (!confirm('确认删除该学生信息吗？')) return;
      try {
        await apiFetch(`/students/${id}`, { method: 'DELETE' });
        state.students = state.students.filter((student) => student.id !== id);
        renderStudents();
        showGlobalMessage('success', '学生信息已删除。');
        if (state.editing.student === id) {
          elements.forms.student.reset();
          resetEditingState('student');
        }
      } catch (error) {
        if (error.status === 401) {
          handleUnauthorized();
        } else {
          showGlobalMessage('error', error.message);
        }
      }
    }
  });

  elements.tables.courses.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const row = button.closest('tr');
    const id = row?.dataset.id;
    if (!id) return;

    const action = button.dataset.action;

    if (action === 'edit') {
      const course = state.courses.find((item) => item.id === id);
      if (!course) return;
      state.editing.course = id;
      elements.forms.course.dataset.editId = id;
      elements.formTitles.course.textContent = '编辑课程';
      fillForm('course', {
        courseCode: course.courseCode,
        name: course.name,
        creditHours: course.creditHours ?? '',
        teacher: course.teacher || '',
        description: course.description || '',
      });
      elements.forms.course.scrollIntoView({ behavior: 'smooth' });
    }

    if (action === 'delete') {
      if (!confirm('确认删除该课程信息吗？')) return;
      try {
        await apiFetch(`/courses/${id}`, { method: 'DELETE' });
        state.courses = state.courses.filter((course) => course.id !== id);
        renderCourses();
        showGlobalMessage('success', '课程信息已删除。');
        if (state.editing.course === id) {
          elements.forms.course.reset();
          resetEditingState('course');
        }
      } catch (error) {
        if (error.status === 401) {
          handleUnauthorized();
        } else {
          showGlobalMessage('error', error.message);
        }
      }
    }
  });

  elements.tables.teachers.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const row = button.closest('tr');
    const id = row?.dataset.id;
    if (!id) return;

    const action = button.dataset.action;

    if (action === 'edit') {
      const teacher = state.teachers.find((item) => item.id === id);
      if (!teacher) return;
      state.editing.teacher = id;
      elements.forms.teacher.dataset.editId = id;
      elements.formTitles.teacher.textContent = '编辑教师';
      fillForm('teacher', {
        teacherCode: teacher.teacherCode,
        name: teacher.name,
        title: teacher.title || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        department: teacher.department || '',
      });
      elements.forms.teacher.scrollIntoView({ behavior: 'smooth' });
    }

    if (action === 'delete') {
      if (!confirm('确认删除该教师信息吗？')) return;
      try {
        await apiFetch(`/teachers/${id}`, { method: 'DELETE' });
        state.teachers = state.teachers.filter((teacher) => teacher.id !== id);
        renderTeachers();
        showGlobalMessage('success', '教师信息已删除。');
        if (state.editing.teacher === id) {
          elements.forms.teacher.reset();
          resetEditingState('teacher');
        }
      } catch (error) {
        if (error.status === 401) {
          handleUnauthorized();
        } else {
          showGlobalMessage('error', error.message);
        }
      }
    }
  });
};

const submitEntityForm = async (entity, event) => {
  event.preventDefault();
  showGlobalMessage('info', '正在处理，请稍候...');

  const form = elements.forms[entity];
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  Object.keys(data).forEach((key) => {
    if (data[key] === '') {
      data[key] = undefined;
    }
  });

  const id = form.dataset.editId;
  const isEditing = Boolean(id);
  const endpoint =
    entity === 'student' ? 'students' : entity === 'course' ? 'courses' : 'teachers';

  try {
    if (entity === 'student') {
      if (data.age !== undefined) {
        data.age = data.age === undefined ? undefined : Number(data.age);
      }
    }

    if (entity === 'course' && data.creditHours !== undefined) {
      data.creditHours =
        data.creditHours === undefined ? undefined : Number(data.creditHours);
    }

    if (isEditing) {
      await apiFetch(`/${endpoint}/${id}`, {
        method: 'PUT',
        body: data,
      });
      showGlobalMessage('success', '信息更新成功。');
    } else {
      await apiFetch(`/${endpoint}`, {
        method: 'POST',
        body: data,
      });
      showGlobalMessage('success', '信息新增成功。');
    }

    form.reset();
    resetEditingState(entity);

    if (entity === 'student') {
      await loadStudents();
    } else if (entity === 'course') {
      await loadCourses();
    } else {
      await loadTeachers();
    }
  } catch (error) {
    if (error.status === 401) {
      handleUnauthorized();
    } else {
      showGlobalMessage('error', error.message);
    }
  }
};

const attachFormListeners = () => {
  elements.forms.student.addEventListener('submit', submitEntityForm.bind(null, 'student'));
  elements.forms.course.addEventListener('submit', submitEntityForm.bind(null, 'course'));
  elements.forms.teacher.addEventListener('submit', submitEntityForm.bind(null, 'teacher'));

  elements.forms.student.addEventListener('reset', () => resetEditingState('student'));
  elements.forms.course.addEventListener('reset', () => resetEditingState('course'));
  elements.forms.teacher.addEventListener('reset', () => resetEditingState('teacher'));
};

const attachSearchListeners = () => {
  elements.searchInputs.student.addEventListener('input', renderStudents);
  elements.searchInputs.course.addEventListener('input', renderCourses);
  elements.searchInputs.teacher.addEventListener('input', renderTeachers);
};

const attachAuthTabs = () => {
  elements.authTabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      elements.authTabs.forEach((t) => t.classList.toggle('active', t === tab));
      Object.values(elements.authForms).forEach((form) => form.classList.remove('active'));
      const targetForm = document.getElementById(targetId);
      targetForm.classList.add('active');
      clearAuthMessage();
    })
  );
};

const bootstrap = async () => {
  elements.currentYear.textContent = new Date().getFullYear();

  elements.authForms.login.addEventListener('submit', handleLogin);
  elements.authForms.register.addEventListener('submit', handleRegister);
  elements.logoutButton.addEventListener('click', handleLogout);

  elements.moduleTabs.forEach((tab) =>
    tab.addEventListener('click', handleModuleTabClick)
  );

  attachAuthTabs();
  attachTableActions();
  attachFormListeners();
  attachSearchListeners();

  updateLayout();

  if (state.token) {
    try {
      const { admin } = await apiFetch('/auth/me');
      state.admin = admin;
      updateLayout();
      await Promise.all([loadStudents(), loadCourses(), loadTeachers()]);
    } catch (error) {
      handleUnauthorized();
      if (error.status !== 401) {
        showAuthMessage('error', error.message);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', bootstrap);

