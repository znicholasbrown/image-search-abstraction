
var express = require('express');
var app = express();

app.get("/", function (req, res) {

  res.send("Site is under construction... 👷");
});


var listener = app.listen(process.env.PORT);
