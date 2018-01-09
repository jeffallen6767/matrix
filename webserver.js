var
  express = require('express'),
  path = require('path'),
  dir = __dirname,

  start = function(ctx) {
    var 
      staticPath = path.join(dir, ctx.publicFolder),
      indexPath = path.join(staticPath, ctx.indexFile),
      app = express(),
      port = ctx.port,
      server;

    app.use(
      express.static(staticPath)
    );

    app.get('/', function(req, res){
      res.sendFile(indexPath);
    });

    server = app.listen(port, function() {
      console.log('Webserver listening on port ' + port);
    });

    return server;
  };

module.exports = {
  'start': start
};