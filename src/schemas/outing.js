const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const outingSchema = new Schema({
    // user which proposes outing
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // the community the outing is proposed to
    community: {type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true},

    // outing title
    title: {type: String, trim: true, minLength: 1, maxLength: 80, required: true},

    // start and end time of outing
    // default is EPOCH as a placeholder for no time set
    start: {type: Date, default: new Date(1970, 0, 1, 0, 0, 0, 0)},
    end: {type: Date, default: new Date(1970, 0, 1, 0, 0, 0, 0)},

    // location of outing
    location: {type: String, trim: true, default: ""},

    // can users RSVP
    canRSVP: {type: Boolean, default: false},

    // can users see attendies / interested
    visibleRSVP: {type: Boolean, default: true},

    // array of users that have RSVP'd
    attendees: [{type: mongoose.Schema.Types.ObjectId, ref: 'OutingAttendee'}],

    // array of users that are interested
    interested: [{type: mongoose.Schema.Types.ObjectId, ref: 'OutingInterestee'}],

    // array of comments for the outing
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'OutingComment'}],

    // outing polls that user can vote on
    polls: [{type: mongoose.Schema.Types.ObjectId, ref: 'Poll'}],

    // outing timestamp
    timestamp: {type: Date, default: Date.now(), index: true, required: true },
});

module.exports = outingSchema;
