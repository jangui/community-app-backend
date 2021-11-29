const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const outingPollSchema = new Schema({
    // outing which poll refers to
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing', index=true},

    // poll type
    pollType: {type: String, trim: true, minLength: 1, maxLength: 20},

    // array of poll options
    pollOptions: [{type: String, trim: true, minLength: 1, maxLength: 50}],

    // array of poll votes
    pollVotes: [{type: mongoose.Schema.Types.ObjectId, ref: 'OutingPollVote'}],

});

const OutingPoll = mongoose.model('OutingPoll', outingPollSchema);

module.exports = OutingPoll;

