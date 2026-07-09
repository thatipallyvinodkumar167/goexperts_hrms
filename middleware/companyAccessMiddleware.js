//controls data access

export const companyAccessMiddleware = (req, res, next) => {
    
    if(req.user.role == "SUPER_ADMIN"){
        return next();
    }

    if(!req.user.companyId){
        return res.status(403).json({success : false, message : "No Company access"});
    }
    next();
};