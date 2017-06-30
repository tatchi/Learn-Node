const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// transport.sendMail({
//   from: 'tatchi <tinencor@gmail.com>',
//   to: 'randy@example.com',
//   subject: 'juste trying',
//   html: 'hey <strong> mate</strong>',
//   text: 'Hey I love you'
// })

const generatedHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  inlined = juice(html);
  return inlined;
};

exports.send = async options => {
  const html = generatedHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'tatchi <tinencor@gmail.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };
  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
