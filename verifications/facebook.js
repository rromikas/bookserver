const fetch = require("node-fetch");

const verifyFacebook = (user, next) => {
  if (user.accessToken) {
    fetch(
      `https://graph.facebook.com/me?access_token=${user.accessToken}`,
      {
        method: "POST",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          next();
        } 
      });
  } 
};

module.exports = verifyFacebook;