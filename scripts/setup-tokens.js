#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const envPath = path.join(__dirname, "../.env.local");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function main() {
  console.log("\n🔑 REVORA - Token Setup Helper\n");
  console.log("Este script te ayuda a agregar los tokens a .env.local\n");

  // Leer .env.local existente
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Preguntar por tokens
  const tokens = {};

  console.log("Presiona Enter para saltar una pregunta (no agregar ese token)\n");

  // Vercel
  console.log("📦 VERCEL");
  tokens.VERCEL_TOKEN = await question(
    'Paste VERCEL_TOKEN (from https://vercel.com/account/tokens): '
  );
  if (tokens.VERCEL_TOKEN) {
    tokens.VERCEL_ORG_ID = await question(
      "Paste VERCEL_ORG_ID (from https://vercel.com/account/settings): "
    );
  }

  // Google Ads
  console.log("\n🔍 GOOGLE ADS");
  tokens.GOOGLE_ADS_CUSTOMER_ID = await question(
    "Paste GOOGLE_ADS_CUSTOMER_ID (123-456-7890): "
  );
  if (tokens.GOOGLE_ADS_CUSTOMER_ID) {
    tokens.GOOGLE_ADS_ACCESS_TOKEN = await question(
      "Paste GOOGLE_ADS_ACCESS_TOKEN (ya29.xxxxx): "
    );
    tokens.GOOGLE_ADS_DEVELOPER_TOKEN = await question(
      "Paste GOOGLE_ADS_DEVELOPER_TOKEN (optional): "
    );
  }

  // Meta
  console.log("\n👍 META / FACEBOOK");
  tokens.META_ACCESS_TOKEN = await question(
    "Paste META_ACCESS_TOKEN (EAAB...): "
  );
  if (tokens.META_ACCESS_TOKEN) {
    tokens.META_BUSINESS_ACCOUNT_ID = await question(
      "Paste META_BUSINESS_ACCOUNT_ID (123456789012345): "
    );
    tokens.META_WEBHOOK_VERIFY_TOKEN = await question(
      "Paste META_WEBHOOK_VERIFY_TOKEN (any random string): "
    );
    tokens.META_WEBHOOK_SECRET = await question(
      "Paste META_WEBHOOK_SECRET (for webhook signing): "
    );
  }

  // Resend
  console.log("\n📧 RESEND");
  tokens.RESEND_WEBHOOK_SECRET = await question(
    "Paste RESEND_WEBHOOK_SECRET (optional): "
  );

  rl.close();

  // Actualizar .env.local
  let updatedContent = envContent;

  for (const [key, value] of Object.entries(tokens)) {
    if (!value) continue; // Skip empty

    const regex = new RegExp(`^${key}=.*$`, "m");

    if (regex.test(updatedContent)) {
      // Actualizar existente
      updatedContent = updatedContent.replace(regex, `${key}="${value}"`);
    } else {
      // Agregar nuevo
      updatedContent += `\n${key}="${value}"`;
    }
  }

  // Guardar
  fs.writeFileSync(envPath, updatedContent);

  console.log("\n✅ .env.local updated successfully!\n");
  console.log("Tokens guardados:");
  for (const [key, value] of Object.entries(tokens)) {
    if (value) {
      const masked = value.substring(0, 10) + "...";
      console.log(`  ✓ ${key} = ${masked}`);
    }
  }

  console.log("\n📝 Próximo paso:");
  console.log("  npm run dev");
  console.log("  Probar generar campaña\n");
}

main().catch(console.error);
