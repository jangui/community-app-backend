const express = require('express');

const router = express.Router();

const {
    createPost,
    editPost,
    deletePost,
} = require('../controllers/postController');

// create post
router.route('/new').post(createPost);

//router.route('/view').post(viewPost);

// edit post
router.route('/edit/:postID').post(editPost);

// delete post
router.route('/:postID').delete(deletePost);

// comment on post
//router.route('/comment/:postID').post(makeComment);

// get post comments
//router.route('/getComments/:postID').post(getComments);

// edit comment
//router.route('/editComment/:postID').post(editComment);

// delete comment
//router.route('/comment/:postID').delete(deleteComment);

// like post
//router.route('/like/:postID').post(likePost);

// unlike post
//router.route('/unlike/:postID').post(unlikePost);

module.exports = router;
