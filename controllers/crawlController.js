/**
 * module dependencies.
 */
let mongoose = require('mongoose');
let request = require('request');
let cheerio = require('cheerio');
let urlParser = require('url-parse');
let lodash = require('lodash');

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
  console.log(`-- parsing body and extracting data --`);

  if (body) {
    // parse body.
    let parsedBody = cheerio.load(body);

    // get hyperlink of only medium.com and not of external sites.
    // let linksData = parsedBody("a[href^='https://']");
    let linksData = parsedBody(`a[href^='${config.siteLink}']`);

    console.log(`linksData length: ${linksData.length}`);

    let urlList = [];

    linksData.each(function () {
      urlList.push(parsedBody(this).attr('href'));
    })

    console.log(`urlList length: ${urlList.length}`);
    // console.log(urlList)

    // data setup.
    setupData(urlList).then(() => { console.log('data setup done...') });

    // adding links to linksToCrawl set so that they can be crawled.
    linksToCrawl = linksToCrawl.concat(urlList);

    console.log(`linksToCrawl length: ${linksToCrawl.length}`);
    console.log(linksToCrawl);

    callback();
  } else {
    callback();
  }
} // end parseBodyAndExtract.

/**
 * function to setup data to later store it in database.
 * params: urlList (new extracted urls array).
 */
let setupData = (urlList) => {
  console.log(`--settingUp data`);

  return new Promise((resolve, reject) => {
    urlList.forEach((url) => {
      let parsedUrl = urlParser(url, true);

      let linkPath = `${parsedUrl.origin}${parsedUrl.pathname}`;

      // linkPath is unique add it to the store, if not increase reference count.
      let index = uniqueLinksInfo.findIndex(obj => obj.url === linkPath);

      if (index === -1) {
        let newLinkObj = {
          url: linkPath,
          referenceCount: 1,
          parameterList: Object.keys(parsedUrl.query)
        }

        uniqueLinksInfo.push(newLinkObj);
      } else {
        uniqueLinksInfo[index].referenceCount++;
        let newParameterList = uniqueLinksInfo[index].parameterList.concat(Object.keys(parsedUrl.query));
        uniqueLinksInfo[index].parameterList = lodash.uniq(newParameterList);
      }
    });

    console.log(`--- showing uniqueLinksInfo data ---`);
    console.log(uniqueLinksInfo);

    resolve();
  })
} // end of the setupData function.

/**
 * function to store data in database.
 */
let storeData = () => {
  console.log(`---- storing data in database ----`);

  return new Promise((resolve, reject) => {
    if (uniqueLinksInfo.length === 0) {
      let msg = 'no data to store.';
      reject(msg);
    } else {
      crawlModel.create(uniqueLinksInfo, (err, result) => {
        if (err) {
          console.log(`error occurred: ${err.message}`);
          reject(err.message);
        } else {
          console.log(`data stored: ${result.length}`);
          resolve();
        }
      })
    }
  })
} // end of the storeData function.

/**
 * function to delay the next operation for specified time interval.
 * we will use this to maintain request rate limit.
 * params: timeInterval (in miliseconds).
 */
let delayOperation = (timeInterval) => {
  console.log(`-- delaying operation for ${timeInterval / 1000} seconds.`);
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
    linksToCrawl.push(config.siteLink);

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
    console.log(`\n---- no more links left to crawl ----\n`);

    // storing data if any.
    storeData().then(msg => console.log(msg));

    return;
  } else {
    // delaying request for particular interval so that we do not get blocked.
    await delayOperation(1000);
    console.log('..operation delayed.. moving further...');

    let url = linksToCrawl[linksToCrawl.length - 1];
    linksToCrawl.pop();

    if (url in linksVisited) {
      console.log(`skipping link already visited: ${url}`);
      recurCrawl();
    } else {
      linksVisited[url] = 1;
      console.log(`logging linksVisited:`);
      console.log(linksVisited);

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
