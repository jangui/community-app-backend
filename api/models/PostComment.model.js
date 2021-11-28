const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postCommentSchema = new Schema({
    // user that makes the comment
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // post comment is made on
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true},

    // the user's comment
    comment: {type: String, trim: true, minlength: 1, maxlength: 2000},
});

const PostComment = mongoose.model('PostComment', postCommentSchema);

module.exports = PostComment;
