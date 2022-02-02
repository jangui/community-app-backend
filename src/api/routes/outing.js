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

// TODO
// edit outing
//router.route('/edit/').post(editOuting);

// delete outing
router.route('/:outingID/').delete(deleteOuting);

// TODO
// comment on outing
//router.route('/comment').post(makeOutingComment);

// get outing comments
router.route('/comments/').post(getOutingComments);

// TODO
// edit outing comment
//router.route('/edit/comment/').post(editOutingComment);

// TODO
// delete outing comment
//router.route('/delete/comment').post(deleteOutingComment);

// TODO
// get outing attendees
//router.route('/attendees/').post(getAttendees);

// TODO
// mark attending outing
//router.route('/attend/').post(attendOuting);

// TODO
// mark unattending outing
//router.route('/unattend/').post(unattendOuting);

module.exports = router;

