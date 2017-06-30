const passport = require('passport');
const mongoose = require('mongoose');
const crypto = require('crypto');
const promisify = require('es6-promisify');

const User = mongoose.model('User');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: "You're now logged in",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', "You're now logged out");
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('error', 'Oops you must be logged in');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  //1. See if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exists!');
    return res.redirect('/login');
  }
  //2. Set reset token with expiration
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now
  await user.save();
  //3. Send an email with the token
  const resetUrl = `https://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `Email reset link has been sent. ${resetUrl}`);
  //4. redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) {
    req.flash('error', 'Password reset is invalid or expired!');
    return res.redirect('/login');
  }
  //if user => show the reset form
  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res,next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Passwords do not match!')
  res.redirect('back')
}

exports.update = async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) {
    req.flash('error', 'Password reset is invalid or expired!');
    return res.redirect('/login');
  }
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser)
  req.flash('success', 'Your password has been reset')
  res.redirect('/ ')
}