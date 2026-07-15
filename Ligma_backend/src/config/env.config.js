import dotenv from "dotenv";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const isProd = process.env.NODE_ENV === "production";

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  // In production OPENROUTER_API_KEY must be provided. In development/test it's optional so server can start without a key.
  OPENROUTER_API_KEY: isProd ? z.string().min(1, "OPENROUTER_API_KEY is required") : z.string().optional().default("") ,
  OPENROUTER_MODEL: z.string().default("qwen/qwen3-next-80b-a3b-instruct:free"),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_CHAT_ENDPOINT: z.string().default("/chat/completions"),
  SOCKET_CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  // RESEND is optional in non-production environments
  RESEND_API_KEY: isProd ? z.string().min(1, "RESEND_API_KEY is required") : z.string().optional().default("") ,
  EMAIL_FROM: z.string().email().default("noreply@yourdomain.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export default parsed.data;
