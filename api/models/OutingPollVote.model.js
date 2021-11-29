const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const outingPollVoteSchema = new Schema({
    // poll which vote belongs to
    poll: {type: mongoose.Schema.Types.ObjectId, ref: 'OutingPoll', index=true},

    // user whom voted
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // user's response to poll
    // the number serves as an index into the array of poll options in the OutingPoll model
    pollResponse: {type: Number, min: 0},

});

const OutingPollVote = mongoose.model('OutingPoll', outingPollVoteSchema);

module.exports = OutingPollVote;

