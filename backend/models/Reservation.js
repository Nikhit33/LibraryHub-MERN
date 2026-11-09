
const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true
        },
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reservedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ["pending", "available", "fulfilled", "cancelled", "expired"],
            default: "pending"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
