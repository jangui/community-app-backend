const router = require('express').Router();

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

module.exports = router;
