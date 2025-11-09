const { query } = require('./_shared/db');
const {
  okResponse,
  errorResponse,
  handleOptions,
  parseJsonBody,
  getPathSegments,
} = require('./_shared/http');
const { verifyToken } = require('./_shared/auth');

const normalizeTeacher = (row) => ({
  id: row.id,
  teacherCode: row.teacher_code,
  name: row.name,
  title: row.title,
  email: row.email,
  phone: row.phone,
  department: row.department,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const ensureAuthenticated = (event) => {
  try {
    return verifyToken(event);
  } catch (authError) {
    const error = new Error(authError.message);
    error.statusCode = authError.statusCode || 401;
    throw error;
  }
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return handleOptions();
    }

    ensureAuthenticated(event);

    const segments = getPathSegments(event);
    const teacherId = segments[1];

    if (event.httpMethod === 'GET') {
      if (teacherId) {
        const { rows } = await query(
          `SELECT id, teacher_code, name, title, email, phone, department,
                  created_at, updated_at
             FROM teachers
            WHERE id = $1`,
          [teacherId]
        );

        if (rows.length === 0) {
          return errorResponse(404, 'Teacher not found.');
        }

        return okResponse({ teacher: normalizeTeacher(rows[0]) });
      }

      const { rows } = await query(
        `SELECT id, teacher_code, name, title, email, phone, department,
                created_at, updated_at
           FROM teachers
       ORDER BY created_at DESC`
      );

      return okResponse({
        teachers: rows.map(normalizeTeacher),
      });
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const { teacherCode, name, title, email, phone, department } = body;

      if (!teacherCode || !name) {
        return errorResponse(400, 'Teacher code and name are required.');
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse(400, 'Email format is invalid.');
      }

      if (phone && phone.length > 20) {
        return errorResponse(400, 'Phone number is too long.');
      }

      const { rows: existing } = await query(
        'SELECT 1 FROM teachers WHERE teacher_code = $1',
        [teacherCode.trim()]
      );
      if (existing.length > 0) {
        return errorResponse(409, 'Teacher code already exists.');
      }

      const { rows } = await query(
        `INSERT INTO teachers
           (teacher_code, name, title, email, phone, department)
         VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, teacher_code, name, title, email, phone, department,
                created_at, updated_at`,
        [
          teacherCode.trim(),
          name.trim(),
          title ? title.trim() : null,
          email ? email.trim() : null,
          phone ? phone.trim() : null,
          department ? department.trim() : null,
        ]
      );

      return okResponse({ teacher: normalizeTeacher(rows[0]) }, 201);
    }

    if (event.httpMethod === 'PUT') {
      if (!teacherId) {
        return errorResponse(400, 'Teacher ID is required in the path.');
      }

      const body = parseJsonBody(event);
      const fields = [];
      const values = [];
      let index = 1;

      if (body.teacherCode !== undefined) {
        fields.push(`teacher_code = $${index++}`);
        values.push(body.teacherCode.trim());
      }

      if (body.name !== undefined) {
        if (!body.name) {
          return errorResponse(400, 'Name cannot be empty.');
        }
        fields.push(`name = $${index++}`);
        values.push(body.name.trim());
      }

      if (body.title !== undefined) {
        fields.push(`title = $${index++}`);
        values.push(body.title ? body.title.trim() : null);
      }

      if (body.email !== undefined) {
        if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
          return errorResponse(400, 'Email format is invalid.');
        }
        fields.push(`email = $${index++}`);
        values.push(body.email ? body.email.trim() : null);
      }

      if (body.phone !== undefined) {
        if (body.phone && body.phone.length > 20) {
          return errorResponse(400, 'Phone number is too long.');
        }
        fields.push(`phone = $${index++}`);
        values.push(body.phone ? body.phone.trim() : null);
      }

      if (body.department !== undefined) {
        fields.push(`department = $${index++}`);
        values.push(body.department ? body.department.trim() : null);
      }

      if (fields.length === 0) {
        return errorResponse(400, 'No valid fields provided for update.');
      }

      fields.push('updated_at = NOW()');
      values.push(teacherId);

      const { rows } = await query(
        `UPDATE teachers
            SET ${fields.join(', ')}
          WHERE id = $${index}
      RETURNING id, teacher_code, name, title, email, phone, department,
                created_at, updated_at`,
        values
      );

      if (rows.length === 0) {
        return errorResponse(404, 'Teacher not found.');
      }

      return okResponse({ teacher: normalizeTeacher(rows[0]) });
    }

    if (event.httpMethod === 'DELETE') {
      if (!teacherId) {
        return errorResponse(400, 'Teacher ID is required in the path.');
      }

      const { rowCount } = await query('DELETE FROM teachers WHERE id = $1', [teacherId]);
      if (rowCount === 0) {
        return errorResponse(404, 'Teacher not found.');
      }

      return okResponse({ success: true });
    }

    return errorResponse(405, 'Method not allowed.');
  } catch (error) {
    console.error('Teachers handler error:', error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error.' : error.message;
    return errorResponse(statusCode, message);
  }
};

