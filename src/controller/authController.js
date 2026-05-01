import { changePasswordService, forgotPasswordService, loginUser, resetPasswordService, updateUserProfileService } from "../services/authService.js"
import fs from "fs";

export const updateProfile = async (req, res) => {
    try {
        const data = await updateUserProfileService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Upload profile logo via multipart/form-data
export const uploadProfileLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }

        // Build the public URL for the uploaded file
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const fileUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

        // Save URL to user profile
        const data = await updateUserProfileService(req.user.id, { profileLogo: fileUrl });

        res.status(200).json({
            success: true,
            message: "Profile logo uploaded successfully.",
            profileLogo: fileUrl,
            user: data.user,
        });
    } catch (error) {
        // Delete the uploaded file if DB update fails
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ success: false, message: error.message });
    }
};



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