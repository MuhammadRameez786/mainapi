

//------USERS
const asyncHandler = require("express-async-handler");
const { User } = require("./../models/userModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { requireLogin } = require("../middleware/requireLogin");



const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};


exports.updateMe = catchAsync(async (req,res,next) => {
  // Create Error if user updating Password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(
        "This route is not for updating the password. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2 Update User data
  const filteredBody = filterObj(req.body, "name", "email", "description", "pic");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  const token = generateToken(updatedUser._id);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user: updatedUser,
    },
  });
});


exports.deleteMe = catchAsync(async (req, res, next) => {
  console.log(req.body);
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
      status: 'success',
      data: null
  });
});


exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
        
    //SEND QUERY
    res.status(200).json({
      status: "success",
      results: users.length,
      data: {
        users,
      },
    });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

exports.getSingleUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

//module.exports = updateUserProfile