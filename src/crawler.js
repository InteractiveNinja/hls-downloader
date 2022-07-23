import voeCrawler from "./webcrawlers/voe.crawler.js";

const registeredCrawler = [voeCrawler];

export default async function crawl(url) {
  return registeredCrawler
    .map(async (crawler) => {
      return await crawler(url);
    })
    .filter((urls) => !!urls)
    .pop();
}
