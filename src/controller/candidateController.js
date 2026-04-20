import { createCandidateService } from "../services/createCandidateService.js"


export const createCandidate = async (req, res) => {

try {
    
    const data = createCandidateService({
        ...req.body,
        createdBy : req.user
    });

    res.status(200).json({suceess : true, data});


} catch (error) {
    res.status(400).json({message : error.message});
}

}