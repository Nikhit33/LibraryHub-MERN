
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        loanPeriodDays: {
            type: Number,
            default: 14,
            min: 1
        },

        finePerDay: {
            type: Number,
            default: 5,
            min: 0
        },

        maxBooksPerMember: {
            type: Number,
            default: 3,
            min: 1
        },

        maxUnpaidFine: {
            type: Number,
            default: 50,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Settings', settingsSchema);
