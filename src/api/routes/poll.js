const express = require('express');

const {
    createPoll,
    getPoll,
    editPoll,
    deletePoll,
    getVotes,
    vote,
    unvote
} = require('../controllers/pollController');

const router = express.Router();

// create poll
router.route('/create').post(createPoll);

// get poll info
router.route('/:pollID').get(getPoll);

// TODO
// edit poll
//router.route('/edit').post(editPoll);

// delete poll
router.route('/:pollID').delete(deletePoll);

// TODO
// get poll votes
//router.route('/votes').post(getVotes);

// TODO
// vote on outing poll
//router.route('/vote').post(votePoll);

// TODO
// remove outing vote
//router.route('/unvote').post(unvotePoll);

module.exports = router;
