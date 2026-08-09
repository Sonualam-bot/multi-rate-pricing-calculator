import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler";
import documentRoutes from "./routes/document.routes";
import reportRoutes from "./routes/report.routes";

/**
 * Entry point — wires middleware, mounts routes/*.routes.ts, and starts
 * the server only after config/db.ts confirms a DB connection.
 * Request flow for any endpoint: routes/ -> controllers/ -> services/
 * (-> calc/ for money math) -> models/, with errors bubbling up through
 * middleware/errorHandler.ts, mounted last below.
 */

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/reports", reportRoutes);

/**
 * Must be mounted after every route it's meant to catch — Express only
 * routes a next(err) call to error middleware registered below the route
 * that raised it. Any new route needs to go above this line, not below.
 */
app.use(errorHandler);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
