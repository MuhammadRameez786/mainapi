const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
		const transporter = nodemailer.createTransport({
			host: "sandbox.smtp.mailtrap.io",
			port: 2525,
			auth: {
			  user: "eb0073b10d8cbf",
			  pass: "cc260ce5780348"
			}
		  });

		await transporter.sendMail({
			from: process.env.USER,
			to: email,
			subject: subject,
			text: text,
		});
		console.log("email sent successfully");
	} catch (error) {
		console.log("email not sent!");
		console.log(error);
		return error;
	}
};

module.exports = sendEmail;