const bcrypt = require('bcryptjs');
const { query } = require('./_shared/db');
const {
  okResponse,
  errorResponse,
  handleOptions,
  parseJsonBody,
  getPathSegments,
} = require('./_shared/http');
const { signToken, verifyToken } = require('./_shared/auth');

const normalizeAdmin = (row) => ({
  id: row.id,
  username: row.username,
  createdAt: row.created_at,
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return handleOptions();
    }

    // 从路径中提取操作：/api/auth/login -> login
    const path = event.path || '';
    const action = path.split('/').filter(Boolean).pop() || 'login'; // 默认为 login

    if (event.httpMethod === 'POST' && action === 'login') {
      const { username, password } = parseJsonBody(event);

      if (!username || !password) {
        return errorResponse(400, 'Username and password are required.');
      }

      const { rows } = await query(
        'SELECT id, username, password_hash, created_at FROM administrators WHERE username = $1',
        [username.trim()]
      );

      if (rows.length === 0) {
        return errorResponse(401, 'Invalid username or password.');
      }

      const admin = rows[0];
      const isMatch = await bcrypt.compare(password, admin.password_hash);

      if (!isMatch) {
        return errorResponse(401, 'Invalid username or password.');
      }

      const token = signToken({ sub: admin.id, username: admin.username });

      return okResponse({
        token,
        admin: normalizeAdmin(admin),
      });
    }

    if (event.httpMethod === 'POST' && action === 'register') {
      const { username, password } = parseJsonBody(event);

      if (!username || !password) {
        return errorResponse(400, 'Username and password are required.');
      }

      const countResult = await query('SELECT COUNT(*)::int AS count FROM administrators');
      const adminCount = countResult.rows[0].count;

      if (adminCount > 0) {
        try {
          verifyToken(event);
        } catch (authError) {
          const status = authError.statusCode || 401;
          return errorResponse(status, authError.message);
        }
      }

      const existing = await query('SELECT 1 FROM administrators WHERE username = $1', [
        username.trim(),
      ]);

      if (existing.rows.length > 0) {
        return errorResponse(409, 'Username already exists.');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const insertResult = await query(
        `INSERT INTO administrators (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        [username.trim(), passwordHash]
      );
      const admin = insertResult.rows[0];

      return okResponse({
        admin: normalizeAdmin(admin),
      }, 201);
    }

    if (event.httpMethod === 'GET' && action === 'me') {
      let tokenPayload;
      try {
        tokenPayload = verifyToken(event);
      } catch (authError) {
        const status = authError.statusCode || 401;
        return errorResponse(status, authError.message);
      }

      const { rows } = await query(
        'SELECT id, username, created_at FROM administrators WHERE id = $1',
        [tokenPayload.sub]
      );

      if (rows.length === 0) {
        return errorResponse(404, 'Administrator not found.');
      }

      return okResponse({
        admin: normalizeAdmin(rows[0]),
      });
    }

    return errorResponse(404, 'Not found.');
  } catch (error) {
    console.error('Auth handler error:', error);
    const statusCode = error.statusCode || 500;
    return errorResponse(statusCode, statusCode === 500 ? 'Internal server error.' : error.message);
  }
};

