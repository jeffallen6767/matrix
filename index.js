var 
  pkg = require('./package.json'),
  web = require('./webserver.js'),
  instance = web.start(pkg.webconfig);