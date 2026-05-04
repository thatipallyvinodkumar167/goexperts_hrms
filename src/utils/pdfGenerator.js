import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateOfferLetter = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `Offer_${data.email}_${Date.now()}.pdf`;
            const filePath = path.join("uploads/employee-docs", fileName);

            // Ensure directory exists
            if (!fs.existsSync("uploads/employee-docs")) {
                fs.mkdirSync("uploads/employee-docs", { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER ---
            // doc.image("src/utils/templates/logo.png", 50, 45, { width: 50 });
            doc.fillColor("#444444")
               .fontSize(20)
               .text("GOExperts HRMS", 110, 57)
               .fontSize(10)
               .text("123 Business Hub, Tech City", 200, 65, { align: "right" })
               .text("Hyderabad, India - 500081", 200, 80, { align: "right" })
               .moveDown();

            doc.hr = (y) => doc.moveTo(50, y).lineTo(550, y).stroke();
            doc.hr(100);

            // --- BODY ---
            doc.moveDown(2);
            doc.fontSize(25).fillColor("#000000").text("OFFER LETTER", { align: "center" });
            doc.moveDown();

            doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown();
            doc.text(`To,`);
            doc.text(`${data.email}`);
            doc.moveDown();

            doc.text(`Dear Candidate,`, { bold: true });
            doc.moveDown();
            doc.text(`We are pleased to offer you the position of ${data.position} at GOExperts HRMS. We were impressed with your skills and experience and believe you will be a valuable asset to our team.`);
            doc.moveDown();

            // --- DETAILS TABLE ---
            doc.fontSize(14).text("Offer Details:", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12)
               .text(`Position: ${data.position}`)
               .text(`Annual CTC: INR ${data.salary.toLocaleString()}`)
               .text(`Joining Date: ${new Date(data.joiningDate).toLocaleDateString()}`)
               .text(`Location: Remote / Office`);
            
            doc.moveDown();
            doc.text("Please review the terms and conditions attached with this letter. If you accept this offer, please click the 'Accept' button in the email sent to you.");

            // --- SIGNATURE ---
            doc.moveDown(4);
            doc.text("Best Regards,", 50);
            doc.moveDown();
            doc.text("Human Resources Department");
            doc.text("GOExperts HRMS");

            doc.end();

            stream.on("finish", () => resolve({ filePath, fileName }));
            stream.on("error", (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};

export const generateJoiningLetter = async (data) => {
    // Similar structure to Offer Letter but for Appointment
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Joining_${data.email}_${Date.now()}.pdf`;
        const filePath = path.join("uploads/employee-docs", fileName);

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).text("GOExperts HRMS", { align: "center" });
        doc.moveDown();
        doc.fontSize(25).text("APPOINTMENT LETTER", { align: "center" });
        doc.moveDown(2);
        
        doc.fontSize(12).text(`This is to formally appoint ${data.name} as ${data.position} effective from ${data.joiningDate}.`);
        doc.moveDown();
        doc.text("Welcome to the family!");
        
        doc.end();
        stream.on("finish", () => resolve({ filePath, fileName }));
    });
};
