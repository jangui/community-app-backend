const { User, Post, PostComment, PostLike } = require('../db.js');
const { uploadFile } = require('../utils/upload.js');
const { includesID } = require('../utils/includesID.js');

// create post
const createPost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postType = req.body.postType;
        const postText = req.body.postText;
        const postLocation = req.body.postLocation;

        // get static file
        let staticFile;
        if (req.files) { staticFile = req.files.postFile; }

        // create post
        let post = new Post({
            owner: currentUserID,
            postType: postType,
            postText: postText

        });

        // upload image
        let staticFileData;
        if (postType === '1' && staticFile) {
            staticFileData = await uploadFile(staticFile, currentUserID, true, false, null, req, res);
            post.postFile = staticFileData._id;
        }

        // add location if provided
        if (postLocation) {post.postLocation = postLocation}

        const postDoc = await post.save();

        // add post to User's posts
        await User.findByIdAndUpdate(currentUserID,
            { $push: { posts: postDoc._id }}
        );

        // return post info on success
        return res.status(200).json({
            success: true,
            msg: 'Successfully made post',
            post: {
                _id: postDoc._id,
                postType: postType,
                postLocation: postLocation,
                postText: postText,
                postFile: staticFileData,
            },
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// get a post's info
const getPost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.params.postID;

        // check post exists
        const post = await Post
            .findById(postID, 'owner postLocation postText postFile')
            .lean()
            .populate('postFile', 'fileType')
            .populate('owner', 'friends');

        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: Post w/ id '${postID}' does not exist`,
            });
        }

        // check current user is friends w/ post owner or is owner of post
        if (!(currentUserID == post.owner._id) && (!includesID(currentUserID, post.owner.friends))) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot like ${post.owner.username}'s post`,
            });
        }

        // unpopulate owner field from post
        post.owner = post.owner._id

        return res.status(200).json({
            success: true,
            msg: `Success! Post ${postID} updated.`,
            post: post,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }

}

// edit a post
const editPost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;
        const postText = req.body.postText;
        const postLocation = req.body.postLocation;

        // get static file
        let staticFile;
        if (req.files) { staticFile = req.files.postFile; }

        // check post exists
        const post = await Post.findById(postID, 'owner postLocation postText');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: Post w/ id '${postID}' does not exist`,
            });
        }

        // make sure we are editing our own post
        if (post.owner.toString() !== currentUserID) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own post ${postID}`,
            });
        }

        // update post
        if (postLocation) { post.postLocation = postLocation }
        if (postText) { post.postText = postText; }
        await post.save();

        return res.status(200).json({
            success: true,
            msg: `Success! Post ${postID} updated.`,
            post: post,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// delete a post
const deletePost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;

        // check post exists
        const post = await Post.findById(postID, 'owner').lean();
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: Post w/ id '${postID}' does not exist`,
            });
        }


        // make sure we are deleting our own post
        if (post.owner.toString() !== currentUserID) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} does not own post ${postID}`,
            });
        }

        // delete post
        await Post.findByIdAndDelete(postID);

        // TODO
        // delete all likes and comments
        // remove static files

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

