import { inviteService, acceptOfferService } from "../services/inviteService.js";

export const inviteUser = async (req, res) => {
    try {
        const data = await inviteService({
            ...req.body,
            companyId: req.user.companyId,
            createdById: req.user.id
        });

        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const acceptOffer = async (req, res) => {
    try {
        // Support both GET (email link) and POST (API)
        const email = req.query.email || req.body.email;
        if (!email) throw new Error("Email is required");

        const result = await acceptOfferService(email);

        // If clicked from an email (GET request), show a nice HTML page
        if (req.method === 'GET') {
            return res.send(`
                <html>
                <body style="background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
                        <h1 style="color: #10B981; font-size: 48px; margin: 0;">🎉</h1>
                        <h2 style="color: #1f2937; margin-top: 16px;">Offer Accepted!</h2>
                        <p style="color: #4b5563; line-height: 1.5;">Welcome to the team! We have just sent you a final email to set up your account password.</p>
                        <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">You can safely close this window and check your inbox.</p>
                    </div>
                </body>
                </html>
            `);
        }

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        if (req.method === 'GET') {
             return res.send(`
                <div style="text-align: center; padding: 40px; font-family: sans-serif;">
                    <h2 style="color: #ef4444;">Oops!</h2>
                    <p>${error.message}</p>
                </div>
            `);
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

import prisma from "../config/db.js";
import crypto from "crypto";
import { setupCompanyAccount } from "../services/companyService.js";
import { acceptInviteService } from "../services/onboardingService.js";

export const unifiedSetupPassword = async (req, res) => {
    try {
        const { token, password, name } = req.body;
        if (!token || !password) throw new Error("Token and password are required");

        const safeToken = token.trim();
        const hashedToken = crypto.createHash("sha256").update(safeToken).digest("hex");

        // 1. Check if it's a Company Invite (These are stored as hashed tokens)
        const companyInvite = await prisma.companyInvite.findUnique({ where: { token: hashedToken } });
        if (companyInvite) {
            // setupCompanyAccount expects the raw token, it hashes it internally again
            const result = await setupCompanyAccount(safeToken, password);
            return res.status(200).json({ success: true, type: "COMPANY", ...result });
        }

        // 2. Check if it's an Employee Invite (These are stored as raw tokens)
        const employeeInvite = await prisma.employeeInvite.findUnique({ where: { token: safeToken } });
        if (employeeInvite) {
            const result = await acceptInviteService({ token: safeToken, password, name });
            return res.status(200).json({ success: true, type: "EMPLOYEE", ...result });
        }

        // 3. Not found anywhere
        throw new Error("Invalid or expired token");
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};