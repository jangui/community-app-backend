const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pollSchema = new Schema({
    // user which owns poll
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // the community the poll belongs to
    community: {type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true},

    // poll title
    title: {type: String, trim: true, minLength: 1, maxLength: 80, required: true},

    // array of poll options
    pollOptions: [{type: mongoose.Schema.Types.ObjectId, ref: 'PollOption'}],
});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;

