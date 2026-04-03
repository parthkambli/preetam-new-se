const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const orgId = req.header('X-Organization-ID');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;

    // Validate requested organization is allowed
    const allowed = decoded.organizations.some(o => o.id === orgId);
    if (!allowed) {
      return res.status(403).json({ message: 'Organization not allowed' });
    }

    req.organizationId = orgId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
