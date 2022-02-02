
const Poll = require('../models/Poll.model.js');
const PollVote = require('../models/PollVote.model.js');

// create a poll
const createPoll = async (req, res) => {}

// get poll info
const getPoll = async (req, res) => {}

// edit poll
const editPoll = async (req, res) => {}

// delete a poll
const deletePoll = async (req, res) => {}

// get poll votes
const getVotes = async (req, res) => {}

// vote on poll
const vote = async (req, res) => {}

// remove poll vote
const unvote = async (req, res) => {}

exports.createPoll = createPoll;
exports.getPoll = getPoll;
exports.editPoll = editPoll;
exports.deletePoll = deletePoll;
exports.getVotes = getVotes
exports.vote = vote;
exports.unvote = unvote;
