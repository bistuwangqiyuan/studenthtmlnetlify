const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const okResponse = (body, statusCode = 200) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

const errorResponse = (statusCode, message) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify({
    error: message,
  }),
});

const handleOptions = () => ({
  statusCode: 204,
  headers: corsHeaders,
  body: '',
});

const parseJsonBody = (event) => {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error('Invalid JSON payload.');
  }
};

const getPathSegments = (event) =>
  event.path
    .replace('/.netlify/functions', '')
    .split('/')
    .filter(Boolean);

module.exports = {
  corsHeaders,
  okResponse,
  errorResponse,
  handleOptions,
  parseJsonBody,
  getPathSegments,
};

