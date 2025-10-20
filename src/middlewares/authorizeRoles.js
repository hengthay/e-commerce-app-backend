// Middleware to authorize user roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Unauthorized. Please log in.')
      return res.status(403).json({
        message: "Unauthorized. Please log in."
      });
    }

    if(!allowedRoles.includes(req.user.role)) {
      console.log('Access Denied. You do not have permission to access this resource.');
      return res.status(403).json({
        message: "Access Denied. You do not have permission to access this resource."
      });
    }

    next();
  };
}

module.exports = authorizeRoles;