/**
 * module dependencies.
 */
let mongoose = require('mongoose');
let request = require('request');
let cheerio = require('cheerio');

let config = require('../configs/config.js');

let crawlModel = mongoose.model('crawlModel');

/**
 * function to parse body data and extract links.
 * params: body (html response data).
 */
let parseBodyAndExtract = (body) => {
  if (body) {
    // parse body.
    let parsedBody = cheerio.load(body);

    // get hyperlink of only medium.com and not of external sites.
    // let linksData = parsedBody("a[href^='https://']");
    let linksData = parsedBody(`a[href^='${config.siteLink}']`);

    console.log(`linksData length: ${linksData.length}`)

    let links = []

    linksData.each(function () {
      links.push(parsedBody(this).attr('href'));
    })

    console.log(`showing links:`)
    console.log(links)

    return 1;
  } else {
    return -1;
  }
} // end parseBodyAndExtract.

/**
 * function to delay the next operation for specified time interval.
 * we will use this to maintain request rate limit.
 * params: timeInterval (in miliseconds).
 */
let delayOperation = (timeInterval) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeInterval);
  })
} // end of the delayOperation.

/**
 * trial function to crawl single page.
 */
let siteCrawler = () => {
  console.log(`...inside siteCrawler function...`);

  if (config.siteLink !== '' && config.siteLink !== undefined) {
    request(config.siteLink, (error, resp, body) => {
      if (error) {
        console.log(`error occurred: ${error}`);
      } else if (resp.statusCode !== 200) {
        console.log(`status code is: ${resp.statusCode}`);
      } else {
        // parse body.
        parseBodyAndExtract(body);
      }
    })
  } else {
    console.log(`please provide siteLink in config.`);
  }
} // end of the siteCrawler function.

module.exports = {
  siteCrawler
}
