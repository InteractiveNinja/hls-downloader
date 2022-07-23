#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { downloadFromCLIArgs, downloadFromBatchFile } from "./index.js";
const args = yargs(hideBin(process.argv))
  .usage("$0 -i <URL with master.m3u8> -o <Output File path>")
  .usage("$0 -b <Path to Input file>").argv;

const inputUrl = args.i;
const outputPath = args.o;
const batchFile = args.b;

if (inputUrl && outputPath) {
  downloadFromCLIArgs(inputUrl, outputPath);
} else if (batchFile) {
  downloadFromBatchFile(batchFile);
} else {
  console.log("No Arguments set");
}
