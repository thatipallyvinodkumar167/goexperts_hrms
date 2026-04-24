import jwt from "jsonwebtoken";

export const generateToken =  (user) => {
    return jwt.sign(
        {id : user.id, role : user.role, companyId : user.companyId || null},
        process.env.JWT_SECRET,
        {expiresIn : "2m"}

    );
};