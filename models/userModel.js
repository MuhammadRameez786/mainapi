const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const {ObjectId} = mongoose.Schema.Types


//name, email, photo, password, passwordConfirmed
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name"],
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    description: {
        type: String,
    },
    pic: {
        type: String,
        default:"https://res.cloudinary.com/dmesqweam/image/upload/v1678278251/SeekPng.com_user-png_730482_iqosah.png",
    },        
    role: {
        type: String,
        enum: ["user", "creator","admin","guide"],
        default: "user",
    },

    password: {
        type: String,
        required: [true, "please provide a password"],
        minlength: 8,
        select: false,
    },
    // passwordConfirm: {
    //     type: String,
    //     required: [true, "please confirm your password"],
    //     validate: {
    //         // This will only work on save not on find, findone
    //         validator: function (value) {
    //           return value === this.password //abc === abc true, abc ===acb false
    //         },
    //         message: "password is not the same",
    //     },            
    // },
    passwordchangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    verified: {
        type: Boolean,
        default: false
    },
    followers:[{type:ObjectId,ref:"User"}],
    following:[{type:ObjectId,ref:"User"}]
});



userSchema.pre("save", function(next) {
    if(!this.isModified("password") || this.isNew) return next();

    this.passwordchangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false} });
    next();
});
// userSchema.pre("save", async function (next) {
//     //PASSWORD MODEIFIED
//     if (!this.isModified("password")) return next();
//     //Rus this code

//     //DELETE CONFIRM PASSWORD
//     this.passwordConfirm = undefined;
//     next();
// });

userSchema.methods.correctPassword = async function (
    candidatepassword,
    userPassword
) {
    return await bcrypt.compare(candidatepassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordchangedAt) {
        const changedTimeStamp = parseInt(this.passwordchangedAt.getTime()/ 1000, 10);
        return JWTTimestamp < changedTimeStamp; // 300 < 200
        
        console.log(changedTimeStamp, JWTTimestamp);
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

        console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};
userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});
	return token;
};

// BY DEFAULT WE WANT TO RETURN FALSE, MEANS NOT CHANGE
const User = mongoose.model("User", userSchema);

const validate = (data) => {
    const schema = Joi.object({
      name: Joi.string().required().label("Full Name"),
      email: Joi.string().email().required().label("Email Address"),
      password: passwordComplexity().required().label("Password"),
      description: Joi.string(),
      pic: Joi.string(),
      role: Joi.string().valid("user", "creator", "admin", "guide").default("user"),
      //passwordConfirm: Joi.string().valid(Joi.ref("password")).required().label("Confirm Password"),
    });
    return schema.validate(data);
};

module.exports = { User, validate };