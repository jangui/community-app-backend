const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pollVoteSchema = new Schema({
    // user who voted
    vote: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // poll option vote belongs to
    pollOption: {type: mongoose.Schema.Types.ObjectId, ref: 'PollOption'},
});

const PollVote = mongoose.model('PollVote', pollVoteSchema);

module.exports = PollVote;

