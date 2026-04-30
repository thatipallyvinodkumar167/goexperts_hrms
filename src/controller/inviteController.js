import { inviteService } from "../services/inviteService.js"

export const inviteUser  = async (req, res) => { 

    try {
        
        const data = await inviteService({

            ...req.body,
            companyId : req.user.companyId,
            createdById : req.user.id
        });

        res.status(200).json({
            success : true,
            ...data
        });


    } catch (error) {
        res.status(400).json({
            success : false,
            message : error.message
        });
    }
}