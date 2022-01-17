import fetch from 'node-fetch';

export const genAccessToken = (username, userID, endpoint) => {
    return new Promise( async (res, rej) => {
        try {
            // set up request
            const payload = { username: username, userID: userID }
            const options = {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }

            // make request
            const resquest = await fetch(endpoint, options);

            // resolve token on success
            if (request.status == 200) {
                const response = await resquest.json();
                res(response.token); return;
            }

            rej(`error generating access token for ${username}`);

        } catch(err) {
            rej(err);
        }
    });
};
