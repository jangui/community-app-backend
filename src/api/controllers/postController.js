const User = require('../models/User.model.js');
const Post = require ('../models/Post.model.js');

const {
    existingUsername,
    areFriendsID,
    areFriendsUsername,
} = require('../utils/user.js');


// create post
const createPost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postType = req.body.postType;
        const postText = req.body.postText;
        const postLocation = req.body.postLocation;

        // create post
        let post = new Post({
            owner: currentUserID,
            postType: postType,
            postText: postText

        });

        // upload image
        /* TODO
        if (postType === '1' && req.files.image) {
            const imageID = await uploadImage(currentUserID, req, res);
            post.image = imageID;
        }
        */

        // add location if provided
        if (postLocation) {post.postLocation = postLocation}

        const postDoc = await post.save();

        // add post to User's posts
        await User.findByIdAndUpdate(currentUserID,
            { $push: { posts: postDoc._id }}
        );

        return res.status(200).json({
            success: true,
            msg: 'Successfully made post',
            post: { _id: postDoc._id },
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

const editPost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postText = req.body.postText;
        const postLocation = req.body.postLocation;
        const postID = req.params.postID;

        // make sure we are editing our own post
        const oldPost = await Post.findById(postID, 'owner postLocation postText').lean();
        if (oldPost.owner.toString() !== currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own post ${postID}`,
            });
        }

        // get post updates
        if (!postLocation) { postLocation = oldPost.postLocation }
        if (!postText) { postText = oldPost.postText }

        // update posts
        const updatedPost = await Post.findByIdAndUpdate(postID, {
            postLocation: postLocation,
            postText: postText,
        }).select('owner _id postText postLocation postType timestamp').lean();

        return res.status(200).json({
            success: true,
            msg: `Success! Post ${postID} updated.`,
            post: updatedPost,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}


const deletePost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.params.postID;

        // make sure we are deleting our own post
        const post = await Post.findById(postID, 'owner').lean();
        if (post.owner.toString() !== currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own post ${postID}`,
            });
        }

        // delete post
        await Post.findByIdAndDelete(postID);

        // TODO
        // delete all likes and comments
        // remove image

        return res.status(200).json({
            success: true,
            msg: `Success! Post ${postID} deleted.`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

exports.createPost = createPost;
exports.editPost = editPost;
exports.deletePost = deletePost;
