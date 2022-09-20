import jquery from "jquery";
import { JSDOM } from "jsdom";
import axios from "axios";
import prompt from "prompt";
import { bypass } from "@cantfindkernel/ddos-guard-bypass";

const promptSchema = {
  properties: {
    isVoe: {
      pattern: /^[yn]$/,
      description: "Is this a Voe Link? (y/n)",
      required: true,
      default: "y",
    },
  },
};

/**
 * Returns Promise
 * @param url
 * @returns {Promise<string>}
 */
export default async function voeCrawler(url) {
  const regexPattern = /https:\/\/[a-zA-Z\d.]*\/[a-zA-Z\d\/]*/;
  if (!regexPattern.test(url)) {
    return Promise.reject();
  }
  prompt.start();
  console.log("Matched Crawler: voe/vupload");
  return await prompt.get(promptSchema).then(({ isVoe }) => {
    if (isVoe === "n") {
      return Promise.reject();
    }
    return crawUrl(url);
  });
}

async function crawUrl(url) {
  let bypassData = await bypass(url, true);
  return axios({ url, headers: bypassData.headers })
    .then((res) => {
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
    })
    .catch((e) => {
      throw new Error(`${e.response.status} - ${e.response.statusText}`);
    });
}
