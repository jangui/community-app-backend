const express = require('express');

const router = express.Router();

const {
    createPost,
    getPost,
    getPosts,
    editPost,
    deletePost,
    makeComment,
    getComments,
    editComment,
    deleteComment,
    getLikes,
    likePost,
    unlikePost
} = require('../controllers/postController');

// create post
router.route('/new').post(createPost);

// get a post's info
router.route('/:postID').get(getPost);

// get a user's posts
router.route('/').post(getPosts);

// edit post
router.route('/edit/').post(editPost);

// delete post
router.route('/').delete(deletePost);

// comment on post
router.route('/comment/').post(makeComment);

// get post comments
router.route('/comments/').post(getComments);

// edit comment
router.route('/edit/comment/').post(editComment);

// delete comment
router.route('/comment/').delete(deleteComment);

// get post likes
router.route('/likes/').post(getLikes);

// like post
router.route('/like/').post(likePost);

// unlike post
router.route('/unlike/').post(unlikePost);

module.exports = router;
