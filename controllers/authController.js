const crypto = require("crypto");
const {promisify} = require("util");
const jwt = require("jsonwebtoken");
const { User } = require("./../models/userModel");
const Token = require("./../models/token");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendEmail = require("../Utils/email");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const axios = require("axios");

//CREATE TOKEN

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
const creatSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000), // convert days to milliseconds
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};


const schema = Joi.object({
    name: Joi.string().required().label("Full Name"),
    email: Joi.string().email().required().label("Email Address"),
    password: passwordComplexity().required().label("Password"),
    description: Joi.string(),
    pic: Joi.string(),
    role: Joi.string().valid("user", "creator", "admin", "guide").default("user"),
    //passwordConfirm: Joi.string().valid(Joi.ref("password")).required().label("Confirm Password"),
});



//SIGNUP
exports.signup = async (req, res, next) => {
    try {  
		const { error } = schema.validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
		if (user)
			return res
				.status(409)
				.send({ message: "User with given email already Exist!" });

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt);

		user = await new User({ ...req.body, password: hashPassword }).save();

		const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex"),
		}).save();
		const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
		await sendEmail(user.email, "Verify Email", url);

		res
			.status(201)
			.send({ message: "An Email sent to your account please verify" });
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
    
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        //console.log("user:", user);
        if (!user) return res.status(400).send({ message: "Invalid link" });

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        //console.log("Token:", token);
        if (!token) return res.status(400).send({ message: "Invalid link" });
        
        console.log('Query:', { _id: user._id }, { verified: true });
        await User.updateOne({ _id: user._id}, {verified: true });
        await token.remove();

        res.status(200).send({ message: "Email verified successfully" });
    } catch (error) {
        //console.error("Error:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
    
};

//PROTECTING DATA
exports.protect = catchAsync(async (req,res,next) => {
    // 1 Check token
    let token;
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
        // console.log(token);
    };

    if(!token){
        return next(new AppError("You are not logged in to get access", 404))
    };
    // 2 Validate token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);
    // 3 User exist   
    const currentUser = await User.findOne({ _id: decoded.id });
    if(!currentUser) {
        return next(
            new AppError("The User belonging to this token no longer exist", 401)
        );
    }
    //4 Change password
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError("User recently changed the password", 401)
        );
    };
    //USER WILL HAVE ACCESS THE PROTECTED DATA
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return(req, res, next)=>{
        if(!roles.includes(req.user.role)) {
            return next(new AppError("You have not access to delete NFT", 403));
        }
        next();
    };
};

// NOW WE GOING TO WORK ON
//FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1 Get the user based on the given email
    const user = await User.findOne({ email: req.body.email});

    if (!user) {
        return next(new AppError("There is no user with this email", 404));
    }

    // 2 Create a randon token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3 Send Email back to user
    const resetURL = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with new password and confirm password to : ${resetURL}.\n If didn't forget your password, Please ignore this email.`;
    
    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token(Valid for 10 minutes",
            message,
        });
    
        res.status(200).json({
            status: "success",
            message: "Token sent to email",
        });
    } catch (error) {
        console.log(error);
        user.PasswordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("There was an error sending the email, Try again later", 500))

    }
});

//RESET PASSWORD
exports.resetPassword = async (req, res, next) => {
    // 1 Get user based on the token
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    });
    // 2 if token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
    }    
    // 3 Upadate the changedpassword for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 4 log the user in, send JWt
    creatSendToken(user, 200, res);
    // const token = signToken(user.id);
    // res.status(200).json({
    //     status: "success",
    //     token,
    // });
};


//UPDATING PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
    // Get user from collection of Data
    const user = await User.findById(req.user.id).select("+password");

    // 2 Check if the posted current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("Your current password is wrong.", 401));
    }
    // 3 if So< Update the Password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4 Log user after password change
    creatSendToken(user, 200, res);
});

const MAILCHIMP_API_KEY = "1fc43af0b7c997a204fc25e346690a85-us21";
const MAILCHIMP_LIST_ID = "c2c87a1005";

exports.newsletter = async (req, res) => {
    const { email } = req.body;

    // Email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).send({ success: false, error: "Invalid email address" });
    }

  try {
    const response = await axios({
      method: "POST",
      url: `https://us21.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      auth: {
        username: "Thedaygalpuclub",
        password: MAILCHIMP_API_KEY,
      },
      data: {
        email_address: email,
        status: "subscribed",
      },
    });

    //console.log(response.data);
    res.send({ success: true, message: "Thanks for subscribing to our email list" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: "Unable to subscribe" });
  }
};
exports.follow = async(req,res) => {
    User.findByIdAndUpdate(req.body.followId,{
      $push:{followers:req.user._id}
    },{
        new:true
    },(err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
      User.findByIdAndUpdate(req.user._id,{
          $push:{following:req.body.followId}
          
      },{new:true}).select("-password").then(result=>{
          res.json(result)
      }).catch(err=>{
        console.log("err:", err);
          return res.status(422).json({error:err})
      })
  
    }
    )
};
exports.unfollow = async(req,res) => {
    User.findByIdAndUpdate(req.body.unfollowId,{
        $pull:{followers:req.user._id}
    },{
        new:true
    },(err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
      User.findByIdAndUpdate(req.user._id,{
          $pull:{following:req.body.unfollowId}
          
      },{new:true}).select("-password").then(result=>{
          res.json(result)
      }).catch(err=>{
        console.log("err:", err);
          return res.status(422).json({error:err})
      })

    }
    )
};