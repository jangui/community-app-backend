const router = require('express').Router();
const mongoose = require('mongoose');

const Post = require('../models/Post.model');
const User = require('../models/User.model');
const PostComment = require('../models/PostComment.model');
const PostLike = require('../models/PostLike.model');

const { uploadImage, areFriends } = require('../utils');

router.route('/new').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;

    const postType = req.body.postType;
    const text = req.body.postText;
    const postLocation = req.body.postLocation;

    try {
        // create post
        let post = new Post({
            owner: userID,
            postType: postType,
            postText: postText

        });

        // upload image
        if (postType === '1' && req.files.image) {
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
});

router.route('/comment/:postID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const postID = req.params.postID;
    const comment = req.body.comment;

    try {
        // check users are friends
        const post = await Post.findById(postID, 'owner').lean();
        if (!areFriends(userID, post.owner)) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${username} cannot comment on ${postID}`,
            });
        }

        // make comment
        const postComment = new PostComment({
            owner: userID,
            username: username,
            post: postID,
            comment: comment
        });
        const postCommentDoc = await postComment.save();
        const postCommentID = postCommentDoc._id;


        // add comment to post
        await Post.findByIdAndUpdate(postID,
            { $push: { comments: postCommentID }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${username} commented on post ${postID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});
router.route('/updateComment/:commentID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const commentID = req.params.commentID;
    const updatedComment = req.body.updatedComment;

    try {
        // check theres an updated comment
        if (!updatedComment) {
            return res.status(400).json({
                success: false,
                msg: `Error: please provided updated comment`,
            });
        }

        // make sure we're updating a comment we own
        let comment = await PostComment.findById(commentID);
        if (comment.owner !== userID) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${username} cannot edit ${comment.username}'s comment`,
            });
        }

        // update comment
        comment.comment = updatedComment;
        await comment.save();

        return res.status(200).json({
            success: true,
            msg: `Comment succesfully updated!`,
            comment: comment,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
})

router.route('/deleteComment/:commentID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const commentID = req.params.commentID;

    try {
        // make sure we are deleting our own comment
        const comment = await PostComment.findById(commentID, 'owner').lean();
        if (comment.owner.toString() !== userID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${username} does not own comment ${commentID}`,
            });
        }

        // delete comment
        await PostComment.findByIdAndDelete(commentID);

        return res.status(200).json({
            success: true,
            msg: `Success! Comment ${commentID} deleted.`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

router.route('/like/:postID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const postID = req.params.postID;

    try {
        // check users are friends
        const post = await Post.findById(postID, 'owner').lean();
        if (!areFriends(userID, post.owner)) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${username} cannot like post ${postID}`,
            });
        }

        // check if post already liked
        var like = await PostLike.findOne({post: postID, owner: userID}, '_id').lean();
        if (like) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${username} already likes post ${postID}`,
            });
        }

        // create like
        like = new PostLike({
            owner: userID,
            username: username,
            post: postID,
        });
        const likeDoc = await like.save();

        // add like to post
        await Post.findByIdAndUpdate(postID,
            { $push: { likes: likeDoc._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${username} liked post ${postID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

router.route('/unlike/:postID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const postID = req.params.postID;
    const comment = req.params.comment;

    try {
        // check users are friends
        const post = await Post.findById(postID, 'owner likes').lean();
        if (!areFriends(userID, post.owner)) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${username} cannot like post ${postID}`,
            });
        }

        // check if post not liked
        var like = await PostLike.findOne({post: postID, owner: userID}, '_id').lean();
        if (!like) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${username} does not like post ${postID}`,
            });
        }

        // delete like
        await PostLike.findOneAndDelete({owner: userID, post: postID});

        // remove like to post
        await Post.findByIdAndUpdate(postID,
            { $pull: { likes: userID }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${username} unliked post ${postID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

// get comments
router.route('/comments/:postID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const postID = req.params.postID;

    try {
        // make sure you can see post
        const post = await Post.findById(postID, 'owner').lean();
        if (!(areFriends(userID, post.owner))) {
            return res.status(409).json({
                success: false,
                msg: `Error ${username} cannot get post ${postID}'s comments`
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get comments
        const comments = await PostComment.aggregate([
            { $match: {
                post: mongoose.Types.ObjectId(postID),
            }},
            { $skip: skip},
            { $limit: limit},
            { $sort: { timestamp: 1 }},
            { $project: {
                "_id": "$_id",
                "username": "$username",
                "userID": "$owner",
                "comment": "$comment",
                "timestamp": "$timestamp",
            }},
        ]);

        return res.status(200).json({
            success: true,
            msg: `successfully got post comments ${skip}-${limit+skip} for post ${postID}`,
            comments: comments,
        });
    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }

});

// get likes
router.route('/likes/:postID').post( async (req, res) => {
    const username = res.locals.username;
    const userID = res.locals.userID;
    const postID = req.params.postID;

    try {
        // make sure you can see post
        const post = await Post.findById(postID, 'owner').lean();
        if (!(areFriends(userID, post.owner))) {
            return res.status(409).json({
                success: false,
                msg: `Error ${username} cannot get post ${postID}'s likes`
            });
        }

        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // get likes
        const likes = await PostLike.aggregate([
            { $match: {
                post: mongoose.Types.ObjectId(postID),
            }},
            { $skip: skip},
            { $limit: limit},
            { $sort: { timestamp: 1 }},
            { $project: {
                "_id": "$_id",
                "username": "$username",
                "userID": "$owner",
            }},
        ]);

        // TODO user also needs to know if they are friends with each person
        // who liked the post

        return res.status(200).json({
            success: true,
            msg: `successfully got post likes ${skip}-${limit+skip} for post ${postID}`,
            likes: likes,
        });
    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
});

module.exports = router;
