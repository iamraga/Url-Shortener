'use strict';

var express = require('express');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
var validUrl = require('valid-url');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

//DB Config
const db = process.env.MONGOLAB_URI;
const baseUrl = process.env.BASE_URL;

const MongoClient = require('mongodb').MongoClient;
const uri = (process.env.MONGOLAB_URI).toString();

app.use(cors());

//BodyParser middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

//New URL
app.post('/api/shorturl/new', function(req, res) {
  let newUrl = (req.body.url).toString();
  console.log(newUrl);
  if (!validUrl.isUri(newUrl)) {
    res.json({
      "error": "invalid URL"
    });
  } else {
    MongoClient.connect(uri, { useNewUrlParser: true }, (err, db) => {
      console.log("inside");
      let dbObj = db.db('nodedata');
      const collection = dbObj.collection('url');
      // perform actions on the collection object
        collection.find().toArray((err, data) => {

        if (err) throw err;

        //
        var urlList = data.map((obj) => {
          return obj.shortUrl;
        })
        do {
          var shortUrl = Array(6).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, 5);
        } while (urlList.indexOf(shortUrl) != -1);

        collection.insert({
          "url": newUrl,
          "shortUrl": shortUrl
        });

        res.json({
          "original_url": newUrl,
          "short_url": baseUrl + shortUrl
        });

      });
    })
  }
});


app.get('/:url', (req, res) => {
  var url = req.params.url;
  MongoClient.connect(uri, { useNewUrlParser: true }, (err, db) => {
      let dbObj = db.db('nodedata');
      const collection = dbObj.collection('url');
    // perform actions on the collection object
    collection.find({"shortUrl": url}).toArray((err, data) => {
      if (err) throw err;

      if (data.length > 0) {
        res.redirect(data[0].url);
      } else {
        res.json({
          "error": url + " is not a valid shortened url"
        });
      }
    });
  });

});

app.listen(port, function () {
  console.log('Node.js listening ...' + port);
});