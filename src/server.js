import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import logger from "./middleware/loggerMiddleware.js";
import { companyStatusCron } from "./jobs/companyStatusCron.js";
import { inviteReminderCron } from "./jobs/inviteReminderCron.js";
// import { ensureSuperAdmin } from "./bootstrap/ensureSuperAdmin.js";

const app = express();

dotenv.config();

app.use(express.json());

//loggers
app.use(logger);

//routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/subscription", subscriptionRoutes);


app.get("/", (req, res) => {
  res.send("Go experts HRMS..");
});

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    // await ensureSuperAdmin();
    // console.log("Default super admin ensured: goexperts@admin");


    companyStatusCron();
    inviteReminderCron();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
