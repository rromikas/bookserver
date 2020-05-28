const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/usersModel");
const Books = require("../models/booksModel");
const secret = process.env.SECRET;

module.exports.ReadUser = user => {
  return new Promise((resolve, reject) => {
    try {
      User.findOne({ email: user.email })
        .populate("favoriteBooks.book")
        .exec((err, user) => {
          if (user) {
            resolve({ user: user });
          } else {
            resolve({ error: "no such user" });
          }
        });
    } catch (er) {
      resolve({ error: "syntax error" });
    }
  });
};

module.exports.UpdateUser = user => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate({ email: user.email }, user, (err, doc) => {
      console.log("UPDET USER ERR DOC", err, doc);
      if (err) {
        resolve({ error: err });
      } else {
        resolve({ message: "Successfuly updated" });
      }
    });
  });
};

module.exports.Login = data => {
  return new Promise((resolve, reject) => {
    User.findOne({ email: data.email }).then(user => {
      if (user) {
        if (user.password) {
          bcrypt.compare(data.password, user.password, (err, isMatch) => {
            if (err) {
              resolve({ error: "Password comparison failed" });
            } else if (isMatch) {
              jwt.sign(
                { data: user },
                secret,
                { expiresIn: "7d" },
                (err, token) => {
                  if (err) {
                    resolve({ error: "jwt error email form login" });
                  } else {
                    resolve({
                      token: token,
                      user: {
                        name: user.name,
                        photo: user.photo,
                        description: user.description,
                        _id: user._id
                      }
                    });
                  }
                }
              );
            } else {
              resolve({ error: "Wrong password" });
            }
          });
        } else {
          resolve({ error: "Use other login method" });
        }
      } else {
        resolve({ error: "No such email" });
      }
    });
  });
};

module.exports.Signup = data => {
  return new Promise((resolve, reject) => {
    let { email } = data;
    User.findOne({ email: email }).then(user => {
      if (user) {
        resolve({ error: "User already exists" });
      } else {
        let newUser = new User({
          email: email,
          name: data.name ? data.name : email.split("@")[0]
        });

        bcrypt.genSalt(10).then(salt => {
          bcrypt.hash(data.password, salt, (err, hash) => {
            newUser.password = hash;
            newUser
              .save()
              .then(() => {
                resolve({ message: "User created" });
              })
              .catch(er => {
                resolve({ error: "bcrypt encoding error" });
              });
          });
        });
      }
    });
  });
};

module.exports.FacebookSignup = userData => {
  return new Promise((resolve, reject) => {
    jwt.sign({ data: userData }, secret, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        resolve({ error: err });
      } else {
        User.findOne({ email: userData.email }).then(user => {
          if (!user) {
            //create user if doesn't exist
            let name = userData.name
              ? userData.name
              : userData.email.split("@")[0];
            let newUser = new User({
              email: userData.email,
              name: name,
              photo: userData.photoUrl
            });
            newUser
              .save()
              .then(() => {
                resolve({
                  message: "User created",
                  token: token,
                  user: {
                    name: newUser.name,
                    photo: newUser.photo,
                    description: newUser.description,
                    _id: newUser._id
                  }
                });
              })
              .catch(er => {
                resolve({ error: er });
              });
          } else {
            resolve({
              token: token,
              user: {
                name: user.name,
                photo: user.photo,
                description: user.description,
                _id: user._id
              }
            });
          }
        });
      }
    });
  });
};

module.exports.GoogleSignup = userData => {
  return new Promise((resolve, reject) => {
    jwt.sign({ data: userData }, secret, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        resolve({ error: err });
      } else {
        User.findOne({ email: userData.email }).then(user => {
          if (!user) {
            //create user if doesn't exist
            let name = userData.name
              ? userData.name
              : userData.email.split("@")[0];
            let newUser = new User({
              email: userData.email,
              name: name,
              photo: userData.photoUrl
            });
            newUser
              .save()
              .then(() => {
                resolve({
                  message: "User created",
                  token: token,
                  user: {
                    name: newUser.name,
                    photo: newUser.photo,
                    description: newUser.description,
                    _id: newUser._id
                  }
                });
              })
              .catch(er => {
                resolve({ error: er });
              });
          } else {
            resolve({
              token: token,
              user: {
                name: user.name,
                photo: user.photo,
                description: user.description,
                _id: user._id
              }
            });
          }
        });
      }
    });
  });
};
