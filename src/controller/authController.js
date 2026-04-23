import { changePasswordService, forgotPasswordService, loginUser, resetPasswordService } from "../services/authService.js"



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
        });

        
    } catch (error) {
        res.status(400).json({
            success :false,
            message : error.message
        });
    }
};




//forgot password controller
export const forgotPassword = async (req, res) => {

    try {
        
        const {email} = req.body;

        const data = await forgotPasswordService(email);

        res.status(200).json({success : true, ...data});

    } catch (error) {
        res.status(400).json({ success : false, message : error.message});
    }
};




//reset password controller 
export const  resetPassword = async (req, res) => {

    try {
        
        const {token, password} = req.body;

        const data = await resetPasswordService(token, password);

        res.status(200).json({
            success : true,
            ...data
        });




    } catch (error) {
        
        res.status(400).json({success : false, message : error.message});
    }

};

export const changePassword = async (req, res) => {

    try {
        
        const {oldPassword, newPassword} = req.body;

        const data = await changePasswordService({
            userId : req.user.id,
            oldPassword,
            newPassword,
        });

        res.status(200).json({success : true, 
            ...data
        });



    } catch (error) {
         
        res.status(400).json({success : false, message : error.message});
    }
}