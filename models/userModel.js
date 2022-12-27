const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
        // maxLength: [23, "Password must not be more than 23 characters"],
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


// Encrypt password before saving it
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    // Hash password
    const salt = await bcrypt.genSalt(5);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


const User = mongoose.model("User", userSchema);
module.exports = User;