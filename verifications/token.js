const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;

//user token verificaton
const verifyToken = (token, next) => {
  jwt.verify(token, secret, (err, decoded) => {
    if (!err) {
      next(null, decoded.data);
    } else {
      next({ error: true }, null);
    }
  });
};

module.exports = verifyToken;
