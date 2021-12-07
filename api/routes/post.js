const router = require('express').Router();
const mongoose = require('mongoose');

const Post = require('../models/Post.model.js');
const User = require('../models/User.model.js');
const { uploadImage } = require('../utils');

router.route('/new').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;

    const postType = req.body.postType;
    const text = req.body.text;
    const postLocation = req.body.postLocation;

    try {
        // create post
        let post = new Post({
            owner: userID,
            postType: postType,

        });

        // upload image
        if (postType === '1') {
            const imageID = await uploadImage(userID, req, res);
            post.image = imageID;
        }

        if (postLocation) {post.postLocation = postLocation}

        const postDoc = await post.save();

        // add post to User's posts
        await User.findByIdAndUpdate(userID,
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
});


router.route('/edit/:postID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;

    const postText = req.body.postText;
    const postLocation = req.body.postLocation;
    const postID = req.params.postID;

    try {
        // make sure we are editing our own post
        const oldPost = await Post.findById(postID, 'owner postLocation postText').lean();
        if (oldPost.owner.toString() !== userID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${username} does not own post ${postID}`,
            });
        }

        // update post
        if (!postLocation) { postLocation = oldPost.postLocation }
        if (!postText) { postText = oldPost.postText }
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
});

router.route('/:postID').delete( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const postID = req.params.postID;

    try {
        // make sure we are deleting our own post
        const post = await Post.findById(postID, 'owner').lean();
        if (post.owner.toString() !== userID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${username} does not own post ${postID}`,
            });
        }

        // delete post
        await Post.findByIdAndDelete(postID);

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
});

module.exports = router;
