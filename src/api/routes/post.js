const express = require('express');

const router = express.Router();

const {
    createPost,
    getPost,
    editPost,
    deletePost,
    makeComment,
    getComments,
    editComment,
    deleteComment,
    likePost,
    unlikePost
} = require('../controllers/postController');

// create post
router.route('/new').post(createPost);

// TODO
// get a post's info
//router.route('/:postID').get(getPost);

// edit post
router.route('/edit/').post(editPost);

// delete post
router.route('/:postID').delete(deletePost);

// comment on post
router.route('/comment/').post(makeComment);

// get post comments
router.route('/comments/').post(getComments);

// edit comment
router.route('/edit/comment/').post(editComment);

// delete comment
router.route('/delete/comment/').post(deleteComment);

// like post
router.route('/like/').post(likePost);

// unlike post
router.route('/unlike/').post(unlikePost);

module.exports = router;
