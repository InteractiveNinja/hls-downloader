import voeCrawler from "./webcrawlers/voe.crawler.js";

/**
 * Array of Crawlers
 * Crawler needs a default function that returns the master url or undefined
 * @type {((function(url: string): (Promise<string> | undefined)))[]}
 */
const registeredCrawler = [voeCrawler];

/**
 * Returns URL from a crawler
 * @param url
 * @returns {Promise<string | undefined>}
 */
export default async function crawl(url) {
  return registeredCrawler
    .map(async (crawler) => {
      return crawler(url);
    })
    .filter((urls) => !!urls)
    .pop();
}
