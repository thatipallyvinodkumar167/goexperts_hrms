//controls access roles

export const allowRoles = (...allowRoles) => {

    return (req, res, next) => {

        if(!req.user || !req.user.role){
            return res.status(401).json({success: false, message: "unauthorized"});
        }

        if(!allowRoles.includes(req.user.role)){
                return res.status(403).json({success : false, message : `access denied for role :${req.user.role}`});
        }
        next();
    };
};
