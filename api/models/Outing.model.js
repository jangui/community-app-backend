const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const outingSchema = new Schema({
    // user which proposes outing
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // the community the outing is proposed to
    community: {type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true},

    // start and end time of outing
    // default is EPOCH as a placeholder for no time set
    start: {type: Date, default: Date(1970, 0, 1, 0, 0, 0, 0)};
    end: {type: Date, default: Date(1970, 0, 1, 0, 0, 0, 0)};

    // place of outing
    place: {type: String, trim: true, default: ""},

    // can users RSVP
    canRSVP: {type: Boolean, default: false},

    // can users see who has RSVP
    visibleRSVP: {type: Boolean, default: true},

    // array of users that have RSVP'd
    attendies: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    // array of users that are interested
    interested: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],

    // array of comments for the outing
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'OutingComment'}],
});

const Outing = mongoose.model('Outing', outingSchema);

module.exports = Outing;
