const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const outingAttendeeSchema = new Schema({
    // user's ID that is attending outing
    attendee: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // the user's username
    username: {type: String, trim: true, required: true, minLength: 1, maxLength: 30, required: true },

    // outing in reference
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing', index: true, required: true},

    });

const OutingAttendee = mongoose.model('OutingAttendee', outingAttendeeSchema);

module.exports = OutingAttendee;
