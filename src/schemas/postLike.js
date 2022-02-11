const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postLikeSchema = new Schema({
    // user that likes the post
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},

    // the user's username
    username: {type: String, trim: true, required: true, minLength: 1, maxLength: 30, required: true },

    // post which is liked
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true},

    });

const PostLike = mongoose.model('PostLike', postLikeSchema);

module.exports = PostLike;
