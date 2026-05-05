import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateJoiningLetter } from "../utils/pdfGenerator.js";


// ✅ STEP 1 + 2: Accept Invite + Set Password
export const acceptInviteService = async ({token, password, name}) => {
    
    const invite  = await prisma.employeeInvite.findFirst({
        where : {
            token,
        }
    });

    if(!invite){
        throw Error("Invalid token");
    }

    if(invite.expiresAt < new Date()){
        throw Error("Token has expired");
    }

    if(invite.acceptedAt){
        throw Error("The password has already been set for this account");
    }

    const hashedPassword  = await hashPassword(password);

     // create user
    const user = await prisma.user.create({
        data : {
            name,
            email : invite.email,
            password : hashedPassword,
            role : invite.role,
            companyId : invite.companyId,
            status : "PENDING_APPROVAL",
            isEmailVerified : false
        }
    });

    //mark invite accepted
    await prisma.employeeInvite.update({

        where : { id : invite.id},
        data : {acceptedAt : new Date()}
    });

    return {message :  "Password set successfully. Please verify email", userId : user.id};

};

// step 2 verify email
export const verifyEmailService  = async (userId) => {

    const user = await prisma.user.findFirst({
        where : {id : userId}
    });

    if(!user){
        throw Error("user not found")
    }

    await prisma.user.update({
        where : {id : user.id},
        isEmailVerified : true
    });
    return { message : "email verified successfully"}
};

// ✅ STEP 4: Complete Profile

export const completeProfileService  = async ({
    userId,
    personal,
    departmentId,
  designationId
}) => {

    const user = await prisma.user.findUnique({
        where : {id : userId}
    });

if(!user){
    throw Error("user not found");
}

  // create employee
  const employee = await prisma.employee.create({

    data : {
        userId,
        companyId : user.companyId,
        employeeCode : `EMP-${Date.now()}`,

        departmentId,
        designationId,
        joiningDate : new Date(),
        employmentType : "FRESHER",

        personal : {
            create : personal
        }

    }
  });

  // If the user is an HR, also create the HR permissions record
  if (user.role === "HR") {
    await prisma.hR.create({
      data: {
        userId,
        permissions: {
          canManageEmployees: true,
          canManageAttendance: true,
          canManageLeaves: true,
          canManagePayroll: false, // Defaulting some security
        }
      }
    });
  }

  return {message : "Profile completed successfully", employee};
};

// ✅ STEP 5: Activate Employee
export const activateUserService  = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            employee: {
                include: {
                    designation: true
                }
            }
        }
    });

    if (!user) throw Error("User not found");
    if (!user.isEmailVerified) throw Error("Verify email first");

    await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" }
    });

    // Generate Appointment/Joining Letter in background
    if (user.employee) {
        generateJoiningLetter({
            email: user.email,
            name: user.name,
            position: user.employee.designation?.name || "Team Member",
            joiningDate: user.employee.joiningDate.toLocaleDateString()
        }).then(({ filePath, fileName }) => {
            sendEmail(
                user.email,
                "Welcome Aboard! Appointment Letter - GOExperts HRMS",
                `<h3>Welcome to the Team, ${user.name}!</h3>
                 <p>Congratulations! Your account has been activated.</p>
                 <p>Please find your formal <strong>Appointment Letter</strong> attached to this email.</p>
                 <p>You can now log in to the dashboard using your credentials.</p>
                 <br/>
                 <a href="${process.env.FRONTEND_URL}/login" 
                    style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Login to Dashboard
                 </a>`,
                [{ filename: fileName, path: filePath }]
            ).catch(err => console.error("Welcome Email Failed:", err.message));
        }).catch(err => console.error("Joining PDF Generation Failed:", err.message));
    }

    return { message: "Account activated successfully and Welcome Letter sent" };
};

export const uploadEmployeeDocumentsService = async (userId, files) => {
    const employee = await prisma.employee.findUnique({
        where: { userId }
    });

    if (!employee) throw new Error("Employee profile not found. Complete profile first.");

    const documents = [];

    for (const [fieldname, fileArray] of Object.entries(files)) {
        const file = fileArray[0];
        const docType = fieldname.toUpperCase(); // e.g., PAN, AADHAAR

        const doc = await prisma.employeeDocument.create({
            data: {
                employeeId: employee.id,
                name: docType,
                fileUrl: `/uploads/employee-docs/${file.filename}`,
                status: "PENDING"
            }
        });
        documents.push(doc);
    }

    return { message: "Documents uploaded successfully", documents };
};

// ✅ STEP 3: Add Experience (If Experienced)
export const addExperienceService = async (userId, experienceArray) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new Error("Employee profile not found");

    const experiences = await Promise.all(experienceArray.map(exp => 
        prisma.employeeExperience.create({
            data: {
                employeeId: employee.id,
                companyName: exp.companyName,
                role: exp.role,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                totalYears: exp.totalYears
            }
        })
    ));

    await prisma.employee.update({
        where: { id: employee.id },
        data: { employmentType: "EXPERIENCED" }
    });

    return { message: "Experience added successfully", experiences };
};

// ✅ STEP 5: HR Document Verification (BGV - Part 1)
export const updateDocumentStatusService = async ({ documentId, status, remarks }) => {
    const doc = await prisma.employeeDocument.update({
        where: { id: documentId },
        data: { status, remarks }
    });
    return { message: `Document marked as ${status}`, doc };
};

// ✅ STEP 5: Final BGV Approval/Rejection (BGV - Part 2)
export const finalBGVApprovalService = async ({ employeeId, status, remarks }) => {
    const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: { 
            bgvStatus: status, 
            bgvRemarks: remarks,
            // If rejected, keep status as PENDING_APPROVAL or move to SUSPENDED
            status: status === "REJECTED" ? "SUSPENDED" : "PENDING_APPROVAL"
        },
        include: { user: true }
    });

    if (status === "REJECTED") {
        await sendEmail(
            employee.user.email,
            "Onboarding Update - BGV Verification",
            `<h3>Background Verification Update</h3>
             <p>Dear ${employee.user.name},</p>
             <p>We regret to inform you that your background verification was not successful.</p>
             <p><strong>Remarks:</strong> ${remarks}</p>`
        );
    }

    return { message: `Employee BGV marked as ${status}`, employee };
};

// ✅ STEP 6: Assign Salary + Manager
export const assignTermsService = async ({ employeeId, salaryDetails, managerId }) => {
    const { basic, hra, allowances, bonus, deductions } = salaryDetails;

    const [salary, employee] = await prisma.$transaction([
        prisma.salaryStructure.upsert({
            where: { employeeId },
            create: { employeeId, basic, hra, allowances, bonus, deductions },
            update: { basic, hra, allowances, bonus, deductions }
        }),
        prisma.employee.update({
            where: { id: employeeId },
            data: { managerId }
        })
    ]);

    return { message: "Employment terms assigned successfully", salary, employee };
};