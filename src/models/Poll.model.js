const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pollSchema = new Schema({
    // poll title
    title: {type: String, trim: true, minLength: 1, maxLength: 80, required: true},

    // array of poll options
    pollOptions: [{type: String, trim: true, minLength: 1, maxLength: 50}],

    // array of poll votes
    pollVotes: [{type: mongoose.Schema.Types.ObjectId, ref: 'PollVote'}],

});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;

