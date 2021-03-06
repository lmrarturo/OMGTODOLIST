var User = require('./userModel');
var _ = require('lodash');
var signToken = require('../../auth/auth').signToken;

exports.params = function(req, res, next, id) {
  User.findById(id)
  .then(function(user) {
    if (!user) {
      next(new Error('There is no User with that ID'));
    } else {
      req.user = user;
      next();
    }
  }, function(err) {
    next(err);
  });
};

exports.get = function(req, res, next) {
  User.find()
  .then(function(users){
    res.json(users.map(function(user){
      return user.toJson();
    }));
  }, function(err){
    next(err);
  });
};

exports.getOne = function(req, res, next) {
  var user = req.user;
  res.json(user.toJson());
};

exports.put = function(req, res, next) {
  var user = req.user;

  var update = req.body;

  _.merge(user, update);

  user.save(function(err, saved) {
    if (err) {
      next(err);
    } else {
      res.json(user.toJson());
    }
  })
};

exports.post = function(req, res, next) {
  var newUser = new User(req.body);

  newUser.save(function(err, user) {
    if(err) { return next(err);}

    var token = signToken(user._id);
    res.json({token: token});
  });
};

exports.delete = function(req, res, next) {
  req.user.remove(function(err, removed) {
    if (err) {
      next(err);
    } else {
      res.json(removed.toJson());
    }
  });
};

exports.me = function(req, res) {
  res.json(req.user.toJson());
};

exports.status = function(req, res) {
  res.json({
    data: req.user.toJson(),
    status: 'success'
  });
};

// Custom Functions //

// Verify unique Username when
// creating a new User
exports.verifyUser = function() {
  return function(req, res, next) {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    if (!username || !email || !password) {
      res.status(400).send('¡Hubo un error al añadir al User! Verifique que no exista ningún campo vacío.');
      return;
    }

    User.findOne({ username: username.toLowerCase() })
    .then(function(user) {
      if (user) {
        res.status(400).send('¡Ya existe un User dado de alta con el usuario: "' + username + '"!');
      } else {
        req.user = user;
        next();
      }
    }, function(err) {
      next(err);
    });
  };
};

// Verify unique username when updating user

exports.verifyUpdateUser = function() {
  return function(req, res, next) {
    var currentID = req.user.id;

    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;


    if (!username || !password || email) {
      res.status(400).send('¡Hubo un error al actualizar tu perfil! Verifique que no exista ningún campo vacío.');
      return;
    }

    User.findOne({username: username.toLowerCase()})
    .then(function(user) {
      if (user) {
        if (user._id != currentID) {
          res.status(400).send('¡Ya existe ese nombre de usuario, intenta con uno diferente!');
        } else {
          next();
        }
      } else {
        next();
      }
    }, function(err) {
      next(err);
    });
  };
};
