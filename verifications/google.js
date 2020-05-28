const fetch = require("node-fetch");

const verifyGoogle = (user, next) => {
  if (user.accessToken) {
    fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${user.accessToken}`,
      {
        method: "POST",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.error) {
          res.json({ error: "incorect google acccess token" });
        } else {
          next();
        }
      });
  } 
};

module.exports = verifyGoogle;
