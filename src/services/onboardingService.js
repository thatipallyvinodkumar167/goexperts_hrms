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
            name: name || invite.email.split('@')[0], // Strong fallback to email prefix
            email : invite.email,
            password : hashedPassword,
            role : invite.role,
            companyId : invite.companyId,
            status : "PENDING_APPROVAL",
            isEmailVerified : true
        }
    });

    // Create the core employee record immediately using the HR's invite data
    await prisma.employee.create({
      data: {
          userId: user.id,
          companyId: invite.companyId,
          employeeCode: `EMP-${Date.now()}`,
          departmentId: invite.departmentId || "UNKNOWN", // Should be provided by HR
          designationId: invite.designationId || "UNKNOWN",
          joiningDate: new Date(),
          employmentType: "FRESHER",
          onboardingStep: 1,
          status: "INVITED"
      }
    });

    //mark invite accepted
    await prisma.employeeInvite.update({

        where : { id : invite.id},
        data : {acceptedAt : new Date()}
    });

    return {message :  "Password set successfully", userId : user.id};

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

// ✅ STEP 1: Basic Information
export const saveBasicInfoService = async (userId, data) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Error("User not found");

    let employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee record missing. Please contact HR.");
    
    // Update the existing employee record
    employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            middleName: data.middleName,
            profilePhoto: data.profilePhoto,
            onboardingStep: Math.max(employee.onboardingStep, 2)
        }
    });
    
    await prisma.employeePersonal.upsert({
        where: { employeeId: employee.id },
        update: {
            gender: data.gender,
            dob: data.dob ? new Date(data.dob) : null,
            maritalStatus: data.maritalStatus,
            bloodGroup: data.bloodGroup,
            nationality: data.nationality
        },
        create: {
            employeeId: employee.id,
            gender: data.gender,
            dob: data.dob ? new Date(data.dob) : null,
            maritalStatus: data.maritalStatus,
            bloodGroup: data.bloodGroup,
            nationality: data.nationality
        }
    });

    return { message: "Basic information saved", employee };
};

// ✅ STEP 2: Contact Information
export const saveContactInfoService = async (userId, data) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    await prisma.employeePersonal.upsert({
        where: { employeeId: employee.id },
        update: {
            personalEmail: data.personalEmail,
            phone: data.phone,
            alternatePhone: data.alternatePhone,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode
        },
        create: {
            employeeId: employee.id,
            personalEmail: data.personalEmail,
            phone: data.phone,
            alternatePhone: data.alternatePhone,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode
        }
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 3) }
    });

    return { message: "Contact information saved" };
};

// ✅ STEP 3: Emergency Contact
export const saveEmergencyContactService = async (userId, dataArray) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    // Clear existing to avoid duplicates on re-submission
    await prisma.employeeEmergencyContact.deleteMany({ where: { employeeId: employee.id } });

    await prisma.employeeEmergencyContact.createMany({
        data: dataArray.map(data => ({
            employeeId: employee.id,
            contactPersonName: data.contactPersonName,
            relationship: data.relationship,
            contactNumber: data.contactNumber,
            alternateContact: data.alternateContact,
            address: data.address
        }))
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 4) }
    });

    return { message: "Emergency contacts saved" };
};

// ✅ STEP 4: Education Details
export const saveEducationService = async (userId, dataArray) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    await prisma.employeeEducation.deleteMany({ where: { employeeId: employee.id } });

    await prisma.employeeEducation.createMany({
        data: dataArray.map(data => ({
            employeeId: employee.id,
            degree: data.degree,
            specialization: data.specialization,
            college: data.college,
            university: data.university,
            percentage: data.percentage,
            cgpa: data.cgpa,
            startYear: data.startYear,
            endYear: data.endYear
        }))
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 5) }
    });

    return { message: "Education details saved" };
};

// ✅ STEP 5: Experience Details
export const addExperienceService = async (userId, experienceArray) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new Error("Employee profile not found");

    await prisma.employeeExperience.deleteMany({ where: { employeeId: employee.id } });

    const experiences = await prisma.employeeExperience.createMany({
        data: experienceArray.map(exp => ({
            employeeId: employee.id,
            companyName: exp.companyName,
            role: exp.designation || exp.role,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            totalYears: exp.totalExperience || exp.totalYears,
            technologies: exp.technologies,
            responsibilities: exp.responsibilities
        }))
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { 
            employmentType: experienceArray.length > 0 ? "EXPERIENCED" : employee.employmentType,
            onboardingStep: Math.max(employee.onboardingStep, 6)
        }
    });

    return { message: "Experience details saved", experiences };
};

