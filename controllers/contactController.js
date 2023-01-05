const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");


// Send contact us email
const contactUs = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { subject, message } = req.body;

    // Validation
    if (!user) {
        res.status(400);
        throw new Error("User not found. Please sign up");
    }
    if (!subject || !message) {
        res.status(400);
        throw new Error("Please add subject and message");
    }

    // Send Email
    const sent_from = process.env.EMAIL_USER;
    const send_to = process.env.EMAIL_USER;
    const reply_to = user.email;
    try {
        await sendEmail(subject, message, sent_from, send_to, reply_to);
        res.status(200).json({ success: true, message: "Contact email sent", });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent. Please try again");
    }

});


module.exports = {
    contactUs,
};