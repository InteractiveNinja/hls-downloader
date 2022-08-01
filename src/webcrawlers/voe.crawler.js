import jquery from "jquery";
import { JSDOM } from "jsdom";
import axios from "axios";
import prompt from "prompt";

const promptSchema = {
  properties: {
    isVoe: {
      pattern: /^[yn]$/,
      description: "Is this a Voe Link? (y/n)",
      required: true,
      default: "n",
    },
  },
};

/**
 * Returns Promise
 * @param url
 * @returns {Promise<string> | undefined}
 */
export default async function voeCrawler(url) {
  const regexPattern = /https:\/\/[a-zA-Z\d.]*\/[a-zA-Z\d\/]*/;
  const match = regexPattern.test(url);
  if (!match) {
    return undefined;
  }
  prompt.start();
  console.log("Matched Crawler: voe/vupload");
  return await prompt
    .get(promptSchema)
    .then(({ isVoe }) => {
      if (isVoe === "n") {
        return Promise.reject();
      }
      return crawUrl(url);
    })
    .catch(() => undefined);
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
