const jwt = require('jsonwebtoken');

// Ensure the secret key is set
const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
}

function createTokenForUser(user) {
    const payload = {
        _id: user._id,
        email: user.email,
        profilepic: user.profilepic,
        role: user.role,
        fullname: user.fullname
    };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    return token;
}

function validateToken(token) {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.error("Token validation error:", error.message);
        return null;
    }
}

module.exports = { createTokenForUser, validateToken };
