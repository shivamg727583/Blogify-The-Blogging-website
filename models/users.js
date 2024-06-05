const mongoose = require('mongoose');
const { createHmac, randomBytes } = require('crypto');
const { createTokenForUser } = require('../services/authentication');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    salt: String,
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        maxlength: 10,
        minlength: 10
    },
    profilepic: {
        type: String,
        default: "/image/upload/default.png"
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER"
    }
});

userSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) {
        return next();
    }

    try {
        const secret = randomBytes(16).toString('hex');
        const hash = createHmac('sha256', secret).update(user.password).digest('hex');
        user.salt = secret;
        user.password = hash;
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.statics.matchPasswordAndGenerate = async function (email, password) {
    const user = await this.findOne({ email });

    if (!user) {
        throw new Error("User not found");
    }

    const userProvidedHash = createHmac('sha256', user.salt).update(password).digest('hex');

    if (user.password !== userProvidedHash) {
        throw new Error("Password is incorrect or email");
    }

    const token = createTokenForUser(user);
    return token;
};

module.exports = mongoose.model("User", userSchema);