// این اسکریپت را روی سیستم خودتان اجرا کنید (نه روی سرور) تا رمز هرگز جایی ارسال نشود.
//
// نحوه استفاده:
//   node scripts/add-user.mjs <username> <password>
//
// خروجی را کپی کنید و به آرایه HR_USERS در فایل
// functions/_data/hr-users.js اضافه کنید.

import { randomBytes, pbkdf2Sync } from "node:crypto";

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("استفاده: node scripts/add-user.mjs <username> <password>");
  process.exit(1);
}

const ITERATIONS = 100000;
const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, Buffer.from(salt, "hex"), ITERATIONS, 32, "sha256").toString("hex");

console.log("\nاین خط را داخل آرایه HR_USERS در functions/_data/hr-users.js قرار دهید:\n");
console.log(`  { username: ${JSON.stringify(username)}, salt: "${salt}", hash: "${hash}" },`);
console.log("\nرمز به‌صورت متن ساده هیچ‌جا ذخیره نشد.\n");