// ✅ STEP 6: Skills & Certifications
export const saveSkillsService = async (userId, data) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    await prisma.employeeSkill.upsert({
        where: { employeeId: employee.id },
        update: {
            primarySkills: data.primarySkills,
            secondarySkills: data.secondarySkills,
            certifications: data.certifications,
            languagesKnown: data.languagesKnown,
            linkedinUrl: data.linkedinUrl,
            githubUrl: data.githubUrl,
            portfolioUrl: data.portfolioUrl
        },
        create: {
            employeeId: employee.id,
            primarySkills: data.primarySkills,
            secondarySkills: data.secondarySkills,
            certifications: data.certifications,
            languagesKnown: data.languagesKnown,
            linkedinUrl: data.linkedinUrl,
            githubUrl: data.githubUrl,
            portfolioUrl: data.portfolioUrl
        }
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 7) }
    });

    return { message: "Skills saved" };
};

// ✅ STEP 5: Activate Employee (Legacy Single Action)
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
            position: user.employee.designation?.title || "Team Member",
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

// ✅ STEP 7: Document Uploads
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
    
    // Also store profile photo locally if uploaded
    if (files.profilePhoto) {
        await prisma.employee.update({
            where: { id: employee.id },
            data: { profilePhoto: `/uploads/employee-docs/${files.profilePhoto[0].filename}` }
        });
    }
    
    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 8) }
    });

    return { message: "Documents uploaded successfully", documents };
};

// ✅ STEP 8: Bank Details
export const saveBankDetailsService = async (userId, data) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    if (data.accountNumber !== data.confirmAccountNumber) {
        throw Error("Account numbers do not match");
    }

    await prisma.employeeBank.upsert({
        where: { employeeId: employee.id },
        update: {
            bankName: data.bankName,
            accountHolderName: data.accountHolderName,
            accountNumber: data.accountNumber,
            ifscCode: data.ifscCode,
            branchName: data.branchName,
            upiId: data.upiId
        },
        create: {
            employeeId: employee.id,
            bankName: data.bankName,
            accountHolderName: data.accountHolderName,
            accountNumber: data.accountNumber,
            ifscCode: data.ifscCode,
            branchName: data.branchName,
            upiId: data.upiId
        }
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 9) }
    });

    return { message: "Bank details saved" };
};

// ✅ STEP 9: Nominee Details
export const saveNomineeService = async (userId, data) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    await prisma.employeeNominee.upsert({
        where: { employeeId: employee.id },
        update: {
            nomineeName: data.nomineeName,
            relationship: data.relationship,
            dob: data.dob ? new Date(data.dob) : null,
            gender: data.gender,
            phone: data.phone,
            email: data.email,
            aadhaarNumber: data.aadhaarNumber,
            panNumber: data.panNumber,
            nomineePercentage: data.nomineePercentage,
            address: data.address
        },
        create: {
            employeeId: employee.id,
            nomineeName: data.nomineeName,
            relationship: data.relationship,
            dob: data.dob ? new Date(data.dob) : null,
            gender: data.gender,
            phone: data.phone,
            email: data.email,
            aadhaarNumber: data.aadhaarNumber,
            panNumber: data.panNumber,
            nomineePercentage: data.nomineePercentage,
            address: data.address
        }
    });

    await prisma.employee.update({
        where: { id: employee.id },
        data: { onboardingStep: Math.max(employee.onboardingStep, 10) }
    });

    return { message: "Nominee details saved" };
};

