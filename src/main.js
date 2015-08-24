var fs = require('fs');
var chokidar = require('chokidar');
var path = require('path');
var server = require('http').createServer();
var markdown = require('./markdown');
var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({server: server});

var start = function(filename, port) {

  var watchFile = function(ws, callback) {
    var watcher = chokidar.watch(filename);
    watcher.on('change', function(path) {
      console.log('Change detected! Updating');
      markdown(filename, callback);
      watcher.close();
      watchFile(ws, callback);
    });
  };

  wss.on('connection', function connection(ws) {
    ws.on('message', function(message) {
      console.log('received: ' + message);
    });

    markdown(filename, function(content) {
      ws.send(content);
    });

    watchFile(ws, function(content) {
      ws.send(content);
    });
  });

  server.on('request', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.createReadStream(path.join(__dirname, 'preview.html'), {encoding: 'utf-8'}).pipe(res, {end: true});
  });

  server.listen(port, function() {
    console.log('see preview in http://localhost:' + port);
  });
};

module.exports = start;
