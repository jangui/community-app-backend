import jwt from 'jsonwebtoken';

export const authenticateToken = (requestHeaders) => {
    return new Promise( (resolve, reject) => {
        try {
            const authHeader = requestHeaders['authorization'];
            const encodedToken = authHeader && authHeader.split(' ')[1];

            // check if token set
            if (encodedToken == null) {
                reject('Error: Authentication failed. JWT not set.');
            }

            // check jwt token secret is set
            if (!process.env.JWT_TOKEN_SECRET) {
               reject('Error: JWT_TOKEN_SECRET not set');
            }

            // verify the token
            const token = jwt.verify(encodedToken, process.env.JWT_TOKEN_SECRET);

            // resolve the token's payload containing username and userID
            resolve(token.payload);

        } catch(err) {
            reject(err);
        }
    });
}

/*
 * Creates and returns a json web token
 * @param  {String} userID    The user's userID
 * @param  {String} username  The user's username
 * @return {Proimse<string>}  A promise which resolves a string containing an encoded JWT
 *                            When decoded, token has a member named 'payload'
 *                            which contains the userID and username
 */
export const genAccessToken = (userID, username) => {
    return new Promise( (resolve, reject) => {
        if (!process.env.JWT_TOKEN_SECRET) {
            reject('Error: JWT_TOKEN_SECRET not set');
        }

        if (!process.env.JWT_EXPIRATION) {
            reject('Error: JWT_EXPIRATION not set');
        }

        const token = jwt.sign(
            { payload: {
                userID: userID,
                username: username
                }
            },
            process.env.JWT_TOKEN_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION },
        );

        resolve(token);
    });
}
