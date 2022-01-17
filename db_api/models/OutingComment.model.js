const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const outingCommentSchema = new Schema({
    // user's ID that makes the comment
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    // the user's username
    username: {type: String, trim: true, required: true, minLength: 1, maxLength: 30, required: true },

    // the outing the comment was made on
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing', index: true},

    // the user's comment
    comment: {type: String, trim: true, minLength: 1, maxLength: 2000},

    // comment timestamp
    timestamp: {type: Date, default: Date.now(), index: true},
});

const OutingComment = mongoose.model('OutingComment', outingCommentSchema);

module.exports = OutingComment;
