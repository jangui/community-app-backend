const express = require('express');

const {
    createOuting,
    getOuting,
    editOuting,
    deleteOuting,
    makeOutingComment,
    getOutingComments,
    editOutingComment,
    deleteOutingComment,
    getAttendees,
    attendOuting,
    unattendOuting,
} = require('../controllers/outingController');

const router = express.Router();

// create an outing
router.route('/create').post(createOuting);

// get outing info
router.route('/:outingID').get(getOuting);

// edit outing
router.route('/edit/').post(editOuting);

// delete outing
router.route('/:outingID/').delete(deleteOuting);

// comment on outing
router.route('/comment').post(makeOutingComment);

// get outing comments
router.route('/comments/').post(getOutingComments);

// edit outing comment
router.route('/edit/comment/').post(editOutingComment);

// delete outing comment
router.route('/delete/comment').post(deleteOutingComment);

// get outing attendees
router.route('/attendees/').post(getAttendees);

// mark attending outing
router.route('/attend/').post(attendOuting);

// mark unattending outing
router.route('/unattend/').post(unattendOuting);

module.exports = router;

