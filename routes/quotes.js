const express = require('express');
const router = express.Router();
const quotes = require('../services/quotesser');

/* GET quotes listing. */
router.get('/', async function(req, res, next) {
  try {
    res.json(await quotes.getMultiple(req.query.page,req.query.lpp));
  } catch (err) {
    console.error(`Error while getting quotes `, err.message);
    next(err);
  }
});

/* POST quotes */
router.post('/', async function (req, res, next) {
    try {
        if (req.headers["origin"]) {
            res.setHeader("Access-Control-Allow-Origin", req.headers["origin"]);
        }
        else {
            res.setHeader("Access-Control-Allow-Origin", "*");
        }
        let ct = req.is('*/*');
        res.json(await quotes.create(ct == "text/plain" ? JSON.parse(req.body) : req.body));
    } catch (err) {
        console.error(`Error while posting quotes `, err.message);
        next(err);
    }
});

module.exports = router;
