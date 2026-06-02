
export async function createEasebuzzOrder({ companyId, plainId }) {

    //get sub plain details
    const plain = await Prisma.subscriptionPlain.findUnique({
        where : { id : plainId}
    });
    if(!plain){
        throw new Error(" Plain not found");
    }

    // build transaction data
    

    


}