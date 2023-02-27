var express = require("express"),
    app = express(),
    MBTiles = require('@mapbox/mbtiles'),
    fs = require('fs'),
    path = require("path");

// Enable CORS and set correct mime type/content encoding
const header = {
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"Origin, X-Requested-With, Content-Type, Accept",
  "Content-Type":"application/x-protobuf",
  "Content-Encoding":"gzip"
};

const pngHeader = {
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"Origin, X-Requested-With, Content-Type, Accept",
  "Content-Type":"image/png"
};

const mbtilesMap = {};
const mbtilesFormat = {};

// Route which handles requests like the following: /<mbtiles-name>/0/1/2.pbf
app.get('/:source/:z/:x/:y.pbf', function(req, res) {
  var mbtiles = mbtilesMap[req.params.source];
  if (mbtiles != null) {
    mbtiles.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
      if (err) {
        res.set({"Content-Type": "text/plain"});
        res.status(404).send('Tile rendering error: ' + err + '\n');
      } else {
        res.set(header);
        res.send(tile);
      }
    });
  } else {
    console.log("error, no source named %s", mbtiles);
    res.set({"Content-Type": "text/plain"});
    res.status(404).send('No source named: "' + req.params.source + '"\n');
  }
});

app.get('/:source/:z/:x/:y.png', function(req, res) {
  var mbtiles = mbtilesMap[req.params.source];
  // var format = mbtilesFormat[req.params.source];
  if (mbtiles != null) {
    mbtiles.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
      if (err) {
        res.set({"Content-Type": "text/plain"});
        res.status(404).send('Tile rendering error: ' + err + '\n');
      } else {
        res.set(pngHeader);
        res.send(tile);
      }
    });
  } else {
    console.log("error, no source named %s", mbtiles);
    res.set({"Content-Type": "text/plain"});
    res.status(404).send('No source named: "' + req.params.source + '"\n');
  }
});

//passsing directoryPath and callback function
fs.readdir(__dirname, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        var extensionStart = file.indexOf('.mbtiles');
        if (extensionStart != -1) {
          new MBTiles(path.join(__dirname, file), function(err, mbtiles) {
            if (err != null) {
              console.log("Unable to open %s: %s", file, err);
            } else {
              var prefix = file.substring(0, extensionStart);
              mbtilesMap[prefix] = mbtiles;
              mbtiles.getInfo(function(err, info) {
                if (info['format']) {
                  mbtilesFormat[prefix] = info['format'];
                  console.log("Using %s as %s with format: %s", file, prefix, info['format']);
                }
              })
            }
        });
      }
    });
});

// Starts up the server on port 3000
console.log('Listening on port: ' + 3000);
app.listen(3000);