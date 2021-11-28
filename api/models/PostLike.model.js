const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postLikeSchema = new Schema({
    // user which likes a post
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // the post the user likes
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true},
});

const PostLike = mongoose.model('PostLike', postLikeSchema);

module.exports = PostLike;
