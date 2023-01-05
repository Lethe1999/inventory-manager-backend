const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Token = require("../models/tokenModel");
const sendEmail = require("../utils/sendEmail");


// Genrate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};



// Register User
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please fill up all required fields");
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be up to 6 characters");
    }

    // Email existence validation
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("This email has already been registered");
    }

    // Create a new user
    const user = await User.create({
        name,
        email,
        password,
    });

    // Generate a token for this user
    const token = await generateToken(user._id);

    // Send HTTP-Only cookie to frontend server
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),   // One day
        sameSite: "none",
        secure: true,
    });

    // Response
    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(201).json({
            _id, name, email, photo, phone, bio, token
        });
    }
    else {
        res.status(400);
        throw new Error("Invalid user data");
    }

});



// Login User
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        res.status(400);
        throw new Error("Please fill up all fields");
    }

    // Check user existence
    const user = await User.findOne({ email });
    if (!user) {
        res.status(400);
        throw new Error("User not found. Please sign up");
    }

    // Check password correctness
    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (user && isCorrectPassword) {
        // Generate token
        const token = generateToken(user._id);

        // Send HTTP-Only cookie to frontend server
        res.cookie("token", token, {
            path: "/",
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400),   // One day
            sameSite: "none",
            secure: false,
        });

        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({
            _id, name, email, photo, phone, bio, token
        });
    }
    else {
        res.status(400);
        throw new Error("Invalid email or password");
    }

});



// Logout User
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),   // Change expiration time
        sameSite: "none",
        secure: true,
    });
    return res.status(200).json({ message: "Successfully logout" });
});



// Get User data
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(201).json({
            _id, name, email, photo, phone, bio,
        })
    } else {
        res.status(400);
        throw new Error("User not found");
    }
});



// Get login status
const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json(false);
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json(false);
    }

    return res.json(true);
});



// Update User
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.photo = req.body.photo || photo;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;

        const updateUser = await user.save();
        res.json({
            _id: updateUser._id,
            name: updateUser.name,
            email: updateUser.email,
            photo: updateUser.photo,
            phone: updateUser.phone,
            bio: updateUser.bio,
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});



// Change password
const changePassword = asyncHandler(async (req, res) => {
    // Check user
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(400);
        throw new Error("User not found. Please sign up");
    }

    // Check password
    const { oldPassword, password } = req.body;
    if (!oldPassword || !password) {
        res.status(400);
        throw new Error("Please add old and new passwords");
    }

    const isCorrectPassword = await bcrypt.compare(oldPassword, user.password);
    if (user && isCorrectPassword) {
        user.password = password;
        await user.save();
        res.status(200).send("Password change succeed");
    } else {
        res.status(400);
        throw new Error("Old password is incorrect");
    }
});



// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
    // Handle received email
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error("User does not exist");
    }

    // Delete token if it exists in Database
    const token = await Token.findOne({ userId: user._id });
    if (token) {
        await Token.deleteOne(token);
    }

    // Create Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    // Hash Reset Token
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save Token to Database
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,     // 30 minutes
    }).save();

    // Construct Reset Url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    // Reset Email
    const subject = "Password Reset Request";
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password.</p>
        <p>This reset link is valid for only 30 minutes.</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        <p>Regards...</p>
        <p>Van</p>
    `;
    const sent_from = process.env.EMAIL_USER;
    const send_to = user.email;

    // Send email
    try {
        await sendEmail(subject, message, sent_from, send_to);
        res.status(200).json({ success: true, message: "Reset Email Sent", });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent. Please try again");
    }
});



// Reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash token and compare with DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!userToken) {
        res.status(404);
        throw new Error("Invalid or Expired Token");
    }

    // Find user and set new password
    const user = await User.findOne({ _id: userToken.userId });
    user.password = password;
    await user.save();
    res.status(200).json({
        message: "Password reset succeed! Please login",
    });

});




module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
};