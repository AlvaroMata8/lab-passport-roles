const express = require("express");
const siteController = express.Router();
const passport = require('passport');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');
const checkRoles = require('../middlewares/checkRole');
const currentUser = require('../middlewares/currentUser');
const User = require('../models/User');
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


siteController.get("/", (req, res, next) => {
  User.find().exec((err, users) => {
    res.render("index", {
      users: users
    });
  });
});


siteController.post("/", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/"
}));

siteController.get('/boss', checkRoles('Boss'), function (req, res, next) {
  User.find().exec((err, users) => {
    res.render('boss', {
      users: users
    });
  });
});


siteController.post("/boss", (req, res, next) => {
  const username = req.body.username;
  const name = req.body.name;
  const password = req.body.password;
  const role = req.body.role;

  if (username === "" || password === "") {
    res.render("boss", {
      message: "Indicate username and password"
    });
    return;
  }

  User.findOne({
    username
  }, "username", (err, user) => {
    if (user !== null) {
      res.render("boss", {
        message: "The username already exists"
      });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);
    const newUser = new User({
      username,
      name,
      password: hashPass,
      role
    });
    newUser.save((err) => {
      if (err) {
        res.render("boss", {
          message: "Something went wrong"
        });
      } else {
        res.redirect("/boss");
      }
    });
  });
});


siteController.get('/edit/:id', currentUser, (req, res) => {
  const userId = req.params.id;
  User.findById(userId, (err, user) => {
    if (err) {
      return next(err);
    }
    res.render('edit-user', {
      user: user
    });
  });
})

siteController.get('/user-list/:id', (req, res) => {
  const userId = req.params.id;
  User.findById(userId, (err, user) => {
    if (err) {
      return next(err);
    }
    res.render('user-list', {
      user: user
    });
  });
})

siteController.post('/edit/:id', currentUser, (req, res) => {
  const userId = req.params.id;
  const {
    username,
    name,
    password,
    confirmPassword
  } = req.body;
  let updates;
  if ((password != '') && (confirmPassword != '')) {
    if (password === confirmPassword) {
      const salt = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(password, salt);
      updates = {
        username,
        name,
        password: hashPass
      };
    } else {
      res.render('edit-user', {
        errorMessage: "The passwords do not match!"
      });
      return;
    }
  } else {
    updates = {
      username,
      name,
      familyName
    };
  }

  User.findByIdAndUpdate(userId, updates, (err, user) => {
    if (err) {
      return next(err);
    }
    return res.redirect(`/`);
  });
})

siteController.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});


module.exports = siteController;