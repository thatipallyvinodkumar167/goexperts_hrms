import { loginUser } from "../services/authService.js"



export const login = async (req, res) => {
    try {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({
                success: false,
                message: "Invalid request body. Send JSON with email and password."
            });
        }
        
        const data = await loginUser(req.body);

        res.status(200).json({
            success : true,
            message : "login successful",
            ...data
        })
    } catch (error) {
        res.status(400).json({
            success :false,
            message : error.message
        });
    }
}
