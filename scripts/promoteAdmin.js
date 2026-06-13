require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const shouldApply = process.argv.includes("--apply");
const emailArg = process.argv.find((arg) => arg.includes("@"));
const email = String(emailArg || "").trim().toLowerCase();

const promoteAdmin = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  if (!email) {
    throw new Error("Email is required. Usage: npm run admin:promote -- user@example.com");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(`No user found for ${email}`);
  }

  console.log(`User: ${user.email}`);
  console.log(`Current role: ${user.role}`);
  console.log(`Target role: admin`);

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to promote this user.");
    return;
  }

  user.role = "admin";
  await user.save();

  console.log(`${user.email} is now an admin.`);
};

promoteAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
