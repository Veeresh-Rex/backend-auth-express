var express = require('express');
var router = express.Router();
var userModel = require('../model/users');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  body,
  matchedData,
  check,
  validationResult,
} = require('express-validator');
const bodyParser = require('body-parser');
if (typeof localStorage === 'undefined' || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
router.use(cors());

var urlencodedParser = bodyParser.urlencoded({ extended: false });
/* GET home page. */
router.get('/', function (req, res, next) {
  var loginUser = localStorage.getItem('userToken');
  if (loginUser) {
    res.redirect('/dashboard');
  } else {
    res.render('index', { title: 'Password Management System', error: '' });
  }
});
router.post('/', (req, res) => {
  var username = req.body.username;
  // var password = req.body.password;
  console.log('username  ' + username);
  userModel
    .findOne({
      username: username,
    })
    .then((user) => {
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          let token = jwt.sign(
            {
              userid: user._id,
              username: user.username,
            },
            'loginToken',
            {
              expiresIn: '1h',
            }
          );
          console.log(token);
          localStorage.setItem('userToken', token);
          // res.json({ msg: 'Login' });
          res.redirect('/viewpassword');
        }
      } else {
        //  res.json({ msg: 'Invalid username or passoword' });
        res.render('index', {
          title: 'Password Management',
          error: 'Invalid Username or Password',
        });
      }
    })
    .catch((err) => {
      // res.json({ error: 'error catch' + err });
    });
});
router.get('/signup', (req, res) => {
  res.render('Signup', {
    title: 'Password Management',
    error: '',
  });
});
router.post(
  '/signup',
  urlencodedParser,
  [
    check('email', 'It should be correct e-mail')
      .trim()
      .isEmail()
      .custom((value) => {
        return userModel.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject('Email already registered');
          }
        });
      }),
    check('password', 'length should be at least 4 characters').isLength({
      min: 4,
    }),
    check('username', 'username length should be at least 3 characters')
      .trim()
      .isLength({ min: 3 })
      .custom((value) => {
        return userModel.findOne({ username: value }).then((user) => {
          if (user) {
            return Promise.reject('Username already exist');
          }
        });
      }),
    body('cpassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        return Promise.reject('Password does not matched');
      }
      return true;
    }),
  ],
  (req, res) => {
    const today = new Date();
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    // var cpassword = req.body.cpassword;
    const errors = validationResult(req);
    console.log(username + password);
    console.log(errors.mapped());
    if (errors.isEmpty()) {
      password = bcrypt.hashSync(req.body.password, 12);
      const user = matchedData(req);
      console.log(user);
      const userData = new userModel({
        username: username,
        email: email,
        password: password,
      });
      console.log(userData);

      userData
        .save()
        .then((result) => {
          console.log(result);
          res.redirect('/');
        })
        .catch((err) => {});
      // }
    } else {
      console.log('Error');
      res.render('Signup', {
        title: 'Password Management',
        error: errors.mapped(),
      });
      // res.status(200).json({ erre: errors.mapped() });
    }
  }
);
router.get('/logout', function (req, res, next) {
  localStorage.removeItem('userToken');

  res.redirect('/');
});
router.get('/passwordcatagory', function (req, res) {
  res.render('password_catagory', { title: 'Password list' });
});
router.get('/dashboard', function (req, res) {
  console.log('Test passed');
  // res.json({ msg: 'ejdjjd' });
  const data = {
    name: 'Veeresh maurya',
    title: 'Dashboard',
    roll: 1804610113,
    clg: 'maharana pratap engineering college',
  };
  res.render('Dashboard', { link: data });
});
router.get('/viewpassword', function (req, res) {
  res.render('viewpassword', { title: 'Password list' });
});

module.exports = router;
