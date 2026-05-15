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

    // ✅ FIX: Use a transaction to prevent partial creation, and handle orphaned records
    await prisma.$transaction(async (tx) => {
        
        // 1. Check if user already exists from a previous failed attempt
        let user = await tx.user.findFirst({
            where: { email: invite.email, companyId: invite.companyId }
        });

        if (user) {
            user = await tx.user.update({
                where: { id: user.id },
                data: { password: hashedPassword, name: name || user.name }
            });
        } else {
            user = await tx.user.create({
              data : {
                    name: name || invite.email.split('@')[0],
                    email : invite.email,
                    password : hashedPassword,
                    role : invite.role,
                    companyId : invite.companyId,
                    status : "PENDING_APPROVAL",
                    isEmailVerified : true
                }
            });
        }

        // Check if the provided department and designation actually exist in this company
        const validDept = await tx.department.findUnique({ where: { id: invite.departmentId || "" } });
        const validDesig = await tx.designation.findUnique({ where: { id: invite.designationId || "" } });

        // Fallbacks just in case the HR used the wrong ID during invite
        let finalDeptId = invite.departmentId;
        let finalDesigId = invite.designationId;

        if (!validDept) {
            const firstDept = await tx.department.findFirst({ where: { companyId: invite.companyId } });
            if (!firstDept) throw new Error("Company has no departments setup yet.");
            finalDeptId = firstDept.id;
        }

        if (!validDesig) {
            const firstDesig = await tx.designation.findFirst({ where: { companyId: invite.companyId } });
            if (!firstDesig) throw new Error("Company has no designations setup yet.");
            finalDesigId = firstDesig.id;
        }

        // 2. Check if employee record already exists
        const existingEmployee = await tx.employee.findFirst({
            where: { userId: user.id }
        });

        if (!existingEmployee) {
            await tx.employee.create({
              data: {
                  userId: user.id,
                  companyId: invite.companyId,
                  employeeCode: `EMP-${Date.now()}`,
                  departmentId: finalDeptId,
                  designationId: finalDesigId,
                  joiningDate: new Date(),
                  employmentType: "FRESHER",
                  onboardingStep: 1,
                  status: "INVITED"
              }
            });
        }

        // 3. Mark invite accepted
        await tx.employeeInvite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() }
        });
    }, { timeout: 20000 }); // Increase timeout to 20 seconds for slow free tier DB

    // We must return the user ID for the next steps, so fetch it outside transaction
    const finalUser = await prisma.user.findFirst({
        where: { email: invite.email, companyId: invite.companyId }
    });

    return {
        message: "Password set. Verify email next",
        userId: finalUser.id
    };
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
    salary,          // Accept plain gross salary number from HR
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
        // Primary fallback: Industry standard based on level
        // Secondary fallback: Company default setting
        finalNoticePeriod = level >= 3 ? "90 Days" : (employee.company.defaultNoticePeriod || "30 Days");
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
        // Priority: salaryBreakdown object > plain salary number > offer letter auto-calc
        let finalSalary = salaryBreakdown;

        // If HR sent a plain gross salary number, build a standard breakdown
        if (!finalSalary && salary) {
            const gross = Number(salary);
            const basic = gross * 0.5;
            const hra = gross * 0.2;
            const allowances = gross * 0.3;
            finalSalary = {
                basic, hra, allowances,
                bonus: 0, pfEmployee: basic * 0.12,
                esiEmployee: gross < 21000 ? gross * 0.0075 : 0,
                pfEmployer: basic * 0.12,
                esiEmployer: gross < 21000 ? gross * 0.0325 : 0,
                deductions: basic * 0.12 + (gross < 21000 ? gross * 0.0075 : 0),
                netSalary: gross - (basic * 0.12 + (gross < 21000 ? gross * 0.0075 : 0))
            };
        }

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
            personal: { select: { gender: true, dob: true, maritalStatus: true, bloodGroup: true, nationality: true } },
            educations: true,
            experiences: true,
            bankDetails: true,
            skills: true,
            documents: { select: { id: true, name: true, status: true } }
        },
        orderBy: { joiningDate: "desc" }
    });

    return employees;
};


// ✅ HR STEP: Get Salary Preview (Auto-Calculation for UI)
export const getSalaryPreviewService = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { company: true, user: true }
    });

    if (!employee) throw Error("Employee not found");

    const offer = await prisma.offerLetter.findFirst({
        where: { employeeEmail: employee.user.email },
        orderBy: { createdAt: "desc" }
    });

    if (!offer) throw Error("No offer letter found for this employee to calculate salary.");

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

/**
 * ✅ UNIFIED ONBOARDING: ONE API FOR EVERYTHING
 * Accepts all fields and files in a single massive payload.
 */
