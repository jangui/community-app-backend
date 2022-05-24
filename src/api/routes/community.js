const express = require('express');

const {
    createCommunity,
    getCommunity,
    editCommunity,
    deleteCommunity,
    getPosts,
    getMembers,
    getMemberRequests,
    inviteUser,
    acceptInvite,
    joinCommunity,
    acceptUser,
    leaveCommunity,
    getOutings,
    searchCommunities
} = require('../controllers/communityController');

const router = express.Router();

// create a community
router.route('/create').post(createCommunity);

// get a community info
router.route('/:community').get(getCommunity);

// edit community info
router.route('/edit/').post(editCommunity);

// delete a community
router.route('/:community').delete(deleteCommunity);

// get community posts
router.route('/posts').post(getPosts);

// get community members
router.route('/members').post(getMembers);

// get community member requests
router.route('/member/requests').post(getMemberRequests);

// invite user to community
router.route('/invite').post(inviteUser);

// accept community invite
router.route('/accept/invite').post(acceptInvite);

// join a community or send request if private
router.route('/join').post(joinCommunity);

// accept user to private community
router.route('/accept/user').post(acceptUser);

// leave a community
router.route('/leave').post(leaveCommunity);

// get community outings
router.route('/outings').post(getOutings);

// search for communities
router.route('/search').post(searchCommunities);

module.exports = router;

