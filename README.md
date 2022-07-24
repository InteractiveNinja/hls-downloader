# hls-downloader
Download large streams that use the HTTP Live Streaming (HLS) protocol.
I forked this tool from [plin0009/hls-downloader](https://github.com/plin0009/hls-downloader). I intend to use this tool for personal use for downloading streams over the CLI, no tool I found fulfill my expectations.

## Features
* Queue multiple playlist files with one .json
* Supports all output video formats as ffmpeg (.mp4, .mov, .avi, .ts, etc)
* Supported crawling sites:
  * voe.sx | audaciousdefaulthouse.com | vupload

## To-do
* Make queueing files more user-friendly (GUI?)
* Add crawling support for more HLS Streaming Sites
* Port to Typescript
* Build to single binary

## Prerequisites
* node v14.x.x or higher
* ffmpeg version 4.x

## How to use

```
hls-downloader -i <URL with master.m3u8> -o <Output File path>
hls-downloader -c <URL to Crawl> -o <Output File path>
hls-downloader -b <Path to Batch Input file> // see Batch Download for File Format 
```



### Batch Download Input File

Place an `input.json` in the project directory, then run `hls-downloader -b input.json`.
Temporary files are placed in `$TMPDIR/hls[random 5 chars]` and output files are placed in `output` location, relative to the project directory.

An example `input.json`:

```
{
  "streams": [
    {
      "url": "https://.../playlist1.m3u8",
      "output": "video1.mp4"
    },
    {
      "url": "https://.../playlist2.m3u8",
      "output": "video2.mp4"
    }
  ]
}
```

## How it works

1. Downloads and reads master playlist .m3u8 (given by `"url"`) in Batch Download Mode or Crawls Site for  master playlist .m3u8 in crawl mode and chooses the first variant playlist
2. Downloads and reads variant playlist .m3u8 and downloads each segment file (.ts)
3. Save new playlist .m3u8 with references to downloaded segment files
4. Feeds new playlist .m3u8 into ffmpeg to produce the output file (given by `"output"`)

