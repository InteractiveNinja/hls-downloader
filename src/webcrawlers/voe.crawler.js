import jquery from "jquery";
import { JSDOM } from "jsdom";
import axios from "axios";

export default function voeCrawler(url) {
  const regexPattern = /(https:\/\/audaciousdefaulthouse.com\/[a-zA-Z0-9]*)/;
  const match = regexPattern.test(url);

  if (!match) {
    return undefined;
  }
  console.log("Matched Crawler: voe");
  console.log(`Crawling ${url}`);

  return crawUrl(url);
}

async function crawUrl(url) {
  return axios.get(url).then((res) => {
    const { window } = new JSDOM(res.data);
    const $ = jquery(window);
    const scriptTag = $(
      "body > div.stream > div.container > div.player-wrapper.mt-2 > div > script:nth-child(6)"
    ).html();
    //TODO Better way of searching for the master url with less unsafe index requests
    return scriptTag
      .split("\n")
      .map((line) => line.trim())[9]
      .split('"')[3];
  });
}
