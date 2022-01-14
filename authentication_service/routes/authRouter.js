const router = require('express').Router();

const { authenticateToken, genAccessToken } = require('../auth');

router.route('/generateToken').post( async (req, res) => {
    try {
        const username = req.body.username;
        const userID = req.body.userID;

        // check username and userID set
        if (!username) {
            return res.status(400).json({
                success: false,
                msg: `Error: Cannot generate token. username not set`,
            });
        }
        if (!userID) {
            return res.status(400).json({
                success: false,
                msg: `Error: Cannot generate token. userID not set`,
            });
        }

        // generate access token
        const token = await genAccessToken(userID, username);

        // return success
        return res.status(200).json({
            success: true,
            msg: `Successfully generated token for ${username}`,
            token: token,
        });

    } catch(err) {
        return res.status(400).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

router.route('/authenticateToken').post( async (req, res) => {
    try {
        const payload = await authenticateToken(req.headers);

        // return success
        return res.status(200).json({
            success: true,
            msg: `Successfully authenticated token for ${payload.username}`,
            username: payload.username,
            userID: payload.userID,
        });

    } catch(err) {
        return res.status(400).json({
            success: false,
            msg: `Error: ${err}`,
        });
    }
});

module.exports = router;
