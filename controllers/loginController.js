const crypto = require("crypto");
//const {promisify} = require("util");
const jwt = require("jsonwebtoken");
const { User } = require("./../models/userModel");
const Token = require("./../models/token");
//const catchAsync = require("../Utils/catchAsync");
//const AppError = require("../Utils/appError");
const sendEmail = require("../Utils/email");
const bcrypt = require("bcrypt");
const Joi = require("joi");

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

exports.login = async (req, res) => {
    //console.log("Req PAswword:", req.body.password);
	try {
		const { error } = validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

        const user = await User.findOne({ email: req.body.email }).select('+password');
        //console.log("User:", user.password);
        if (!user)
			return res.status(401).send({ message: "No User Found" });

			if (!user.password)
			return res.status(500).send({ message: "Passowrd not found" });

		const validPassword = await bcrypt.compare(
			req.body.password, user.password
		);
        //console.log("Body Password:", req.body.password);
        //console.log("User Password:", user.password);

		if (!validPassword)
			return res.status(401).send({ message: "Invalid Email or Password" });

		if (!user.verified) {
			let token = await Token.findOne({ userId: user._id });
			if (!token) {
				token = await new Token({
					userId: user._id,
					token: crypto.randomBytes(32).toString("hex"),
				}).save();
				const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
				await sendEmail(user.email, "Verify Email", url);
			}

			return res
				.status(400)
				.send({ message: "An Email sent to your account please verify" });
		}

		//creatSendToken(user, 200, res);
        const token = signToken(user.id);
        res.status(200).json({
            status: "success",
            token,
			data: {
				user: user,
			  },
        })
	} catch (error) {
        console.log("Error:", error);
		res.status(500).send({ message: "Internal Server Error" });
	}
};

const validate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};