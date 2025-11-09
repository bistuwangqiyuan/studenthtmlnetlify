const { query } = require('./_shared/db');
const {
  okResponse,
  errorResponse,
  handleOptions,
  parseJsonBody,
  getPathSegments,
} = require('./_shared/http');
const { verifyToken } = require('./_shared/auth');

const normalizeStudent = (row) => ({
  id: row.id,
  studentNumber: row.student_number,
  name: row.name,
  gender: row.gender,
  age: row.age,
  major: row.major,
  className: row.class_name,
  contact: row.contact,
  notes: row.notes,
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
    const studentId = segments[1];

    if (event.httpMethod === 'GET') {
      if (studentId) {
        const { rows } = await query(
          `SELECT id, student_number, name, gender, age, major, class_name, contact, notes,
                  created_at, updated_at
             FROM students
            WHERE id = $1`,
          [studentId]
        );

        if (rows.length === 0) {
          return errorResponse(404, 'Student not found.');
        }

        return okResponse({ student: normalizeStudent(rows[0]) });
      }

      const { rows } = await query(
        `SELECT id, student_number, name, gender, age, major, class_name, contact, notes,
                created_at, updated_at
           FROM students
       ORDER BY created_at DESC`
      );

      return okResponse({
        students: rows.map(normalizeStudent),
      });
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const { studentNumber, name, gender, age, major, className, contact, notes } = body;

      if (!studentNumber || !name) {
        return errorResponse(400, 'Student number and name are required.');
      }

      const ageValue =
        age === undefined || age === null || age === ''
          ? null
          : Number.isNaN(Number(age))
          ? (() => {
              throw new Error('Age must be a valid number.');
            })()
          : parseInt(age, 10);

      if (ageValue !== null && (ageValue < 0 || ageValue > 120)) {
        return errorResponse(400, 'Age must be between 0 and 120.');
      }

      const { rows: existingStudents } = await query(
        'SELECT 1 FROM students WHERE student_number = $1',
        [studentNumber.trim()]
      );

      if (existingStudents.length > 0) {
        return errorResponse(409, 'Student number already exists.');
      }

      const { rows } = await query(
        `INSERT INTO students
           (student_number, name, gender, age, major, class_name, contact, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, student_number, name, gender, age, major, class_name, contact, notes,
                created_at, updated_at`,
        [
          studentNumber.trim(),
          name.trim(),
          gender ? gender.trim() : null,
          ageValue,
          major ? major.trim() : null,
          className ? className.trim() : null,
          contact ? contact.trim() : null,
          notes ? notes.trim() : null,
        ]
      );

      return okResponse({ student: normalizeStudent(rows[0]) }, 201);
    }

    if (event.httpMethod === 'PUT') {
      if (!studentId) {
        return errorResponse(400, 'Student ID is required in the path.');
      }

      const body = parseJsonBody(event);
      const fields = [];
      const values = [];
      let index = 1;

      if (body.studentNumber !== undefined) {
        fields.push(`student_number = $${index++}`);
        values.push(body.studentNumber.trim());
      }

      if (body.name !== undefined) {
        if (!body.name) {
          return errorResponse(400, 'Name cannot be empty.');
        }
        fields.push(`name = $${index++}`);
        values.push(body.name.trim());
      }

      if (body.gender !== undefined) {
        fields.push(`gender = $${index++}`);
        values.push(body.gender ? body.gender.trim() : null);
      }

      if (body.age !== undefined) {
        if (body.age === null || body.age === '') {
          fields.push(`age = NULL`);
        } else if (Number.isNaN(Number(body.age))) {
          return errorResponse(400, 'Age must be a valid number.');
        } else {
          const ageValue = parseInt(body.age, 10);
          if (ageValue < 0 || ageValue > 120) {
            return errorResponse(400, 'Age must be between 0 and 120.');
          }
          fields.push(`age = $${index++}`);
          values.push(ageValue);
        }
      }

      if (body.major !== undefined) {
        fields.push(`major = $${index++}`);
        values.push(body.major ? body.major.trim() : null);
      }

      if (body.className !== undefined) {
        fields.push(`class_name = $${index++}`);
        values.push(body.className ? body.className.trim() : null);
      }

      if (body.contact !== undefined) {
        fields.push(`contact = $${index++}`);
        values.push(body.contact ? body.contact.trim() : null);
      }

      if (body.notes !== undefined) {
        fields.push(`notes = $${index++}`);
        values.push(body.notes ? body.notes.trim() : null);
      }

      if (fields.length === 0) {
        return errorResponse(400, 'No valid fields provided for update.');
      }

      fields.push(`updated_at = NOW()`);

      values.push(studentId);

      const { rows } = await query(
        `UPDATE students
            SET ${fields.join(', ')}
          WHERE id = $${index}
      RETURNING id, student_number, name, gender, age, major, class_name, contact, notes,
                created_at, updated_at`,
        values
      );

      if (rows.length === 0) {
        return errorResponse(404, 'Student not found.');
      }

      return okResponse({
        student: normalizeStudent(rows[0]),
      });
    }

    if (event.httpMethod === 'DELETE') {
      if (!studentId) {
        return errorResponse(400, 'Student ID is required in the path.');
      }

      const { rowCount } = await query('DELETE FROM students WHERE id = $1', [studentId]);

      if (rowCount === 0) {
        return errorResponse(404, 'Student not found.');
      }

      return okResponse({ success: true });
    }

    return errorResponse(405, 'Method not allowed.');
  } catch (error) {
    console.error('Students handler error:', error);
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error.' : error.message;
    return errorResponse(statusCode, message);
  }
};

