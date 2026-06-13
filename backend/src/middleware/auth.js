const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Accept Bearer header OR ?token= query param (for file download links)
  const raw = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.query.token;
  if (!raw) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

const requireEmployee = (req, res, next) => {
  if (!['ADMIN','EMPLOYEE'].includes(req.user?.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};

module.exports = { verifyToken, requireAdmin, requireEmployee };
