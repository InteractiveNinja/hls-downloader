import jquery from "jquery";
import { JSDOM } from "jsdom";
import axios from "axios";

/**
 * Returns Promise
 * @param url
 * @returns {Promise<string> | undefined}
 */
export default async function voeCrawler(url) {
  const regexPattern = /(https:\/\/audaciousdefaulthouse.com\/[a-zA-Z0-9]*)/;
  const match = regexPattern.test(url);

  if (!match) {
    return undefined;
  }
  console.log("Matched Crawler: voe");
  console.log(`Crawling ${url}`);

  return await crawUrl(url);
}

async function crawUrl(url) {
  return axios.get(url).then((res) => {
    const { window } = new JSDOM(res.data);
    const $ = jquery(window);
    let scriptTags = [];
    // Collect all script tags in website
    $("script").each(function () {
      const scriptTag = $(this).html();
      scriptTags.push(scriptTag);
    });
    return scriptTags
      .join()
      .split("\n")
      .map((line) => line.trim()) // trim all lines
      .join()
      .split('"') // split to all "
      .filter((line) => {
        // find url with finding master file
        const urlMatch =
          /[-a-zA-Z0-9@:%_+.~#?&/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&/=,]*(\.m3u8))/;
        return urlMatch.test(line);
      })
      .pop();
  });
}
