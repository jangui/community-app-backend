const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postCommentSchema = new Schema({
    // user that makes the comment
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    // the user's username
    username: {type: String, trim: true, required: true, minLength: 1, maxLength: 30, required: true },

    // post comment is made on
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true},

    // the user's comment
    comment: {type: String, trim: true, minLength: 1, maxLength: 2000, required: true},

    // comment timestamp
    timestamp: {type: Date, default: Date.now(), index: true, required: true},

});

const PostComment = mongoose.model('PostComment', postCommentSchema);

module.exports = PostComment;
