const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.registerUser = async (req, res) => {
    try {
      const { email, password } = req.body
      console.log(req.body);
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
  
      const existingUser = await User.findOne({ 'email': email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      req.body.password = hashedPassword;
  
      const newUser = new User(req.body);
      await newUser.save();
      const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(201).json({ token,user:newUser,success:true, message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  exports.loginUser = async (req, res) => {
    try {
      const { email, password} = req.body;
      const user = await User.findOne({ 'email': email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(200).json({ token,user, success:true, message: 'Login successful' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.getLoggedInUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Get token from headers

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password"); // Exclude password

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({user, success:true, message: "User retrieved successfully" });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}


  exports.updateUser = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        req.body,
        { new: true } // returns the updated document
      );
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      res.status(200).json({
        user,
        success: true,
        message: "User successfully updated",
      });
    } catch (error) {
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
        user: updatedUser,
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