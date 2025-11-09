const { query } = require('./_shared/db');
const {
  okResponse,
  errorResponse,
  handleOptions,
  parseJsonBody,
  getPathSegments,
} = require('./_shared/http');
const { verifyToken } = require('./_shared/auth');

const normalizeCourse = (row) => ({
  id: row.id,
  courseCode: row.course_code,
  name: row.name,
  creditHours: row.credit_hours,
  teacher: row.teacher,
  description: row.description,
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
    const courseId = segments[1];

    if (event.httpMethod === 'GET') {
      if (courseId) {
        const { rows } = await query(
          `SELECT id, course_code, name, credit_hours, teacher, description,
                  created_at, updated_at
             FROM courses
            WHERE id = $1`,
          [courseId]
        );

        if (rows.length === 0) {
          return errorResponse(404, 'Course not found.');
        }

        return okResponse({ course: normalizeCourse(rows[0]) });
      }

      const { rows } = await query(
        `SELECT id, course_code, name, credit_hours, teacher, description,
                created_at, updated_at
           FROM courses
       ORDER BY created_at DESC`
      );

      return okResponse({
        courses: rows.map(normalizeCourse),
      });
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const { courseCode, name, creditHours, teacher, description } = body;

      if (!courseCode || !name) {
        return errorResponse(400, 'Course code and name are required.');
      }

      const creditValue =
        creditHours === undefined || creditHours === null || creditHours === ''
          ? null
          : Number.isNaN(Number(creditHours))
          ? (() => {
              throw new Error('Credit hours must be a valid number.');
            })()
          : parseInt(creditHours, 10);

      if (creditValue !== null && (creditValue < 0 || creditValue > 20)) {
        return errorResponse(400, 'Credit hours must be between 0 and 20.');
      }

      const { rows: existing } = await query(
        'SELECT 1 FROM courses WHERE course_code = $1',
        [courseCode.trim()]
      );
      if (existing.length > 0) {
        return errorResponse(409, 'Course code already exists.');
      }

      const { rows } = await query(
        `INSERT INTO courses
           (course_code, name, credit_hours, teacher, description)
         VALUES ($1, $2, $3, $4, $5)
      RETURNING id, course_code, name, credit_hours, teacher, description,
                created_at, updated_at`,
        [
          courseCode.trim(),
          name.trim(),
          creditValue,
          teacher ? teacher.trim() : null,
          description ? description.trim() : null,
        ]
      );

      return okResponse({ course: normalizeCourse(rows[0]) }, 201);
    }

    if (event.httpMethod === 'PUT') {
      if (!courseId) {
        return errorResponse(400, 'Course ID is required in the path.');
      }

      const body = parseJsonBody(event);
      const fields = [];
      const values = [];
      let index = 1;

      if (body.courseCode !== undefined) {
        fields.push(`course_code = $${index++}`);
        values.push(body.courseCode.trim());
      }

      if (body.name !== undefined) {
        if (!body.name) {
          return errorResponse(400, 'Name cannot be empty.');
        }
        fields.push(`name = $${index++}`);
        values.push(body.name.trim());
      }

      if (body.creditHours !== undefined) {
        if (body.creditHours === null || body.creditHours === '') {
          fields.push('credit_hours = NULL');
        } else if (Number.isNaN(Number(body.creditHours))) {
          return errorResponse(400, 'Credit hours must be a valid number.');
        } else {
          const creditValue = parseInt(body.creditHours, 10);
          if (creditValue < 0 || creditValue > 20) {
            return errorResponse(400, 'Credit hours must be between 0 and 20.');
          }
          fields.push(`credit_hours = $${index++}`);
          values.push(creditValue);
        }
      }

      if (body.teacher !== undefined) {
        fields.push(`teacher = $${index++}`);
        values.push(body.teacher ? body.teacher.trim() : null);
      }

      if (body.description !== undefined) {
        fields.push(`description = $${index++}`);
        values.push(body.description ? body.description.trim() : null);
      }

      if (fields.length === 0) {
        return errorResponse(400, 'No valid fields provided for update.');
      }

      fields.push('updated_at = NOW()');
      values.push(courseId);

      const { rows } = await query(
        `UPDATE courses
            SET ${fields.join(', ')}
          WHERE id = $${index}
      RETURNING id, course_code, name, credit_hours, teacher, description,
                created_at, updated_at`,
        values
      );

      if (rows.length === 0) {
        return errorResponse(404, 'Course not found.');
      }

      return okResponse({ course: normalizeCourse(rows[0]) });
    }

    if (event.httpMethod === 'DELETE') {
      if (!courseId) {
        return errorResponse(400, 'Course ID is required in the path.');
      }

      const { rowCount } = await query('DELETE FROM courses WHERE id = $1', [courseId]);
      if (rowCount === 0) {
        return errorResponse(404, 'Course not found.');
      }

      return okResponse({ success: true });
    }

    return errorResponse(405, 'Method not allowed.');
  } catch (error) {
    console.error('Courses handler error:', error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error.' : error.message;
    return errorResponse(statusCode, message);
  }
};

