import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";



export const createEmployeeService = async (data) => {


    const {
        name,
        email,
        password,
        departmentId,
        designationId,
        salary,
        joiningDate,
        employmentType,
        managerId,
        personal,
        experience,
        createdBy

    } = data;

    const companyId = createdBy.companyId;

    if(!companyId){
        throw Error("Invalid Company Details");
    }


    //checking emp is there or not
    const existing = await prisma.user.findFirst({
        where : {
            email, companyId
        }
    });

    if(existing){
        throw Error(" Employee already existx in this company");
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) =>  {
        
        const user = await tx.user.create({
            data : {
                name,
                email,
                password : hashedPassword,
                role : "EMPLOYEE",
                companyId
            }
        });

 //////////////////////////////////////////////////////
    // 3️⃣ VALIDATE MANAGER
    //////////////////////////////////////////////////////
    let manager = null;

    if (managerId) {
      manager = await tx.employee.findFirst({
        where: {
          id: managerId,
          user: { companyId }
        }
      });

      if (!manager) {
        throw new Error("Manager not found in this company");
      }
    }


//create employee
const employee = await tx.employee.create({

    data : {
        userId : user.id,
        employeeCode :`EMP-${Date.now()}`,
        departmentId,
        designationId,
        joiningDate : new Date(joiningDate),
        salary,
        employmentType,
        managerId: managerId || null,
    
    }
});


//personal details 
if(personal){
    await tx.employeePersonal.create({
        data : {
            employeeId : employee.id,
            ...personal
        }
    });
}

//Experience 
if(employmentType === "EXPERIENCED" && experience?.length){
    for( const exp of experience){
        await tx.employeeExperience.create({
            data : {
                employeeId :employee.id,
                ...exp
            }
        });
    } 
}

return {user, employee};
    });

return result;

};
