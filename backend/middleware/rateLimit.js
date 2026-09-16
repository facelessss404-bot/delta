const buckets = new Map();
module.exports = ({ windowMs = 15 * 60 * 1000, max = 200 } = {}) => {
  const effectiveMax = Number(process.env.E2E_RATE_LIMIT_MAX) || max;
  return (req, res, next) => {
  const key = `${req.ip}:${req.path}`; const now = Date.now(); const current = buckets.get(key);
  const state = !current || now > current.reset ? { count: 0, reset: now + windowMs } : current;
  state.count += 1; buckets.set(key, state); res.setHeader('RateLimit-Remaining', Math.max(0, effectiveMax - state.count));
  if (state.count > effectiveMax) return res.status(429).json({ message: 'Too many requests. Please try again later.' }); next();
  };
};
