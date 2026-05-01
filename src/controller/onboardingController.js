import { acceptInviteService, activateUserService, completeProfileService, verifyEmailService } from "../services/onboardingService"

export const acceptInvite = async (req, res) => {

try {
    
    const data = await acceptInviteService(req.body);

    res.status(200).json({ success : true, ...data});

} catch (error) {
    
    res.status(400).json({ success : false, message : error.message});
}
    
};

export const verifyEmail = async (req, res) => {

    try {
        
        const { userId } = req.body;

        const data = await verifyEmailService(userId);

        res.status(200).json({success : true, ...data});

    } catch (error) {
        res.status(400).json({ success : false, message : error.message});
    }
};

export const completeProfile  = async (req, res) => {

    try {
        
        const data = await completeProfileService({
            ...req.body,
            userId : req.user.id
        });

        res.status(200).json({success : true, ...data});
    } catch (error) {
        
        res.status(400).json({ success : false, message : error.message});
    }
};

export const activateUser = async (req, res) => {

    try {
        
        const { userId } = req.body;

        const data = await activateUserService(userId);

        res.status(200).json({ success : true, ...data});

    } catch (error) {
        
        res.status(400).json({ success : false, message : error.message});
    }
};