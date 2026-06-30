/**
 * Verifies Razorpay API keys from apps/web/.env (read-only GET /plans).
 * Run: pnpm --filter web razorpay:check
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Razorpay from "razorpay";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const text = readFileSync(envPath, "utf8");

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

if (!keyId || !keySecret) {
  console.error("FAIL: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in .env");
  process.exit(1);
}

console.log("Key ID prefix:", `${keyId.slice(0, 12)}…`);
console.log("Key secret length:", keySecret.length);

const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

try {
  const plans = await client.plans.all({ count: 1 });
  console.log("OK: Razorpay accepted your API keys.");
  console.log("Plans reachable, count:", plans.count ?? 0);
  process.exit(0);
} catch (error) {
  const sdkError =
    error && typeof error === "object"
      ? /** @type {{ statusCode?: number; error?: { description?: string }; message?: string }} */ (
          error
        )
      : {};

  console.error(
    "FAIL:",
    sdkError.error?.description ??
      sdkError.message ??
      "Razorpay rejected the credentials",
  );
  console.error("HTTP status:", sdkError.statusCode ?? "unknown");

  if (sdkError.statusCode === 401) {
    console.error(
      "\nFix: Razorpay dashboard → Test Mode ON → Regenerate Key → copy Key ID + Key Secret together into .env and Vercel.",
    );
  }

  process.exit(1);
}
