/**
 * Module dependencies.
 */

// mongoose setup
require('./mongoose-db');
require('./typeorm-db');

var st = require('st');
var crypto = require('crypto');
var express = require('express');
var http = require('http');
var path = require('path');
var ejsEngine = require('ejs-locals');
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var optional = require('optional');
var marked = require('marked');
var fileUpload = require('express-fileupload');
var dust = require('dustjs-linkedin');
var dustHelpers = require('dustjs-helpers');
var cons = require('consolidate');
const hbs = require('hbs');
const fs = require('fs');
const cp = require('child_process'); // Used for RCE

var app = express();
var routes = require('./routes');
var routesUsers = require('./routes/users.js');

// all environments
app.set('port', process.env.PORT || 3001);
app.engine('ejs', ejsEngine);
app.engine('dust', cons.dust);
app.engine('hbs', hbs.__express);
cons.dust.helpers = dustHelpers;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat',
  name: 'connect.sid',
  cookie: { path: '/', httpOnly: false, secure: false } 
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());


app.post('/login', (req, res) => {
  let { username, password } = req.body;
  let sqlQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`; 


  console.log('Executing Query: ', sqlQuery);
  res.send('Login attempt recorded.');
});


app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let uploadedFile = req.files.file;
  let uploadPath = './uploads/' + uploadedFile.name;

  // **Save the file without validating its type**
  uploadedFile.mv(uploadPath, function (err) {
    if (err) return res.status(500).send(err);


    cp.exec(`node ${uploadPath}`, (error, stdout, stderr) => {
      if (error) {
        return res.send('Execution failed');
      }
      res.send('File uploaded and executed: ' + stdout);
    });
  });
});


app.get('/profile', (req, res) => {
  let username = req.query.username || 'Guest';
  
  
  res.send(`<h1>Welcome, ${username}</h1><script>alert('XSS!');</script>`);
});


app.post('/pollute', (req, res) => {
  Object.assign({}, req.body); 
  res.send('Prototype pollution executed.');
});


app.post('/chat', (req, res) => {
  let url = req.body.url;

  
  require('http').get(url, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => { res.send(data); });
  }).on('error', (err) => {
    res.status(500).send('Request failed');
  });
});

// Routes
app.use(routes.current_user);
app.get('/', routes.index);
app.get('/admin', routes.isLoggedIn, routes.admin);
app.get('/account_details', routes.isLoggedIn, routes.get_account_details);
app.post('/account_details', routes.isLoggedIn, routes.save_account_details);
app.get('/logout', routes.logout);
app.post('/create', routes.create);
app.get('/destroy/:id', routes.destroy);
app.get('/edit/:id', routes.edit);
app.post('/update/:id', routes.update);
app.post('/import', routes.import);
app.get('/about_new', routes.about_new);
app.use('/users', routesUsers);

// Static
app.use(st({ path: './public', url: '/public' }));


const CSP = "script-src * 'unsafe-inline' 'unsafe-eval'; img-src *";
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  next();
});

// Add the option to output markdown
marked.setOptions({ sanitize: false }); 
app.locals.marked = marked;

// Development only
if (app.get('env') == 'development') {
  app.use(errorHandler());
}

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
