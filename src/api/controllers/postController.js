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

const makeComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.params.postID;
        const comment = req.body.comment;

        // check post owner and current user are friends
        const post = await Post.findById(postID, 'owner').lean();
        if (!areFriendsID(currentUserID, post.owner)) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot comment on ${postID}`,
            });
        }

        // make comment
        const postComment = new PostComment({
            owner: currentUserID,
            username: currentUser,
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
            msg: `Success! ${currentUser} commented on post ${postID}`,
            comment: {_id: postCommentID},
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// get post comments
const getComments = async (req, res) => {
    try {
        const currentUser = res.locals.currentUsername;
        const currentUserID = res.locals.userID;
        const postID = req.params.postID;

        // check current user is friends with post owner
        const post = await Post.findById(postID, 'owner').lean();
        if (!(areFriendsID(currentUserID, post.owner))) {
            return res.status(409).json({
                success: false,
                msg: `Error ${currentUser} cannot get post ${postID}'s comments`
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

}

// edit a comment
const editComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const commentID = req.params.commentID;
        const updatedComment = req.body.updatedComment;

        // check theres an updated comment
        if (!updatedComment) {
            return res.status(400).json({
                success: false,
                msg: `Error: please provided updated comment`,
            });
        }

        // check comment exists
        let comment = await PostComment.findById(commentID);
        if (!comment) {
            return res.status(400).json({
                success: false,
                msg: `Error: comment ${commentID} does not exists`,
            });
        }
        // check current user own's comment they want to update
        if (comment.owner.toString() !== userID) {
            return res.status(409).json({
                success: false,
                msg: `Error: user ${currentUser} cannot edit someone else's comment`,
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
}

const deleteComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const commentID = req.params.commentID;

        // make sure we are deleting our own comment
        const comment = await PostComment.findById(commentID, 'owner').lean();
        if (comment.owner.toString() !== currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own comment ${commentID}`,
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
}

const likePost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.params.postID;

        // check current user is friends w/ post owner
        const post = await Post.findById(postID, 'owner').lean();
        if (!areFriendsID(currentUserID, post.owner)) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot like post ${postID}`,
            });
        }

        // check if post already liked
        var like = await PostLike.findOne({post: postID, owner: currentUserID}, '_id').lean();
        if (like) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${currentUser} already likes post ${postID}`,
            });
        }

        // create like
        like = new PostLike({
            owner: userID,
            username: currentUser,
            post: postID,
        });
        const likeDoc = await like.save();

        // add like to post
        await Post.findByIdAndUpdate(postID,
            { $push: { likes: likeDoc._id }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${currentUser} liked post ${postID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

const unlikePost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.params.postID;
        const comment = req.params.comment;

        // check users are friends
        const post = await Post.findById(postID, 'owner likes').lean();
        if (!areFriendsID(currentUserID, post.owner)) {
            return res.status(409).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot like post ${postID}`,
            });
        }

        // check if post not liked
        var like = await PostLike.findOne({post: postID, owner: currentUserID}, '_id').lean();
        if (!like) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${currentUser} does not like post ${postID}`,
            });
        }

        // delete like
        await PostLike.findOneAndDelete({owner: currentUserID, post: postID});

        // remove like to post
        await Post.findByIdAndUpdate(postID,
            { $pull: { likes: currentUserID }}
        );

        return res.status(200).json({
            success: true,
            msg: `Success! ${currentUser} unliked post ${postID}`,
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
exports.makeComment = makeComment;
exports.getComments = getComments;
exports.editComment = editComment;
exports.deleteComment = deleteComment;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
