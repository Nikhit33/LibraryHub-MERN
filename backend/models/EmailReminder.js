
const mongoose = require('mongoose');

const emailReminderSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    type: {
        type: String,
        enum: ['due-soon', 'overdue'],
        required: true
    },
    date: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: null
    }
});

emailReminderSchema.index(
    { transaction: 1, type: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model('EmailReminder', emailReminderSchema);
