const logger = require('../utils/logger');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Forbidden role access attempt: user ID ${req.user.id} (${req.user.role}) tried to access route restricted to [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${allowedRoles.join(' or ')} role.`
      });
    }

    next();
  };
};

module.exports = { requireRole };
