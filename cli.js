import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { downloadFromCLIArgs, downloadFromConfig } from "./index.js";
const args = yargs(hideBin(process.argv))
  .usage("$0 -i <URL with master.m3u8> -o <Output File path>")
  .usage("$0 -c <Path to Input file>").argv;

const inputUrl = args.i;
const outputPath = args.o;
const configPath = args.c;

if (inputUrl && outputPath) {
  downloadFromCLIArgs(inputUrl, outputPath);
} else if (configPath) {
  downloadFromConfig(configPath);
} else {
  console.log("No Arguments set");
}
