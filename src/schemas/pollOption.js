const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pollOptionSchema = new Schema({
    // poll option title
    title: {type: String, trim: true, minLength: 1, maxLength: 80, required: true},

    // array of votes for this option
    votes: [{type: mongoose.Schema.Types.ObjectId, ref: 'PollVote'}],
});

const PollOption = mongoose.model('PollOption', pollOptionSchema);

module.exports = PollOption;

