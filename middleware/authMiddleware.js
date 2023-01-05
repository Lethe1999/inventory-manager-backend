const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");


// Token handler
const protect = asyncHandler(async (req, res, next) => {
    try {
        // Get token
        const token = req.cookies.token;
        if (!token) {
            res.status(401);
            throw new Error("Not authorized. Please login");
        }

        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Get user info
        const user = await User.findById(verified.id).select("-password");
        if (!user) {
            res.status(401);
            throw new Error("User not found");
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Not authorized. Please login");
    }
});

module.exports = protect;