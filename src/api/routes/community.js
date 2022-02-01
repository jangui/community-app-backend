const express = require('express');

const {
    createCommunity,
    getCommunity,
    editCommunity,
    deleteCommunity,
    inviteUser,
    joinCommunity,
    acceptUser,
    leaveCommunity
} = require('../controllers/communityController');

const router = express.Router();

// create a community
router.route('/:create').post(createCommunity);

// get a community info
router.route('/:community').get(getCommunity);

// TODO
// edit community info
//router.route('/edit/').post(editCommunity);

// delete a community
router.route('/:communityID').delete(deleteCommunity);

// invite user to community
router.route('/invite').post(inviteUser);

// join a community or send request if private
router.route('/:community').post(joinCommunity);

// TODO
// accpet user to private community
//router.route('/acceptUser').post(acceptUser);

// leave a community
router.route('/:community').post(leaveCommunity);

module.exports = router;

