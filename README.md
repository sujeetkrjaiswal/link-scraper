# Link Scraper

A command-line utility to fetch Links of a given seed URL. It will also recursively fetch links for a given depth.

This utility provides an interactive command-line user interface as well as command line options.

## Usage

### Example 1
Scrape `Medium.com` for `depth 2` for only `secure` urls i.e. `https:` and for whitelisted domains `medium.com`, `help.medium.com`
and save the output inside `data` folder with file name `medium-links` in `md` and `tsv` format.

To consider the uniqueness consider the `query` params and ignore the `hash` params.
```bash
link-scraper -u https://medium.com/ -w https://medium.com,https://help.medium.com -o data/medium-links -e tsv,md -d 2 -qs --no-hash
```

### Example 2

Partially init the application from command line and put other fields from the interactive interface.

For command line options: set the depth as `2` and set extension as `tsv`. consider only `https:` URLs and for uniqueness test
consider the `query` params and ignore the `hash` params.

Seed URL, whitelisted domains and file path will be entered from command line.

```bash
link-scraper -qs --no-hash -d 2 -e tsv
```

## Command line options

```text
  -u, --url <string>          seed url
  -w, --whitelisted <string>  Whitelisted url
  -o, --outFile <string>      Output file name
  -e, --extension <string>    depth limit to recursively scrape
  -d, --depth <number>        depth limit to recursively scrape
  -q, --query                 Consider Query Params for URL Uniqueness
  -h, --hash                  Ignore Hash Params for URL Uniqueness
  -s, --secure                Scrape only secured URLs (https: only)
  --no-hash                   Ignore Hash Params for URL Uniqueness
  --no-query                  Ignore Hash Params for URL Uniqueness
  --no-secure                 Allow scraping Non secure URLs (http: & https:)
  --help                      display help for command
```

