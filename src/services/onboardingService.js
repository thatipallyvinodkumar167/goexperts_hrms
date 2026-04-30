

export const acceptInviteService = async ({token, password, name}) => {
    
    const invite  = await prisma.employeeInvite.findFirst({
        where : {
            token,
            expiresAt : {gt : new Date()},
            acceptedAt : null

        }
    })
}