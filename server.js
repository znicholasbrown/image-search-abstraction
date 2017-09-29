(()=>{

'use strict';

const express = require('express');
const url = require('url');
const https = require('https');
const app = express();
const dburi = "mongodb://znicholasbrown:Yn93Z1m8PhEQrLvf@ds040027.mlab.com:40027/image-search-abstraction-history-db";
const MongoClient = require('mongodb').MongoClient;

  
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
})
  
app.get("/imagesearch/*", (req, res) => {
  let pageslice = req.params[0].indexOf("/") === -1 ? 1 : req.params[0].slice(req.params[0].indexOf("/") + 1),
      queryslice = req.params[0].indexOf("/") === -1 ? req.params[0] : req.params[0].slice(0, req.params[0].indexOf("/"));
  
  let query = { query: encodeURIComponent(queryslice),
                page: pageslice === undefined ? 1 : parseInt(pageslice),
                date: new Date().toLocaleString()
              },
      flickruri =  {
        hostname: "api.flickr.com",
        path: "/services/rest/?method=flickr.photos.search&api_key=a5af0d374c896a3ef93d695978806195&format=json&per_page=10&tags=" + query.query + "&page=" + query.page,
      };

  let searchRequest = https.get(flickruri, (searchResponse) => {
    let buffs = [];

    searchResponse.setEncoding('utf8');

    searchResponse.on('data', (data) => {
      buffs.push(data);
    });
    searchResponse.on('end', () => {
      
      res.send(eval(buffs.join()));
    });
  });
  
  searchRequest.on('error', (error) => {
    res.send("Error: " + error.message);
  })
    
  MongoClient.connect(dburi, (err, db) => {
    if (err) throw err;
    let collection = db.collection("recent-searches");
    collection.insertOne(query, (err, succ) => {
      if (err) throw err;
      db.close();
    });
  })
});

app.get("/recent", (req, res) => {
  MongoClient.connect(dburi, (err, db) => {
    if (err) throw err;
    
    let collection = db.collection("recent-searches");
    let options = {_id: false};
    collection.find({}, options).toArray((err, docs) => {
      if (err) throw err;
      res.send(docs);
      db.close();
    });

    
  })
});

var listener = app.listen(process.env.PORT);

function jsonFlickrApi(object) {
  return constructURL(object);
}
  
function constructURL (object) {
  let photosArray = [];
  object.photos.photo.forEach((photo) => {
    photosArray.push({
      url: "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg",
      webpage: "https://www.flickr.com/photos/" + photo.owner + "/" + photo.id,
      altText: photo.title
    })
  })
  return photosArray;
}

})();
