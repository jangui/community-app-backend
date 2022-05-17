const { User, Community, Notification, Post, PostComment, PostLike } = require('../db.js');
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
        const community = req.body.community;
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
        let staticFileData = null;
        if (postType === '1') {
            if (!staticFile) {
                return res.status(400).json({
                    success: false,
                    msg: `Error: postType 1 requires a file upload`,
                });
            }
            staticFileData = await uploadFile(staticFile, currentUserID, true, false, null, req, res);
            post.postFile = staticFileData._id;
        }

        // community post logic
        post.communityPost = false;
        post.community = null;
        if (community) {
            // get community ID
            const communityDoc = await Community.findOne({name: community}, 'id members').lean();
            if (!communityDoc) {
                return res.status(403).json({
                    success: false,
                    msg: `Error: community '${community}' does not exist`,
                });
            }
            // check user can post in the community
            if (!includesID(currentUserID, communityDoc.members)) {
                return res.status(403).json({
                    success: false,
                    msg: `Error: ${currentUser} cannot post in community ${community}`,
                });
            }
            post.communityPost = true;
            post.community = communityDoc._id;
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
                community: post.community,
                communityPost: post.communityPost,
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
            .findById(
                postID,
                'owner likes comments postLocation postType postText postFile community communityPost timestamp'
            ).lean(
            ).populate(
                'postFile', 'fileType'
            ).populate(
                'likes', 'owner'
            ).populate({
                path: 'owner',
                select: 'friends username profilePicture',
                populate: {
                    path: 'profilePicture',
                    select: 'fileType',
                }
            }).populate('community', 'name');

        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: Post w/ id '${postID}' does not exist`,
            });
        }
        const userOwnsPost = post.owner.username === currentUser;
        let hasAccess = false;

        // check if authorized to see post
        if (post.commnityPost) {
            // get user's communities
            const user = await User.findById(currentUserID, 'communities').lean();
            // check user is in the community of the post
            if (includesID(post.community, user.communities)) { hasAcess = true; }


        } else {
            // if not a community post check if user is friends with post owner
            if (includesID(currentUserID, post.owner.friends)) { hasAccess = true; }
        }

        if (!userOwnsPost && !hasAccess) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot get ${post.owner.username}'s post`,
            });
        }

        // modify return data
        post.hasLiked = false;
        for (let i = 0; i < post.likes.length; ++i) {
            like = post.likes[i];
            if (like.owner == currentUserID) {
                post.hasLiked = true;
                break;
            }
        }
        post.likes = post.likes.length;
        post.comments = post.comments.length;
        delete post.owner.friends;
        if (post.postType === 0) { post.postFile = null; }
        if (post.communityPost) { post.community = post.community.name; } else { post.community = null; }

        return res.status(200).json({
            success: true,
            msg: `Success! Got post with id '${postID}'.`,
            post: post,
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
}

const getPosts = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const desiredUsername = req.body.username;
        const skip = parseInt(req.body.skip);
        const limit = parseInt(req.body.limit);

        let sameUser = false;
        if (currentUser === desiredUsername) { sameUser = true }

        // check desired user exits
        const desiredUser = await User.findOne(
            {username: desiredUsername},
            'friends',
        ).lean();

        // check if current user friends w/ desired user
        if (!sameUser && !includesID(currentUserID, desiredUser.friends)) {
            return res.status(401).json({
                success: false,
                msg: `Error: ${currentUser} cannot get ${desiredUsername}'s posts`,
            });
        }

        // get desired user's posts (excluding community posts)
        const posts = await Post.find(
            { owner: desiredUser._id, communityPost: false },
            'postText postLocation postType postFile comments likes',
        ).populate(
            'postFile', 'fileType'
        ).populate(
            'likes', 'owner'
        ).populate({
            path: 'owner',
            select: 'friends username profilePicture',
            populate: {
                path: 'profilePicture',
                select: 'fileType',
            }
        }).sort(
            { timestamp: 1 },
        ).skip(skip).limit(limit).lean();

        // modify return data
        posts.forEach( (post) => {
            post.hasLiked = false;
            for (let i = 0; i < post.likes.length; ++i) {
                like = post.likes[i];
                if (like.owner == currentUserID) {
                    post.hasLiked = true;
                    break;
                }
            }
            post.likes = post.likes.length;
            post.comments = post.comments.length;
            delete post.owner.friends;
            if (post.postType === 0) { post.postFile = null; }
        });


        return res.status(200).json({
            success: true,
            msg: `successfully got posts # ${skip}-${limit+skip-1} for user '${desiredUsername}' `,
            posts: posts,
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

        // TODO // delete all likes and comments // remove static files

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

        const userOwnsPost = post.owner.username === currentUser;
        let hasAccess = false;

        // check if authorized to see post
        if (post.commnityPost) {
            // get user's communities
            const user = await User.findById(currentUserID, 'communities').lean();
            // check user is in the community of the post
            if (includesID(post.community, user.communities)) { hasAcess = true; }

        } else {
            // if not a community post check if user is friends with post owner
            if (includesID(currentUserID, post.owner.friends)) { hasAccess = true; }
        }

        if (!userOwnsPost && !hasAccess) {
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

        // create notification
        const notification = new Notification({
            notifee: currentUserID,
            notifier: post.owner,
            referenceType: 2, // reference to a post
            referenceID: postID,
            notificationType: 0
        });
        await notification.save();

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
        const post = await Post.findById(postID, 'owner comments communityPost community').lean().populate('owner', 'username friends');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        const userOwnsPost = post.owner.username === currentUser;
        let hasAccess = false;

        // check if authorized to see post
        if (post.commnityPost) {
            // get user's communities
            const user = await User.findById(currentUserID, 'communities').lean();
            // check user is in the community of the post
            if (includesID(post.community, user.communities)) { hasAcess = true; }

        } else {
            // if not a community post check if user is friends with post owner
            if (includesID(currentUserID, post.owner.friends)) { hasAccess = true; }
        }

        if (!userOwnsPost && !hasAccess) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot get comments for ${post.owner.username}'s post`,
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

        // return null if no profile pic
        comments.forEach( (comment) => {
            if (!comment.owner.profilePicture) {
                comment.owner.profilePicture = null;
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
        const post = await Post.findById(postID, 'owner').lean().populate('owner', 'username friends community communityPost');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check if current user owns the post being liked
        const userOwnsPost = post.owner.username === currentUser;
        let hasAccess = false;

        // check if authorized to see post
        if (post.commnityPost) {
            // get user's communities
            const user = await User.findById(currentUserID, 'communities').lean();
            // check user is in the community of the post
            if (includesID(post.community, user.communities)) { hasAcess = true; }

        } else {
            // if not a community post check if user is friends with post owner
            if (includesID(currentUserID, post.owner.friends)) { hasAccess = true; }
        }

        if (!userOwnsPost && !hasAccess) {
            return res.status(403).json({
                success: false,
                msg: `Error: Unauthorized. ${currentUser} cannot get likes for ${post.owner.username}'s post`,
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
            if (userOwnsPost) {
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
                .findById(postID, 'owner likes community communityPost')
                .lean()
                .populate('likes', 'owner')
                .populate('owner', 'friends username');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check if current user owns the post being liked
        const userOwnsPost = post.owner.username === currentUser;
        let hasAccess = false;

        // check if authorized to see post
        if (post.commnityPost) {
            // get user's communities
            const user = await User.findById(currentUserID, 'communities').lean();
            // check user is in the community of the post
            if (includesID(post.community, user.communities)) { hasAcess = true; }

        } else {
            // if not a community post check if user is friends with post owner
            if (includesID(currentUserID, post.owner.friends)) { hasAccess = true; }
        }

        if (!userOwnsPost && !hasAccess) {
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

        // create notification
        const notification = new Notification({
            notifee: currentUserID,
            notifier: post.owner,
            referenceType: 2, // reference to a post
            referenceID: postID,
            notificationType: 1
        });
        await notification.save();

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
                .findById(postID, 'owner likes community communityPost')
                .lean()
                .populate('likes', 'owner')
                .populate('owner', 'friends username');
        if (!post) {
            return res.status(400).json({
                success: false,
                msg: `Error: post with id '${postID}' does not exist.`,
            });
        }

        // check if current user owns the post being liked
        const userOwnsPost = post.owner.username === currentUser;
        let hasAccess = false;

        // check if authorized to see post
        if (post.commnityPost) {
            // get user's communities
            const user = await User.findById(currentUserID, 'communities').lean();
            // check user is in the community of the post
            if (includesID(post.community, user.communities)) { hasAcess = true; }

        } else {
            // if not a community post check if user is friends with post owner
            if (includesID(currentUserID, post.owner.friends)) { hasAccess = true; }
        }

        if (!userOwnsPost && !hasAccess) {
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
exports.getPosts = getPosts;
exports.editPost = editPost;
exports.deletePost = deletePost;
exports.makeComment = makeComment;
exports.getComments = getComments;
exports.editComment = editComment;
exports.deleteComment = deleteComment;
exports.getLikes = getLikes;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
