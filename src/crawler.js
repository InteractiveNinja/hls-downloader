import voeCrawler from "./webcrawlers/voe.crawler.js";

const registeredCrawler = [voeCrawler];

export default async function crawl(url) {
  return await registeredCrawler
    .map(async (crawler) => {
      const masterURL = await crawler(url);
      return masterURL ?? undefined;
    })
    .filter((url) => !!url)
    .pop();
}
