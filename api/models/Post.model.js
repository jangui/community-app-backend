const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    // user which made the post
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},

    // array of users that like the post
    likes: {[type: mongoose.Schema.Types.ObjectId, ref: 'PostLike']},

    // array of comments on the post
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'PostComment']},


    // TODO
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
