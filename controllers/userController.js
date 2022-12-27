const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const userRegister = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please fill up all required fields.");
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be up to 6 characters.");
    }

    // Email existence validation
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("This email has already been registered.");
    }

    // Create a new user
    const user = await User.create({
        name,
        email,
        password,
    });

    // Response
    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(201).json({
            _id, name, email, photo, phone, bio
        });
    }
    else {
        res.status(400);
        throw new Error("Invalid user data.");
    }

});

module.exports = {
    userRegister,
}