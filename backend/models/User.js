
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ['member', 'librarian', 'admin'],
            default: 'member'
        },

        memberId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        },
        phone: {
            type: String,
            default: ''
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
