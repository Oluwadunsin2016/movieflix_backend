const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    min: 3,
    max: 20,
  },
  lastName: {
    type: String,
    required: true,
    min: 3,
    max: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    default: "https://i.pinimg.com/236x/2c/47/d5/2c47d5dd5b532f83bb55c4cd6f5bd1ef.jpg",
  },
  password: {
    type: String,
    required: true,
    min: 5,
  },
  });
  
  module.exports = model('User', userSchema);