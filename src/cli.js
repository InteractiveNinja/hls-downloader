#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { downloadFromCLIArgs, downloadFromBatchFile } from "./index.js";
import crawl from "./crawler.js";
const args = yargs(hideBin(process.argv))
  .usage("$0 -i <URL with master.m3u8> -o <Output File path>")
  .usage("$0 -c <URL to Crawl> -o <Output File path>")
  .usage("$0 -b <Path to Input file>").argv;
const inputUrl = args.i;
const outputPath = args.o;
const batchFile = args.b;
const crawlURL = args.c;

function run() {
  if (inputUrl && outputPath) {
    downloadFromCLIArgs(inputUrl, outputPath);
    return;
  }
  if (crawlURL && outputPath) {
    crawl(crawlURL).then((url) => downloadFromCLIArgs(url, outputPath));
    return;
  }
  if (batchFile) {
    downloadFromBatchFile(batchFile);
    return;
  }

  console.log("No Arguments set");
}

(() => {
  run();
})();
