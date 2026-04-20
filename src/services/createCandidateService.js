


export const createCandidateService = async ( {name, email, phone, createdBy }) => {

return await prisma.candidate.create({

    data : {
        name,
        email,
        phone,
        companyId : createdBy.companyId,
        createdById : createdBy.id
    }
});




};