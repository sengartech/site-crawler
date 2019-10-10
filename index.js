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
    console.log(`mongoose connection open: ${config.mongodb.uri}`);
  }
})

/**
 * handling process exceptions and errors.
 */
process.on('uncaughtException', (err) => {
  console.log(`uncaught exception occurred`)
  console.log(err)
})

process.on('unhandledRejection', (err) => {
  console.log(`unhandled rejection occurred`)
  console.log(err)
})

/**
 * listening app at specified port in config file.
 */
app.listen(config.port)
  .on('error', (err) => {
    console.log(`error occurrred while listening: ${err}`)
  })
  .on('listening', () => {
    console.log(`${config.appName} app is listening at port: ${config.port}`)
  })
