import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../../../.env") });

export const env = {
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET
};