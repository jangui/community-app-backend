const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PollVoteSchema = new Schema({
    // poll which vote belongs to
    poll: {type: mongoose.Schema.Types.ObjectId, ref: 'Poll', index=true},

    // user whom voted
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index=true},

    // user's response to poll
    // the number serves as an index into the array of poll options in the OutingPoll model
    pollResponse: {type: Number, min: 0, index=true},

});

const PollVote = mongoose.model('PollVote', pollVoteSchema);

module.exports = PollVote;

