
const Poll = require('../models/Poll.model.js');
const PollOption = require('../models/PollOption.model.js');
const User = require('../models/User.model.js');

// create a poll
const createPoll = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const title = req.body.title;
        const pollOptions = req.body.pollOptions;
        const community = req.body.communityID;

        let pollOptionIDS = [];

        // create poll options
        pollOptions.forEach( async (opt) => {
            const pollOption = new PollOption({
                title: opt
            });
            // save poll option
            pollOptDoc = await pollOption.save();
            pollOptionIDS.push(pollOptDoc._id);
        });

        // create poll
        const poll = new Poll({
            owner: currentUserID,
            username: currentUser,
            community: communityID,
            title: title,
            pollOptions: pollOptionIDS,
        });

        // save poll to db
        const pollDoc = await poll.save();

        // return success
        return res.status(200).json({
            sucess: true,
            msg: `Successfully created poll '${title}'`,
            poll: {_id: pollDoc._id, title: title}
        });

    } catch(err) {
        return res.status(500).json({
            sucess: false,
            msg: `Error: ${err}`,
        });
    }
}

// get poll info
const getPoll = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const pollID = req.body.pollID;

        // get poll
        let poll = await Poll.findById(
            pollID,
            'title owner pollOptions community'
        ).lean().populate({
            path: 'pollOptions',
            populate: { path: 'votes', select: 'username' }
        });

        if (!poll) {
            return res.status(500).json({
                sucess: false,
                msg: `Error: poll with ID '${pollID}' does not exits`,
            });
        }

        // check user belongs to community poll is in
        const user = User.findById(currentUserID, 'communities').lean();
        if (!user.communities.includes(poll.community)) {
            return res.status(409).json({
                sucess: false,
                msg: `Error ${currentUser} does not have access to poll with ID '${pollID}'`
            });
        }

        // get poll vote counts
        poll.pollOptions.forEach((opt) => {
            opt.votes = opt.votes.length;
        });

        // return success
        return res.status(200).json({
            sucess: true,
            msg: `Successfully got poll '${poll.title}'`,
            poll: poll,
        });

    } catch(err) {
        return res.status(500).json({
            sucess: false,
            msg: `Error: ${err}`,
        });
    }
}

// edit poll
const editPoll = async (req, res) => {}

// delete a poll
const deletePoll = async (req, res) => {
    try {
        const currentUser = res.locals.username;
        const currentUserID = res.locals.userID;
        const pollID = req.body.pollID;

        // check if outing exists
        const poll = await Poll.findById(outingID, 'owner community').lean()
        if (!poll) {
            return res.status(400).json({
                sucess: false,
                msg: `Error: poll with ID: ${pollID} does not exists`
            });
        }

        // check if user owns poll
        if (poll.owner != currentUserID) {
            return res.status(409).json({
                success: false,
                msg: `Error: ${currentUser} does not own poll '${poll.title}'`
            });
        }

        // TODO
        // delete poll votes

        // delete poll
        await Poll.findByIdAndDelete(pollID);

        return res.status(200).json({
            sucess: true,
            msg: `Successfully deleted poll ${poll.title}!`,
            poll: {_id: poll._id, title: poll.title}
        });

    } catch(err) {
        return res.status(500).json({
            success: false,
            msg: `Error: ${err}`
        });
    }
}

// get poll votes
const getVotes = async (req, res) => {
    // use aggregate, turn pollVotes into own models
}

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
