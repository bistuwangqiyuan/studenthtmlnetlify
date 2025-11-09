const jwt = require('jsonwebtoken');

const getTokenFromEvent = (event) => {
  const authorization =
    event.headers.authorization || event.headers.Authorization;
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const verifyToken = (event) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Environment variable JWT_SECRET is not set.');
  }

  const token = getTokenFromEvent(event);
  if (!token) {
    const error = new Error('Authorization token is required.');
    error.statusCode = 401;
    throw error;
  }

  try {
    return jwt.verify(token, secret);
  } catch {
    const error = new Error('Authorization token is invalid or expired.');
    error.statusCode = 401;
    throw error;
  }
};

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Environment variable JWT_SECRET is not set.');
  }

  return jwt.sign(payload, secret, { expiresIn: '6h' });
};

module.exports = {
  verifyToken,
  signToken,
};

