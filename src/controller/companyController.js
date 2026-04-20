import { createCompanyService } from "../services/companyService.js";


export const createCompany = async (req, res) => {

    try {
        
        const result = await createCompanyService({
            ...req.body,
            createdById : req.user.id
        });

        res.status(201).json({ success : true,
            message : "company created successfully",
            data : result
        });

    } catch (error) {
        res.status(400).json({ success : false, message : error.message});
    }
}
