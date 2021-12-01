const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    // user which made the post
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},

    // array of users that like the post
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'PostLike'}],

    // array of comments on the post
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'PostComment'}],

    // post type: 0 == text post; 1 == picture post;
    postType: {type: Number, min: 0, max: 1},

    // text for text post OR caption for picture post
    text: {type: String, trim: true, minLength: 1, maxLength: 2000},

    // location of post
    postLocation: {type: String, trim: true},

    // the post's picture (if applicable)
    image: {type: mongoose.Schema.Types.ObjectId, ref: 'Image'},

    // post timestamp
    timestape: {type: Date, default: Date.now(), index=true },

});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
