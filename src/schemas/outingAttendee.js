const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const outingAttendeeSchema = new Schema({
    // user's ID that is attending outing
    attendee: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // outing in reference
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing', index: true, required: true},
    });


module.exports = outingAttendeeSchema;
