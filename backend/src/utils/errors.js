export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function setCors(req, res) {
  const origin = process.env.PUBLIC_APP_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin === '*' ? '*' : origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
}

export function asyncHandler(fn) {
  return async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    try {
      return await fn(req, res);
    } catch (e) {
      const status = Number.isInteger(e?.status) ? e.status : 500;
      return res.status(status).json({ error: e?.message || 'Internal server error' });
    }
  };
}
