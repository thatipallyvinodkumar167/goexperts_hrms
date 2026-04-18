
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;

        // checking token is present or not
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({success : false, message : " access denied. no token provided"});
        }
        
        const token = authHeader.split(" ")[1];

        //verifying token 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();


    } catch (error) {
        res.status(401).json({success : false, message : "invalid or expire token"})
    }

}