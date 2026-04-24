import jwt from "jsonwebtoken";

export const generateToken =  (user) => {
    const token = jwt.sign(
        {id : user.id, role : user.role, companyId : user.companyId || null},
        process.env.JWT_SECRET,
        {expiresIn : 120} // 120 seconds = 2 minutes
    );
    console.log("New Token Generated. Current Server Time:", new Date().toLocaleTimeString());
    return token;
};