// comment on a post
const makeComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;
        const comment = req.body.comment;

        // check post exists
        const post = await Post.findById(postID, 'owner').lean().populate('owner', 'username friends');
        if (!post) {
            return res.status(400).json({
                success: false,
            msg: `Error: post with id '${postID}' does not exist.`,
            })
        }

        // check post owner and current user are friends
        if (post.owner.username != currentUser && (!includesID(currentUserID, post.owner.friends))) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot comment on ${post.owner.username}'s posts`,
            });
        }

        // make comment
        const postComment = new PostComment({
            owner: currentUserID,
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
            comment: postCommentDoc,
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
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // check post exists
        const post = await Post.findById(postID, 'owner comments').lean().populate('owner', 'username friends');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check we own post or are friends w/ owner of post
        if (!(post.owner._id == currentUserID) && !(includesID(currentUserID, post.owner.friends))) {
            return res.status(403).json({
                success: false,
                msg: `Error ${currentUser} cannot get comments for ${post.owner.username}'s post`
            });
        }

        // get comments
        const comments = await PostComment.find(
            { post: post._id }
        ).select(
            'comment owner'
        ).sort(
            { timestamp: 1 }
        ).skip(skip).limit(limit).lean().populate({
            path: 'owner',
            select: 'username -_id',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            }
        });

        return res.status(200).json({
            success: true,
            msg: `successfully got post comments ${skip}-${limit+skip-1} for post ${postID}`,
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
        const commentID = req.body.commentID;
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

        // check current user is editting their own comment
        if (comment.owner.toString() !== currentUserID) {
            return res.status(403).json({
                success: false,
                msg: `Error: ${currentUser} cannot edit someone else's comment`,
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

// delete comment on a post
const deleteComment = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const commentID = req.body.commentID;

        // make sure we are deleting our own comment
        const comment = await PostComment.findById(commentID, 'owner').lean();
        if (comment.owner.toString() !== currentUserID) {
            return res.status(403).json({
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

const getLikes = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        // check post exists
        const post = await Post.findById(postID, 'owner').lean().populate('owner', 'username friends');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check if we are post owner
        let postOwner = false;
        if (post.owner._id == currentUserID) { postOwner = true; }

        // check if we have permissions to get likes
        // check if friends w/ owner of post
        if (!postOwner && !(includesID(currentUserID, post.owner.friends))) {
            return res.status(403).json({
                success: false,
                msg: `Error ${currentUser} cannot get likes for ${post.owner.username}'s post`
            });
        }

        // get likes
        const likes = await PostLike.find(
            { post: post._id }
        ).select(
            'owner -_id'
        ).sort(
            { timestamp: 1 }
        ).skip(skip).limit(limit).lean().populate({
            path: 'owner',
            select: 'username friends -_id',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            },
        });

        // check friendship status with each person who likes post
        likes.map(async (currentLike, ind) => {
            // set like username and profile picture
            currentLike.username = currentLike.owner.username;
            currentLike.profilePicture = currentLike.owner.profilePicture;

            // if current user owns the post, then they are friends with every user who liked the post
            if (postOwner) {
                currentLike.areFriends = true;
                delete currentLike.owner; // dont return current like's owner's info
                return;
            }

            // check if user is friends with the friends of the desiredUser
            if (includesID(currentUserID, currentLike.owner.friends)) {
                currentLike.areFriends = true;
                delete currentLike.owner; // dont return current like's owner's info
                return;
            }

            currentLike.areFriends = false;
            delete currentLike.owner; // dont return current like's owner's info
        });

        // return likes
        return res.status(200).json({
            success: true,
            msg: `successfully got post likes ${skip}-${limit+skip-1} for post ${postID}`,
            likes: likes,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// like a post
const likePost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;

        // check post exists
        const post = await Post
                .findById(postID, 'owner likes')
                .lean()
                .populate('likes', 'owner')
                .populate('owner', 'friends username');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check current user is friends w/ post owner or is owner of post
        if (!(currentUserID == post.owner._id) && (!includesID(currentUserID, post.owner.friends))) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot like ${post.owner.username}'s post`,
            });
        }

        // check if post already liked
        for (let i = 0; i < post.likes.length; ++i) {
            if (post.likes[i].owner == currentUserID) {
                return res.status(400).json({
                    success: false,
                    msg: `Error! ${currentUser} already likes post ${postID}`,
                });
            }
        }

        // create like
        like = new PostLike({
            owner: currentUserID,
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
            msg: `Success! ${currentUser} liked post with id '${postID}`,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

// unlike a post
const unlikePost = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const postID = req.body.postID;

        // check post exists
        const post = await Post
                .findById(postID, 'owner likes')
                .lean()
                .populate('likes', 'owner')
                .populate('owner', 'friends username');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check current user is friends w/ post owner or is owner of post
        if (!(currentUserID == post.owner._id) && (!includesID(currentUserID, post.owner.friends))) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot unlike ${post.owner.username}'s post`,
            });
        }

        // check if post already liked
        let likesPost = false;
        for (let i = 0; i < post.likes.length; ++i) {
            if (post.likes[i].owner == currentUserID) {
                likesPost = true;
                break;
            }
        }
        if (!likesPost) {
            return res.status(400).json({
                success: false,
                msg: `Error! ${currentUser} does not like post ${postID}`,
            });
        }

        // delete like
        like = await PostLike.findOneAndDelete({owner: currentUserID, post: postID});

        // remove like from post
        await Post.findByIdAndUpdate(postID,
            { $pull: { likes: like._id }}
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
exports.getPost = getPost;
exports.editPost = editPost;
exports.deletePost = deletePost;
exports.makeComment = makeComment;
exports.getComments = getComments;
exports.editComment = editComment;
exports.deleteComment = deleteComment;
exports.getLikes = getLikes;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
