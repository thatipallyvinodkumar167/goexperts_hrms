
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { companyGuard } from "../middleware/companyGuard.js";
import { inviteUser, acceptOffer, unifiedSetupPassword } from "../controller/inviteController.js";

const router = express.Router();

router.post("/invite", authMiddleware, allowRoles("OWNER", "HR"), companyGuard, inviteUser);
router.all("/accept-offer", acceptOffer);
router.get("/setup-password", (req, res) => {
    res.send(`
        <html>
        <body style="background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
                <h1 style="color: #4F46E5; font-size: 48px; margin: 0;">📱</h1>
                <h2 style="color: #1f2937; margin-top: 16px;">Open in App</h2>
                <p style="color: #4b5563; line-height: 1.5;">Please open this link directly inside the GOExperts HRMS mobile app to set up your password.</p>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">If the app is installed, try long-pressing the link in your email and selecting "Open with app".</p>
            </div>
        </body>
        </html>
    `);
});
router.post("/setup-password", unifiedSetupPassword);

export default router;