const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const outingCommentSchema = new Schema({
    // user who made comment
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // the outing the comment was made on
    outing: {type: mongoose.Schema.Types.ObjectId, ref: 'Outing', index: true},

    // the user's comment
    comment: {type: String, trim: true, minLength: 1, maxLength: 2000},

    // comment timestamp
    timestamp: {type: Date, default: Date.now()},
});

const OutingComment = mongoose.model('OutingComment', outingCommentSchema);

module.exports = OutingComment;
