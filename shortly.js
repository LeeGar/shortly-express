var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(cookieParser('cookiez'));
app.use(session());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', util.isAuthenticated,
function(req, res) {
  res.render('index');
});

app.get('/create', util.isAuthenticated,
function(req, res) {
  res.render('index');
});

//=================================================================

app.get('/login',
  function(request, response) {
    response.render('login');
});

app.post('/login',
  function(request, response) {

    var username = request.body.username;
    var password = request.body.password;

      new User({username: username}).fetch().then(function(user) {
        if (user) {
          bcrypt.compare(password, user.get('password'), function(error, match){
            if (match) {
              request.session.regenerate(function () {
                request.session.user = username;
                response.redirect('/');
              });
            } else {
              response.redirect('/login');
            }
        });
        } else {
          response.redirect('/login');
        }
      });
});

//===================================================================
app.get('/links', util.isAuthenticated,
function(req, res) {
  //is he signed in? if not, redirect to log in and verify himself
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

//===================================================================

app.get('/signup',
  function(request, response) {
    response.render('signup');
});

app.post('/signup',
  function(request, response, next) {

  var username = request.body.username;
  var password = request.body.password;

  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      console.log('username already exists');
      response.render("signup");
    } else {
        Users.create({
          username: username,
          password: password
        })
        .then(function(newUser) {
          response.setHeader('Location', '/');
          response.redirect('/');
        });
      }
  });
});

//===================================================================

app.get('/logout',
  function(request, response) {
    request.session.destroy(function(err) {
    response.render("login");
    });
});

app.post('/logout',
  function(request, response) {
    request.session.destroy(function(err) {
    response.render("login");
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
//authentication route is found in utils.isAuthenticated
//it will check if the request.session (aka session cookie), exists w/ the user
//otherwise it will force them to login


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  //console.log('get request is : ', req.params);
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
