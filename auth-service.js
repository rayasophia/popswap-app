const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true
  },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

let User;

function initialize() {
    return new Promise(function (resolve, reject) {
        const db = mongoose.createConnection("mongodb+srv://rayamcasas:hj39KtioHopfyA46@sandbox.xjx4yw7.mongodb.net/?retryWrites=true&w=majority&appName=sandbox");
        db.on('error', (err) => {
            reject(`Database connection error: ${err}`);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            console.log('Database connection successful.');
            resolve();
        });
    });
};

function registerUser (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password !== userData.password2) {
            return reject("Passwords do not match.");
        }
        User.find({ userName: userData.userName })
            .then(users => {
                if (users.length > 0) {
                    return reject("Username already taken.");
                }
                bcrypt.hash(userData.password, 10)
                    .then(hash => {
                        userData.password = hash;
                        let newUser = new User(userData);
                        newUser.save()
                            .then(() => {
                                resolve();
                            })
                            .catch(err => {
                                reject(`There was an error in creating the user: ${err}`);
                            });
                    })
                    .catch(err => {
                        reject("There was an error in encrypting the password.");
                    });
            })
            .catch(err => {
                reject(`There was an error in checking the username: ${err}`);
            });
    });
};

function checkUser(userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName })
            .then(users => {
                if (users.length === 0) {
                    return reject(`Unable to find user: ${userData.userName}`);
                }
                bcrypt.compare(userData.password, users[0].password)
                    .then(result => {
                        if (result === false) {
                            return reject(`Incorrect password for user: ${userData.userName}`);
                        }
                        users[0].loginHistory.push({
                            dateTime: (new Date()).toString(),
                            userAgent: userData.userAgent
                        });
                        User.updateOne(
                            { userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory } }
                        )
                        .then(() => {
                            resolve(users[0]);
                        })
                        .catch(err => {
                            reject(`There was an error in verifying the user: ${err}`);
                        });
                    })
                    .catch(err => {
                        reject(`There was an error in comparing the password: ${err}`);
                    });
            })
            .catch(err => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    });
};

module.exports = {
    initialize,
    registerUser,
    checkUser
};