// ✅ STEP 10: Compliance & Finalize
export const saveComplianceAndFinalizeService = async (userId, data) => {
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw Error("Employee profile not found");

    await prisma.employeeCompliance.upsert({
        where: { employeeId: employee.id },
        update: {
            uanNumber: data.uanNumber,
            pfNumber: data.pfNumber,
            esiNumber: data.esiNumber
        },
        create: {
            employeeId: employee.id,
            uanNumber: data.uanNumber,
            pfNumber: data.pfNumber,
            esiNumber: data.esiNumber
        }
    });

    // Finalize onboarding
    await prisma.employee.update({
        where: { id: employee.id },
        data: { 
            onboardingCompleted: true,
            onboardingStep: 10,
            status: "PENDING_APPROVAL" // Moves to HR verification
        }
    });

    return { 
        message: "Onboarding completed successfully! Your profile is now under review by HR.",
        onboardingCompleted: true 
    };
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
        include: {
             user: true }
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

// ✅ CONSOLIDATED HR STEP: Finalize Joining (Industry Standard)
export const finalizeEmployeeJoiningService = async ({ 
    employeeId, 
    managerId, 
    salaryBreakdown,
    bgvStatus,
    bgvRemarks,
    probationPeriod,
    noticePeriod
}) => {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { 
            user: true,
            company: true,
            designation: true
        }
    });

    if (!employee) throw Error("Employee not found");

    // 🚀 SMART LOGIC: Auto-calculate Notice Period if not provided
    let finalNoticePeriod = noticePeriod;
    if (!finalNoticePeriod) {
        const level = employee.designation?.level || 1;
        finalNoticePeriod = level >= 3 ? "90 Days" : "30 Days";
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Update BGV Status, Manager, and Contract Terms
        await tx.employee.update({
            where: { id: employeeId },
            data: { 
                bgvStatus: bgvStatus || "APPROVED",
                bgvRemarks,
                managerId,
                probationPeriod: probationPeriod || employee.company.defaultProbationPeriod || "6 Months",
                noticePeriod: finalNoticePeriod,
                status: bgvStatus === "REJECTED" ? "SUSPENDED" : "ACTIVE"
            }
        });

        // 2. Map Salary Structure (Industry Standard Calculation)
        let finalSalary = salaryBreakdown;

        if (!finalSalary) {
            const offer = await tx.offerLetter.findFirst({
                where: { employeeEmail: employee.user.email },
                orderBy: { createdAt: "desc" }
            });

            if (offer) {
                // Fetch Company Industry Template
                const company = await tx.company.findUnique({
                    where: { id: employee.companyId },
                    include: { industryType: { include: { salaryTemplate: true } } }
                });

                const template = company.industryType?.salaryTemplate;
                const gross = offer.salary;

                if (template) {
                    // ✅ ADVANCED INDUSTRY CALCULATION
                    const basic = gross * (template.basicPercentage / 100);
                    const hra = basic * (template.hraPercentageOfBasic / 100);
                    const allowances = gross - (basic + hra); // Balance goes to allowances

                    // Statutory Components
                    const pfEmployee = basic * (template.pfPercentage / 100);
                    const esiEmployee = gross < 21000 ? gross * (template.esiPercentage / 100) : 0;
                    
                    const pfEmployer = basic * (template.employerPfPercentage / 100);
                    const esiEmployer = gross < 21000 ? gross * (template.employerEsiPercentage / 100) : 0;

                    const deductions = pfEmployee + esiEmployee;
                    const netSalary = gross - deductions;

                    finalSalary = {
                        basic,
                        hra,
                        allowances,
                        bonus: 0,
                        pfEmployee,
                        esiEmployee,
                        pfEmployer,
                        esiEmployer,
                        deductions,
                        netSalary
                    };
                } else {
                    // Fallback to basic 50/40/10 if no template found
                    finalSalary = {
                        basic: gross * 0.5,
                        hra: gross * 0.4,
                        allowances: gross * 0.1,
                        bonus: 0,
                        deductions: 0,
                        netSalary: gross
                    };
                }
            }
        }

        if (finalSalary) {
            await tx.salaryStructure.upsert({
                where: { employeeId },
                create: { 
                    employeeId, 
                    basic: finalSalary.basic, 
                    hra: finalSalary.hra, 
                    allowances: finalSalary.allowances, 
                    bonus: finalSalary.bonus || 0, 
                    pfEmployee: finalSalary.pfEmployee || 0,
                    esiEmployee: finalSalary.esiEmployee || 0,
                    pfEmployer: finalSalary.pfEmployer || 0,
                    esiEmployer: finalSalary.esiEmployer || 0,
                    deductions: finalSalary.deductions || 0,
                    netSalary: finalSalary.netSalary || finalSalary.basic + finalSalary.hra + finalSalary.allowances
                },
                update: { 
                    basic: finalSalary.basic, 
                    hra: finalSalary.hra, 
                    allowances: finalSalary.allowances, 
                    bonus: finalSalary.bonus || 0,
                    pfEmployee: finalSalary.pfEmployee || 0,
                    esiEmployee: finalSalary.esiEmployee || 0,
                    pfEmployer: finalSalary.pfEmployer || 0,
                    esiEmployer: finalSalary.esiEmployer || 0,
                    deductions: finalSalary.deductions || 0,
                    netSalary: finalSalary.netSalary || finalSalary.basic + finalSalary.hra + finalSalary.allowances
                }
            });
        }

        // 3. Activate the User Account
        if (bgvStatus !== "REJECTED") {
            await tx.user.update({
                where: { id: employee.userId },
                data: { status: "ACTIVE" }
            });
        }

        return { bgvStatus };
    });

    // 4. Send Appointment Letter and Welcome Email (Background)
    if (bgvStatus === "APPROVED") {
        const desig = await prisma.designation.findUnique({ where: { id: employee.designationId } });
        const position = desig?.title || "Team Member";

        const { generateJoiningLetter } = await import("../utils/pdfGenerator.js");

        generateJoiningLetter({
            email: employee.user.email,
            name: employee.user.name,
            position: position,
            joiningDate: new Date().toLocaleDateString(),
            company: {
                name: employee.company.name,
                logo: employee.company.companyLogo
            }
        }).then(({ filePath, fileName }) => {
            sendEmail(
                employee.user.email,
                "Welcome Aboard! Appointment Letter - GOExperts HRMS",
                `<h3>Welcome to the Team, ${employee.user.name}!</h3>
                 <p>Congratulations! Your onboarding is complete and your account is now <strong>ACTIVE</strong>.</p>
                 <p>Please find your formal <strong>Appointment Letter</strong> attached.</p>
                 <br/>
                 <a href="${process.env.FRONTEND_URL}/login" 
                    style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Login to Dashboard
                 </a>`,
                [{ filename: fileName, path: filePath }]
            ).catch(err => console.error("Welcome Email Failed:", err.message));
        }).catch(err => console.error("Joining PDF Generation Failed:", err.message));
    }

    return { 
        success: true, 
        message: bgvStatus === "APPROVED" 
            ? "Employee finalized, salary mapped, and activation email sent!" 
            : "Employee rejected and account suspended." 
    };
};

