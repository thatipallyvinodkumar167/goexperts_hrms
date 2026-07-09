export const allowSelfOrRoles = (...roles) => {
  return (req, res, next) => {

    const userId = req.user.id;
    const targetId = req.params.id;

    // allow if same user
    if (userId === targetId) {
      return next();
    }

    // allow if role has permission
    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied (not owner)"
    });
  };
};
