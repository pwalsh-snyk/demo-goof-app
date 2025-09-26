var utils = require("../utils");
var mongoose = require("mongoose");
var Todo = mongoose.model("Todo");
var User = mongoose.model("User");
var hms = require("humanize-ms");
var ms = require("ms");
var streamBuffers = require("stream-buffers");
var readline = require("readline");
var moment = require("moment");
var exec = require("child_process").exec;
var validator = require("validator");
var fileType = require("file-type");
var AdmZip = require("adm-zip");
var fs = require("fs");
var _ = require("lodash");

exports.index = function (req, res, next) {
  Todo.find({})
    .sort("-updated_at")
    .exec(function (err, todos) {
      if (err) return next(err);

      res.render("index", {
        title: "Goof TODO",
        subhead: "Vulnerabilities at their best",
        todos: todos,
      });
    });
};

exports.loginHandler = function (req, res, next) {
  if (validator.isEmail(req.body.username)) {
    User.find(
      { username: req.body.username, password: req.body.password },
      function (err, users) {
        if (users.length > 0) {
          const redirectPage = req.body.redirectPage;
          const session = req.session;
          const username = req.body.username;
          return adminLoginSuccess(redirectPage, session, username, res);
        } else {
          return res.status(401).send();
        }
      }
    );
  } else {
    return res.status(401).send();
  }
};

function adminLoginSuccess(redirectPage, session, username, res) {
  session.loggedIn = 1;
  console.log(`User logged in: ${username}`);
  if (redirectPage) {
    return res.redirect(redirectPage);
  } else {
    return res.redirect("/admin");
  }
}

exports.login = function (req, res, next) {
  return res.render("admin", {
    title: "Admin Access",
    granted: false,
    redirectPage: req.query.redirectPage,
  });
};

exports.admin = function (req, res, next) {
  return res.render("admin", {
    title: "Admin Access Granted",
    granted: true,
  });
};

exports.get_account_details = function (req, res, next) {
  const profile = {};
  return res.render("account.hbs", profile);
};

exports.save_account_details = function (req, res, next) {
  const profile = req.body;
  if (
    validator.isEmail(profile.email, { allow_display_name: true }) &&
    validator.isMobilePhone(profile.phone, "he-IL") &&
    validator.isAscii(profile.firstname) &&
    validator.isAscii(profile.lastname) &&
    validator.isAscii(profile.country)
  ) {
    profile.firstname = validator.rtrim(profile.firstname);
    profile.lastname = validator.rtrim(profile.lastname);
    return res.render("account.hbs", profile);
  } else {
    console.log("error in form details");
    return res.render("account.hbs");
  }
};

exports.isLoggedIn = function (req, res, next) {
  if (req.session.loggedIn === 1) {
    return next();
  } else {
    return res.redirect("/");
  }
};

exports.logout = function (req, res, next) {
  req.session.loggedIn = 0;
  req.session.destroy(function () {
    return res.redirect("/");
  });
};

exports.create = function (req, res, next) {
  var item = req.body.content;
  var imgRegex = /\!\[alt text\]\((http.*)\s\".*/;
  if (typeof item == "string" && item.match(imgRegex)) {
    var url = item.match(imgRegex)[1];
    console.log("found img: " + url);

    exec("identify " + url, function (err, stdout, stderr) {
      console.log(err);
      if (err !== null) {
        console.log("Error (" + err + "):" + stderr);
      }
    });
  } else {
    item = parse(item);
  }

  new Todo({
    content: item,
    updated_at: Date.now(),
  }).save(function (err, todo, count) {
    if (err) return next(err);

    res.setHeader("Location", "/");
    res.status(302).send(todo.content.toString("base64"));
  });
};

exports.destroy = function (req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {
    try {
      todo.remove(function (err, todo) {
        if (err) return next(err);
        res.redirect("/");
      });
    } catch (e) {}
  });
};

exports.edit = function (req, res, next) {
  Todo.find({})
    .sort("-updated_at")
    .exec(function (err, todos) {
      if (err) return next(err);

      res.render("edit", {
        title: "TODO",
        todos: todos,
        current: req.params.id,
      });
    });
};

exports.update = function (req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {
    todo.content = req.body.content;
    todo.updated_at = Date.now();
    todo.save(function (err, todo, count) {
      if (err) return next(err);
      res.redirect("/");
    });
  });
};

exports.current_user = function (req, res, next) {
  next();
};

exports.chat = {
  get(req, res) {
    res.send(messages);
  },
  add(req, res) {
    const user = findUser(req.body.auth || {});

    if (!user) {
      res.status(403).send({ ok: false, error: "Access denied" });
      return;
    }

    const message = {
      icon: "👋",
    };

    _.merge(message, req.body.message, {
      id: lastId++,
      timestamp: Date.now(),
      userName: user.name,
    });

    messages.push(message);
    res.send({ ok: true });
  },
};

exports.xssTest = function (req, res) {
  let userInput = req.query.input;
  res.send(`<h1>${userInput}</h1>`);
};

exports.button = (res, req) => {
  res.send({ msg: "hello world" });
};

