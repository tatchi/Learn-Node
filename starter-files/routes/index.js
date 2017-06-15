const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const result = { name: 'tatchi', cool: true };
  // res.send('Hey! It works!');
  res.json(result);
});

router.get('/reverse/:name', (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
});

module.exports = router;
