import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js"
// import { ensureSuperAdmin } from "./bootstrap/ensureSuperAdmin.js";

const app = express();

dotenv.config();

app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/candidate", candidateRoutes)


app.get("/", (req, res) => {
  res.send("Go experts HRMS..");
});

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    // await ensureSuperAdmin();
    // console.log("Default super admin ensured: goexperts@admin");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
