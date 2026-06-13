const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { getMailErrorDetails } = require("../utils/sendEmail");
const { passwordChangedEmail, passwordResetEmail } = require("../utils/emailTemplates");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

const sanitizeUser = (user) => {
  if (!user) return null;
  const safeUser = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete safeUser.password;
  delete safeUser.__v;
  return safeUser;
};

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const getUserDisplayName = (user) => `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Movieflix user";

const pickProfileFields = (payload) => {
  const allowedFields = ["firstName", "lastName", "email", "phone"];
  return allowedFields.reduce((profileFields, field) => {
    if (payload[field] !== undefined) {
      profileFields[field] = field === "email" ? normalizeEmail(payload[field]) : payload[field];
    }
    return profileFields;
  }, {});
};

exports.registerUser = async (req, res) => {
    try {
      const { password } = req.body;
      const email = normalizeEmail(req.body.email);
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const duplicateChecks = [{ email }];
      if (req.body.phone) duplicateChecks.push({ phone: req.body.phone });
  
      const existingUser = await User.findOne({
        $or: duplicateChecks,
      });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const userPayload = {
        ...req.body,
        email,
        password: hashedPassword,
        passwordChangedAt: new Date(),
      };
  
      const newUser = new User(userPayload);
      await newUser.save();
      const token = signToken(newUser._id);
      res.status(201).json({ token, user: sanitizeUser(newUser), success:true, message: 'User registered successfully' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'User already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  };
  
  exports.loginUser = async (req, res) => {
    try {
      const { password } = req.body;
      const email = normalizeEmail(req.body.email);
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      const token = signToken(user._id);
      res.status(200).json({ token, user: sanitizeUser(user), success:true, message: 'Login successful' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Email or phone already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  };

  exports.forgotPassword = async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
      const genericResponse = {
        success: true,
        message: "If an account exists, password reset instructions are ready.",
      };

      if (!user) {
        return res.status(200).json(genericResponse);
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = hashResetToken(resetToken);
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${clientUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Movieflix password",
          html: passwordResetEmail({ name: getUserDisplayName(user), resetUrl }),
        });
      } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        const details = getMailErrorDetails(error);
        console.error("Password reset email failed:", details);
        const message = process.env.NODE_ENV === "production"
          ? "Unable to send password reset email. Please try again later."
          : `Unable to send password reset email: ${details.message || "Unknown mail error"}`;
        return res.status(500).json({ success: false, message });
      }

      return res.status(200).json({
        ...genericResponse,
        resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  exports.resetPassword = async (req, res) => {
    try {
      const token = req.params.token || req.body.token;
      const { password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, message: "Reset token and new password are required" });
      }

      if (password.length < 5) {
        return res.status(400).json({ success: false, message: "Password must be at least 5 characters" });
      }

      const user = await User.findOne({
        passwordResetToken: hashResetToken(token),
        passwordResetExpires: { $gt: new Date() },
      }).select("+password +passwordResetToken +passwordResetExpires");

      if (!user) {
        return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
      }

      user.password = await bcrypt.hash(password, 10);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = new Date();
      await user.save();

      await sendEmail({
        to: user.email,
        subject: "Your Movieflix password was changed",
        html: passwordChangedEmail({ name: getUserDisplayName(user) }),
      }).catch(() => null);

      const authToken = signToken(user._id);
      return res.status(200).json({ success: true, message: "Password changed successfully", token: authToken });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  exports.changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Current password and new password are required" });
      }

      if (newPassword.length < 5) {
        return res.status(400).json({ success: false, message: "Password must be at least 5 characters" });
      }

      const user = await User.findById(req.user._id).select("+password");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordChangedAt = new Date();
      await user.save();

      await sendEmail({
        to: user.email,
        subject: "Your Movieflix password was changed",
        html: passwordChangedEmail({ name: getUserDisplayName(user) }),
      }).catch(() => null);

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
        user: sanitizeUser(user),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  exports.getLoggedInUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Get token from headers

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: sanitizeUser(user), success:true, message: "User retrieved successfully" });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}


  exports.updateUser = async (req, res) => {
    try {
      const updates = pickProfileFields(req.body);
  
      const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        updates,
        { new: true, runValidators: true }
      );
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      res.status(200).json({
        user: sanitizeUser(user),
        success: true,
        message: "User successfully updated",
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: "Email or phone number already in use" });
      }
      res.status(500).json({ message: error.message });
    }
  };

  exports.uploadFile = async (req, res, next) => {
    try {
      const userId = req.user._id;
  
      if (!req.file || !req.file.path) {
        return res.status(400).json({ message: "No file uploaded", status: false });
      }
  
      await User.findByIdAndUpdate(userId, { profileImage: req.file.path });
  
      const updatedUser = await User.findById(userId);
  
      res.status(200).json({
        message: "Profile image uploaded successfully",
        user: sanitizeUser(updatedUser),
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
  


  // (async () => {
  //   try {
  //       await User.deleteMany({});
  //     const users = await User.find();
  //     console.log("All Users:", users);
  //   } catch (error) {
  //     console.error("Error fetching users:", error.message);
  //   }
  // })();
