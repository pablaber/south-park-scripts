const express = require('express');
const app = express();
const port = 3000;

const db = require('./db');

app.get('/data', (_, res) => {
  db.loadScript().then((scripts, err) => {
    if(err) res.send(err);
    res.send(scripts);
  });
})

app.listen(port, () => {
  console.log(`Scripts backend listening on port ${port}...`)
});