// ✅ HR STEP: Get all onboarding details for review
export const getEmployeeOnboardingDetailsService = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            user: { select: { name: true, email: true, status: true } },
            department: true,
            designation: true,
            education: true,
            experience: true,
            skills: true,
            documents: true,
            bankDetails: true,
            nominee: true,
            compliance: true
        }
    });

    if (!employee) throw Error("Employee not found");

    return employee;
};

// HR STEP: Get all employee onboarding reviews for a company
export const getAllEmployeeReviewsService = async (companyId) => {
    if (!companyId) throw Error("Company id is required");

    const employees = await prisma.employee.findMany({
        where: { companyId },
        include: {
            user: { select: { id: true, name: true, email: true, status: true } },
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            documents: { select: { id: true, name: true, status: true, createdAt: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return employees;
};


// ? HR STEP: Get Salary Preview (Auto-Calculation for UI)
export const getSalaryPreviewService = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { company: true, user: true }
    });

    if (!employee) throw Error(" Employee not found\);

 const offer = await prisma.offerLetter.findFirst({
 where: { employeeEmail: employee.user.email },
 orderBy: { createdAt: \desc\ }
 });

 if (!offer) throw Error(\No offer letter found for this employee to calculate salary.\);

 const company = await prisma.company.findUnique({
 where: { id: employee.companyId },
 include: { industryType: { include: { salaryTemplate: true } } }
 });

 const template = company.industryType?.salaryTemplate;
 const gross = offer.salary;

 if (!template) {
 // Fallback if no template exists
 return {
 gross,
 basic: gross * 0.5,
 hra: gross * 0.2, // 40% of 50%
 allowances: gross * 0.3,
 pfEmployee: 0,
 esiEmployee: 0,
 netSalary: gross,
 isStandard: false
 };
 }

 const basic = gross * (template.basicPercentage / 100);
 const hra = basic * (template.hraPercentageOfBasic / 100);
 const allowances = gross - (basic + hra);

 const pfEmployee = basic * (template.pfPercentage / 100);
 const esiEmployee = gross < 21000 ? gross * (template.esiPercentage / 100) : 0;
 const deductions = pfEmployee + esiEmployee;
 
 const pfEmployer = basic * (template.employerPfPercentage / 100);
 const esiEmployer = gross < 21000 ? gross * (template.employerEsiPercentage / 100) : 0;

 return {
 gross,
 basic,
 hra,
 allowances,
 pfEmployee,
 esiEmployee,
 pfEmployer,
 esiEmployer,
 deductions,
 netSalary: gross - deductions,
 templateName: template.name,
 isStandard: true
 };
};
