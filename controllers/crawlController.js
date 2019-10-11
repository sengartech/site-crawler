/**
 * module dependencies.
 */
let mongoose = require('mongoose');
let request = require('request');
let cheerio = require('cheerio');

const config = require('../configs/config.js');

let crawlModel = mongoose.model('crawlModel');

// array of extracted links to be crawled.
let linksToCrawl = [];

/**
 * keep track of visited links so that we don't crawl a page more the one time.
 * key: value pair where key will be link and value will be number of time crawled.
 * in our case it will always be 1.
 */
let linksVisited = {};

/**
 * array of object: each object will have (url, referenceCount, parameterList).
 * we will then store it in database.
 */
let uniqueLinksInfo = [];

/**
 * function to parse body data and extract links.
 * params: body (html response data).
 */
let parseBodyAndExtract = (body, callback) => {
  if (body) {
    // parse body.
    let parsedBody = cheerio.load(body);

    // get hyperlink of only medium.com and not of external sites.
    // let linksData = parsedBody("a[href^='https://']");
    let linksData = parsedBody(`a[href^='${config.siteLink}']`);

    console.log(`linksData length: ${linksData.length}`)

    let urlList = []

    linksData.each(function () {
      urlList.push(parsedBody(this).attr('href'));
    })

    console.log(`showing urlList:`)
    console.log(urlList)

    // adding links to linksToCrawl set so that they can be crawled.
    linksToCrawl = linksToCrawl.concat(urlList)

    callback();
  } else {
    callback();
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
    linksToCrawl.push(config.siteLink)

    recurCrawl();
  } else {
    console.log(`please provide siteLink in config.`);
  }
} // end of the siteCrawler function.

/**
 * recursive function to crawl each links.
 */
let recurCrawl = async () => {
  if (linksToCrawl.length === 0) {
    console.log(`\n---- no more links left to crawl ----\n`)
    return;
  } else {
    // delaying request for particular interval so that we do not get blocked.
    await delayOperation(1000);

    let url = linksToCrawl[linksToCrawl.length - 1]
    linksToCrawl.pop()

    if (url in linksVisited) {
      recurCrawl()
    } else {
      linksVisited[url] = 1;

      makeRequest(url, recurCrawl);
    }
  }
} // end of the recurCrawl function.

/**
 * function to request site.
 */
let makeRequest = (url, callback) => {
  console.log(`--making request to : ${url}`);

  // making request.
  request(url, (error, resp, body) => {
    if (error) {
      console.log(`error occurred: ${error}`);
      callback();
    } else if (resp.statusCode !== 200) {
      console.log(`status code is: ${resp.statusCode}`);
      callback();
    } else {
      // parse body.
      parseBodyAndExtract(body, callback);
    }
  })
} // end of the makeRequest function.

module.exports = {
  siteCrawler
}
