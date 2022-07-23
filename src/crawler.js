import voeCrawler from "./webcrawlers/voe.crawler.js";

const registeredCrawler = [voeCrawler];

/**
 * Returns URL from a crawler
 * @param url
 * @returns {Promise<string>}
 */
export default async function crawl(url) {
  return registeredCrawler
    .map(async (crawler) => {
      return await crawler(url);
    })
    .filter((urls) => !!urls)
    .pop();
}
