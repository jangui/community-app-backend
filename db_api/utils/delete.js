const Post = require('../models/Post.model');

const deletePost(postID) {
    return new Promise( async (resolve, reject) => {
        try {
            const post = await Post.findByid(postID);
            // delete all likes

            // delete all comments

            // remove image (if applicable)
            if (post.postType == 1) {
                // delete image
            }


        } catch(err) {
            reject(err);
        }
    });
}


exports.deletePost = deletePost;

