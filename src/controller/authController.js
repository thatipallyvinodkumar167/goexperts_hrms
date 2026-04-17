import { loginUser } from "../services/authService.js"



export const login = async (req, res) => {
    try {
        
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