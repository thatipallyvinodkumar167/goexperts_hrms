import { createCompanyService } from "../services/companyService.js";

//create company
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
};

//get all company
export const getAllCompanies = async (req, res) => {

    try {
        
        const companies = await prisma.company.findMany({
            include : {
                users : {
                    select : {
                        id: true,
                        name : true,
                        email : true,
                        role : true,
                    }
                },
                departments : true,
                designations : true
            },
            orderBy : {
                createdAt : "desc"
            }
        });

        res.status(200).json({
            success : true,
            count: companies.length,
            data : companies
        });

    } catch (error) {
        res.status(400).json({success :false, message : error.message});
    }
}

//
