
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
        console.log("--- Token Verification Start ---");
        console.log("Current Server Time:", new Date().toLocaleTimeString());
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token is VALID. Expires at:", new Date(decoded.exp * 1000).toLocaleTimeString());

        req.user = decoded;

        next();


    } catch (error) {
        console.log("Token Verification FAILED:", error.message);
        res.status(401).json({success : false, message : "invalid or expire token"})
    }

}