export const finalizeFullOnboardingService = async (userId, data, files = {}) => {
    const employee = await prisma.employee.findUnique({ 
        where: { userId },
        include: { user: true, company: true }
    });
    if (!employee) throw Error("Employee profile not found");

    // 🏆 Industry Level Polish: Smart Validation
    // 1. Legal Declaration Check
    if (!data.isDeclaredTrue) {
        throw Error("You must accept the legal declaration to complete onboarding.");
    }

    // 2. Experienced Professional Check
    if (employee.employmentType === "EXPERIENCED") {
        if (!data.experience || !Array.isArray(data.experience) || data.experience.length === 0) {
            throw Error("Previous work experience is mandatory for experienced professionals.");
        }
        if (!files.relieving_letter) {
            throw Error("Relieving letter from the previous employer is mandatory.");
        }
        if (!files.payslips) {
            throw Error("Recent payslips are mandatory for salary verification.");
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Personal & Identity
        if (data.personal) {
            await tx.employeePersonal.upsert({
                where: { employeeId: employee.id },
                update: {
                    gender: data.personal.gender,
                    dob: data.personal.dob ? new Date(data.personal.dob) : undefined,
                    maritalStatus: data.personal.maritalStatus,
                    bloodGroup: data.personal.bloodGroup,
                    nationality: data.personal.nationality,
                    personalEmail: data.contact?.personalEmail,
                    phone: data.contact?.phone,
                    alternatePhone: data.contact?.alternatePhone,
                    addressLine1: data.contact?.addressLine1,
                    addressLine2: data.contact?.addressLine2,
                    city: data.contact?.city,
                    state: data.contact?.state,
                    country: data.contact?.country,
                    pincode: data.contact?.pincode
                },
                create: {
                    employeeId: employee.id,
                    gender: data.personal.gender,
                    dob: data.personal.dob ? new Date(data.personal.dob) : null,
                    maritalStatus: data.personal.maritalStatus,
                    bloodGroup: data.personal.bloodGroup,
                    nationality: data.personal.nationality,
                    personalEmail: data.contact?.personalEmail,
                    phone: data.contact?.phone,
                    alternatePhone: data.contact?.alternatePhone,
                    addressLine1: data.contact?.addressLine1,
                    addressLine2: data.contact?.addressLine2,
                    city: data.contact?.city,
                    state: data.contact?.state,
                    country: data.contact?.country,
                    pincode: data.contact?.pincode
                }
            });
        }

        // 2. Emergency Contacts
        if (data.emergency && Array.isArray(data.emergency)) {
            await tx.employeeEmergencyContact.deleteMany({ where: { employeeId: employee.id } });
            await tx.employeeEmergencyContact.createMany({
                data: data.emergency.map(ec => ({
                    employeeId: employee.id,
                    contactPersonName: ec.contactPersonName,
                    relationship: ec.relationship,
                    contactNumber: ec.contactNumber,
                    alternateContact: ec.alternateContact,
                    address: ec.address
                }))
            });
        }

        // 3. Education
        if (data.education && Array.isArray(data.education)) {
            await tx.employeeEducation.deleteMany({ where: { employeeId: employee.id } });
            await tx.employeeEducation.createMany({
                data: data.education.map(edu => ({
                    employeeId: employee.id,
                    degree: edu.degree,
                    specialization: edu.specialization,
                    college: edu.college,
                    university: edu.university,
                    percentage: edu.percentage,
                    cgpa: edu.cgpa,
                    startYear: edu.startYear,
                    endYear: edu.endYear
                }))
            });
        }

        // 4. Experience
        if (data.experience && Array.isArray(data.experience)) {
            await tx.employeeExperience.deleteMany({ where: { employeeId: employee.id } });
            await tx.employeeExperience.createMany({
                data: data.experience.map(exp => ({
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
        }

        // 5. Skills
        if (data.skills) {
            await tx.employeeSkill.deleteMany({ where: { employeeId: employee.id } });
            await tx.employeeSkill.create({
                data: {
                    employeeId: employee.id,
                    primarySkills: Array.isArray(data.skills.primarySkills) ? data.skills.primarySkills : [],
                    secondarySkills: Array.isArray(data.skills.secondarySkills) ? data.skills.secondarySkills : [],
                    certifications: Array.isArray(data.skills.certifications) ? data.skills.certifications : [],
                    languagesKnown: Array.isArray(data.skills.languagesKnown) ? data.skills.languagesKnown : [],
                    linkedinUrl: data.skills.linkedinUrl || null,
                    githubUrl: data.skills.githubUrl || null,
                    portfolioUrl: data.skills.portfolioUrl || null
                }
            });
        }

        // 6. Bank Details
        if (data.bank) {
            await tx.employeeBank.upsert({
                where: { employeeId: employee.id },
                update: {
                    bankName: data.bank.bankName,
                    accountHolderName: data.bank.accountHolderName,
                    accountNumber: data.bank.accountNumber,
                    ifscCode: data.bank.ifscCode,
                    branchName: data.bank.branchName,
                    upiId: data.bank.upiId
                },
                create: {
                    employeeId: employee.id,
                    bankName: data.bank.bankName,
                    accountHolderName: data.bank.accountHolderName,
                    accountNumber: data.bank.accountNumber,
                    ifscCode: data.bank.ifscCode,
                    branchName: data.bank.branchName,
                    upiId: data.bank.upiId
                }
            });
        }

        // 7. Nominee Details
        if (data.nominee) {
            await tx.employeeNominee.upsert({
                where: { employeeId: employee.id },
                update: {
                    nomineeName: data.nominee.nomineeName,
                    relationship: data.nominee.relationship,
                    dob: data.nominee.dob ? new Date(data.nominee.dob) : undefined,
                    gender: data.nominee.gender,
                    phone: data.nominee.phone,
                    email: data.nominee.email,
                    aadhaarNumber: data.nominee.aadhaarNumber,
                    panNumber: data.nominee.panNumber,
                    nomineePercentage: data.nominee.nomineePercentage,
                    address: data.nominee.address
                },
                create: {
                    employeeId: employee.id,
                    nomineeName: data.nominee.nomineeName,
                    relationship: data.nominee.relationship,
                    dob: data.nominee.dob ? new Date(data.nominee.dob) : null,
                    gender: data.nominee.gender,
                    phone: data.nominee.phone,
                    email: data.nominee.email,
                    aadhaarNumber: data.nominee.aadhaarNumber,
                    panNumber: data.nominee.panNumber,
                    nomineePercentage: data.nominee.nomineePercentage,
                    address: data.nominee.address
                }
            });
        }

        // 8. Compliance
        if (data.compliance) {
            await tx.employeeCompliance.upsert({
                where: { employeeId: employee.id },
                update: {
                    uanNumber: data.compliance.uanNumber,
                    pfNumber: data.compliance.pfNumber,
                    esiNumber: data.compliance.esiNumber
                },
                create: {
                    employeeId: employee.id,
                    uanNumber: data.compliance.uanNumber,
                    pfNumber: data.compliance.pfNumber,
                    esiNumber: data.compliance.esiNumber
                }
            });
        }

        // 9. Process File Uploads (if any)
        if (files && Object.keys(files).length > 0) {
            for (const [fieldname, fileArray] of Object.entries(files)) {
                const file = fileArray[0];
                const docType = fieldname.toUpperCase();

                if (fieldname === "profilePhoto") {
                    await tx.employee.update({
                        where: { id: employee.id },
                        data: { profilePhoto: `/uploads/employee-docs/${file.filename}` }
                    });
                } else if (fieldname === "signature") {
                    await tx.employee.update({
                        where: { id: employee.id },
                        data: { signature: `/uploads/employee-docs/${file.filename}` }
                    });
                } else {
                    await tx.employeeDocument.create({
                        data: {
                            employeeId: employee.id,
                            name: docType,
                            fileUrl: `/uploads/employee-docs/${file.filename}`,
                            status: "PENDING"
                        }
                    });
                }
            }
        }

        // 10. Finalize Employee State
        return await tx.employee.update({
            where: { id: employee.id },
            data: { 
                onboardingCompleted: true,
                isDeclaredTrue: true,
                onboardingStep: 10,
                status: "PENDING_APPROVAL"
            }
        });
    }, { timeout: 30000 });

    // 🏆 Industry Level Polish: Automated Email Notifications
    // 1. Send confirmation to Employee
    sendEmail(
        employee.user.email,
        "Onboarding Received - Pending Verification",
        `<h3>Onboarding Submission Successful</h3>
         <p>Dear ${employee.user.name},</p>
         <p>Your profile has been submitted successfully! Our HR team is now verifying your documents.</p>
         <p>This process usually takes 24-48 hours. We will notify you once the verification is complete.</p>`
    ).catch(err => console.error("Employee Submission Email Failed:", err.message));

    // 2. Send notification to HR/Owner
    if (employee.company.email) {
        sendEmail(
            employee.company.email,
            "Action Required: New Onboarding Submission",
            `<h3>New Employee Onboarding Submission</h3>
             <p>A new employee, <strong>${employee.user.name}</strong>, has submitted their profile for review.</p>
             <p>Please log in to your dashboard to review their documents and finalize the joining.</p>
             <br/>
             <a href="${process.env.FRONTEND_URL}/login" style="background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Review Submission
             </a>`
        ).catch(err => console.error("HR Notification Email Failed:", err.message));
    }

    return { 
        success: true,
        message: "Onboarding finalized successfully! Your profile is now under review by HR.",
        employeeId: result.id,
        onboardingCompleted: true 
    };
};
