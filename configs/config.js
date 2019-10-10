// declariing app configs.
let config = {
  appName: 'site-crawler',
  appVersion: '1.0.0',
  port: 3000,
  mongodb: {
    uri: 'mongodb://localhost:27017/scrapdb'
  },
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}

module.exports = {
  ...config
}
