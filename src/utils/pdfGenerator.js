import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

/**
 * Shared function to generate PDF from HTML using Puppeteer
 */
const generatePDFFromHTML = async (htmlContent, fileName) => {
    const filePath = path.join("uploads/employee-docs", fileName);

    // Ensure directory exists
    if (!fs.existsSync("uploads/employee-docs")) {
        fs.mkdirSync("uploads/employee-docs", { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu"
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });
        
        await page.pdf({
            path: filePath,
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
                left: "20mm"
            }
        });

        return { filePath, fileName };
    } finally {
        await browser.close();
    }
};

export const generateOfferLetter = async (data) => {
    const fileName = `Offer_${data.email}_${Date.now()}.pdf`;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            body { 
                font-family: 'Inter', sans-serif; 
                color: #1f2937; 
                line-height: 1.6; 
                margin: 0;
                padding: 0;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                border-bottom: 2px solid #6366f1; 
                padding-bottom: 30px; 
            }
            .company-name { 
                font-size: 32px; 
                font-weight: 700; 
                color: #4f46e5; 
                letter-spacing: -1px;
            }
            .company-info { 
                text-align: right; 
                font-size: 13px; 
                color: #6b7280; 
            }
            .title { 
                text-align: center; 
                font-size: 36px; 
                margin: 60px 0; 
                color: #111827; 
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 4px;
            }
            .content { 
                margin-bottom: 40px; 
                font-size: 15px;
            }
            .details-box { 
                background: #f8fafc; 
                border: 1px solid #e2e8f0; 
                padding: 30px; 
                border-radius: 12px; 
                margin: 30px 0; 
            }
            .details-row { 
                display: flex; 
                margin-bottom: 12px; 
            }
            .details-label { 
                width: 180px; 
                font-weight: 600; 
                color: #4b5563; 
            }
            .details-value { 
                color: #0f172a; 
                font-weight: 700; 
            }
            .signature { 
                margin-top: 60px; 
            }
            .stamp { 
                color: #6366f1; 
                font-weight: 600; 
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 15px; 
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .stamp::before {
                content: '';
                display: inline-block;
                width: 12px;
                height: 12px;
                background: #6366f1;
                border-radius: 50%;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">GOExperts</div>
            <div class="company-info">
                123 Business Hub, Tech City<br>
                Hyderabad, India - 500081<br>
                www.goexperts.com
            </div>
        </div>

        <div class="title">Offer Letter</div>

        <div class="content">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>To,<br><strong>${data.email}</strong></p>
            
            <p>Dear Candidate,</p>
            <p>We are delighted to extend this formal offer of employment to you for the position of <strong>${data.position}</strong> at <strong>GOExperts</strong>. We were highly impressed with your background and believe you will be an integral part of our continued success.</p>
        </div>

        <div class="details-box">
            <div class="details-row">
                <div class="details-label">Position:</div>
                <div class="details-value">${data.position}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Annual CTC:</div>
                <div class="details-value">INR ${data.salary.toLocaleString()}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Joining Date:</div>
                <div class="details-value">${new Date(data.joiningDate).toLocaleDateString()}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Work Location:</div>
                <div class="details-value">Remote / Hybrid</div>
            </div>
        </div>

        <div class="content">
            <p>This offer is contingent upon successful verification of your credentials. Please review the terms of employment. To accept this offer, please proceed with the link provided in the invitation email.</p>
            <p>We look forward to having you on board!</p>
        </div>

        <div class="signature">
            <p>Best Regards,</p>
            <br>
            <strong>Human Resources Team</strong><br>
            GOExperts
            <div class="stamp">Electronically Verified Document</div>
        </div>
    </body>
    </html>
    `;

    return generatePDFFromHTML(htmlContent, fileName);
};

export const generateJoiningLetter = async (data) => {
    const fileName = `Joining_${data.email}_${Date.now()}.pdf`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; color: #1f2937; line-height: 1.6; padding: 40px; }
            .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
            .company-name { font-size: 36px; font-weight: 700; color: #10b981; letter-spacing: -1px; }
            .title { text-align: center; font-size: 32px; margin: 60px 0; color: #111827; font-weight: 700; text-transform: uppercase; }
            .content { margin: 40px 0; font-size: 16px; color: #374151; }
            .welcome { font-size: 24px; color: #10b981; font-weight: 700; text-align: center; margin-top: 60px; }
            .signature { margin-top: 100px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .designation { color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">GOExperts</div>
            <p style="color: #6b7280; margin: 5px 0;">Official Appointment & Onboarding</p>
        </div>

        <div class="title">Letter of Appointment</div>

        <div class="content">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>Dear <strong>${data.name}</strong>,</p>
            
            <p>We are extremely pleased to formally appoint you as <strong>${data.position}</strong> at GOExperts. Your appointment is effective from your joining date of <strong>${new Date(data.joiningDate).toLocaleDateString()}</strong>.</p>
            
            <p>This document serves as your official record of joining. We are confident that your expertise will be a significant contribution to our organization's growth.</p>
        </div>

        <div class="welcome">Welcome to the Team! 🚀</div>

        <div class="signature">
            <strong>Authorized Signatory</strong><br>
            <span class="designation">Operations & HR Division</span><br>
            GOExperts
        </div>
    </body>
    </html>
    `;

    return generatePDFFromHTML(htmlContent, fileName);
};
