import jwt from "jsonwebtoken";

export const generateToken =  (user) => {
    const token = jwt.sign(
        {id : user.id, role : user.role, companyId : user.companyId || null},
        process.env.JWT_SECRET,
        {expiresIn : "1d"} 
    );
    console.log("New Token Generated. Current Server Time:", new Date().toLocaleTimeString());
    return token;
};