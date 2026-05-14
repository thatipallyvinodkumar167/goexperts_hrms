import { 
    acceptInviteService, 
    saveBasicInfoService,
    saveContactInfoService,
    saveEmergencyContactService,
    saveEducationService,
    addExperienceService,
    saveSkillsService,
    uploadEmployeeDocumentsService,
    saveBankDetailsService,
    saveNomineeService,
    finalizeEmployeeJoiningService,
    getEmployeeOnboardingDetailsService,
    getAllEmployeeReviewsService,
    verifyEmailService, 
    updateDocumentStatusService,
    getSalaryPreviewService,
    saveComplianceAndFinalizeService,
    finalizeFullOnboardingService
} from "../services/onboardingService.js"

export const verifyEmail = async (req, res) => {
    try {
        const { userId } = req.body;
        const data = await verifyEmailService(userId);
        res.status(200).json({success : true, ...data});
    } catch (error) {
        res.status(400).json({ success : false, message : error.message});
    }
};

export const saveBasicInfo = async (req, res) => {
    try {
        const data = await saveBasicInfoService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveContactInfo = async (req, res) => {
    try {
        const data = await saveContactInfoService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveEmergencyContact = async (req, res) => {
    try {
        const data = await saveEmergencyContactService(req.user.id, req.body.contacts);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveEducation = async (req, res) => {
    try {
        const data = await saveEducationService(req.user.id, req.body.education);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveSkills = async (req, res) => {
    try {
        const data = await saveSkillsService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveBankDetails = async (req, res) => {
    try {
        const data = await saveBankDetailsService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveNominee = async (req, res) => {
    try {
        const data = await saveNomineeService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveComplianceAndFinalize = async (req, res) => {
    try {
        const data = await saveComplianceAndFinalizeService(req.user.id, req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const finalizeJoining = async (req, res) => {
    try {
        const data = await finalizeEmployeeJoiningService(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const uploadDocuments = async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }
        const data = await uploadEmployeeDocumentsService(req.user.id, req.files);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const addExperience = async (req, res) => {
    try {
        const data = await addExperienceService(req.user.id, req.body.experience);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllReviews = async (req, res) => {
    try {
        const data = await getAllEmployeeReviewsService(req.user.companyId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getEmployeeReview = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const data = await getEmployeeOnboardingDetailsService(employeeId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateDocumentStatus = async (req, res) => {
    try {
        const data = await updateDocumentStatusService(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getSalaryPreview = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const data = await getSalaryPreviewService(employeeId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const finalizeFullOnboarding = async (req, res) => {
    try {
        const body = req.body;
        
        // Helper to parse JSON strings if they come from a multipart request
        const parseJson = (val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return val; }
            }
            return val;
        };

        const data = {
            personal: parseJson(body.personal),
            contact: parseJson(body.contact),
            emergency: parseJson(body.emergency),
            education: parseJson(body.education),
            experience: parseJson(body.experience),
            skills: parseJson(body.skills),
            bank: parseJson(body.bank),
            nominee: parseJson(body.nominee),
            compliance: parseJson(body.compliance),
            isDeclaredTrue: parseJson(body.isDeclaredTrue) === true || body.isDeclaredTrue === 'true'
        };

        const result = await finalizeFullOnboardingService(req.user.id, data, req.files);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
