const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please use a valid email"
        ],
    },
    password: {
        type: String,
        required: [true, "Please add a password"],
        minLength: [6, "Password must be up to 6 characters"],
        maxLength: [23, "Password must not be more than 23 characters"],
    },
    photo: {
        type: String,
        required: [true, "Please add a photo"],
        default: "https://i1.sndcdn.com/artworks-KEAAcFjhG8By45IJ-F8Xh6g-t500x500.jpg",
    },
    phone: {
        type: String,
        default: "+1",
    },
    bio: {
        type: String,
        maxLength: [250, "Bio must not be more than 250 characters"],
        default: "bio",
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("User", userSchema);