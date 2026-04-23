


// const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
//   const orgId = req.header('X-Organization-ID');

//   if (!token) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   if (!orgId) {
//     return res.status(401).json({ message: 'X-Organization-ID header is required' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.admin = decoded;   // Keep this name for backward compatibility

//     // Support both Admin and FitnessStaff tokens
//     let userOrgId = null;

//     if (decoded.organizations && Array.isArray(decoded.organizations)) {
//       // Old Admin token structure
//       const allowed = decoded.organizations.some(o => o.id === orgId || o._id === orgId);
//       if (!allowed) {
//         return res.status(403).json({ message: 'Organization not allowed' });
//       }
//       userOrgId = orgId;
//     } 
//     else if (decoded.organizationId) {
//       // New FitnessStaff / User token structure
//       if (decoded.organizationId !== orgId) {
//         return res.status(403).json({ message: 'Organization not allowed' });
//       }
//       userOrgId = decoded.organizationId;
//     } 
//     else {
//       return res.status(403).json({ message: 'Invalid token structure' });
//     }

//     req.organizationId = userOrgId;
//     req.user = decoded;        // Extra safety
//     next();
//   } catch (err) {
//     console.error('Auth Error:', err.message);
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// module.exports = authMiddleware;
















const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const orgId = req.header('X-Organization-ID');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  if (!orgId) {
    return res.status(401).json({ message: 'X-Organization-ID header is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ─────────────────────────────────────────
    // STEP 1: Identify Admin vs User properly
    // ─────────────────────────────────────────
    let userOrgId = null;

    if (decoded.organizations && Array.isArray(decoded.organizations)) {
      // ADMIN TOKEN
      const allowed = decoded.organizations.some(
        o => o.id === orgId || o._id === orgId
      );

      if (!allowed) {
        return res.status(403).json({ message: 'Organization not allowed' });
      }

      req.admin = decoded;
      req.user = null;
      userOrgId = orgId;

    } else if (decoded.organizationId) {
      // USER / STAFF / MEMBER TOKEN
      if (decoded.organizationId !== orgId) {
        return res.status(403).json({ message: 'Organization not allowed' });
      }

      req.user = decoded;
      req.admin = null;
      userOrgId = decoded.organizationId;

    } else {
      return res.status(403).json({ message: 'Invalid token structure' });
    }

    // ─────────────────────────────────────────
    // STEP 2: Attach normalized identity
    // ─────────────────────────────────────────
    req.identity = {
      isAdmin: !!req.admin,
      isUser: !!req.user,
      role: decoded.role || (decoded.organizations ? 'admin' : null),
    };

    req.organizationId = userOrgId;

    next();

  } catch (err) {
    console.error('Auth Error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;