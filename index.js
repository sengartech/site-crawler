/**
 * module dependencies.
 */
let express = require('express');
let mongoose = require('mongoose');

let config = require('./configs/config.js');

let app = express();

/**
 * establishing mongodb connection.
 */
mongoose.connect(config.mongodb.uri, config.mongoOptions);

mongoose.connection.on('error', (err) => {
  console.log(`mongoose connection error: ${err}`);
})

mongoose.connection.on('open', (err) => {
  if (err) {
    console.log(`mongoose connection error: ${err}`);
  } else {
    console.log(`mongoose connection open: ${config.mongodb.uri}\n`);
  }
})

/**
 * handling process exceptions and errors.
 */
process.on('uncaughtException', (err) => {
  console.log(`uncaught exception occurred`);
  console.log(err);
})

process.on('unhandledRejection', (err) => {
  console.log(`unhandled rejection occurred`);
  console.log(err);
})

// importing controller and model.
require('./models/crawlModel.js');
let crawlController = require('./controllers/crawlController.js');

// invoking crawler function in five seconds delay of the app start.
setTimeout(() => {
  console.log('...invoking crawler function...');

  crawlController.siteCrawler();
}, 5000);

/**
 * listening app at specified port in config file.
 */
app.listen(config.port)
  .on('error', (err) => {
    console.log(`error occurrred while listening: ${err}`);
  })
  .on('listening', () => {
    console.log(`${config.appName} app is listening at port: ${config.port}\n`);

    console.log(`crawler function will get invoked in 5 seconds.....\n`);
  })
