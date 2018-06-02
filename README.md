# nodejs-scraper-for-fetching-links
A Nodejs application, without using any external dependency to fetch all the links within a site. It processes all the links which is in the same domain as the first url provided, and others are not visited recursively, but are added in the output.

**NOTE**  The program will not work on version below `6.14.2 LTS`

**Example**
If the seed url is `https://example.com/seed/url`, all the urls of this page will be fetched and visited recursively except for the urls with diffent origin from the seed url. So say it has 2 urls on this page, eg. `https://exmple.com/url2` and `https://sujeetjaiswal.com`, then only the first url is visited recursively to fetch more links, but the second url will be added to the output file but will not be visited to fetch furthre links.

## Run Sample 
``` bash
# Written and tested on node 10.2.1
npm start
```
It will execute the following
```bash
node index.js -i='https://medium.com' -o='links.csv' -w=2 -m='Infinity'
```

## Sample Driver Program
A sample driver program is also provides `index.js`, which will read the above parameters from command line argument. Below are the list of arguments it expects and its default value for the driver program.

Driver Program Parameter | Scraper Parameter | Default Value
-|-|-
-i | url | 'https://medium.com/'
-0 | file | 'output.csv'
-m | maxPagesToScrape | 1000
-w | throttleCount | 5

## How to use the Core Scraper
The main class provides to create a instance with the configuration you need. Sample is given below

```javascript
const Scraper = require('./scraper')
let scraper = new Scraper(
    url,
    outputFileName,
    throttleCount,
    maxPagesToScrape
)
scraper.init()
```

term | defination
-|-
url | The initial url, from where the scraping will start. Any subsequent recursive scrapping will happen only for the url, which are of same origin that of provided url. Others will be just saved, but are never visited to get the links.
outputFileName | Name of the file where the links will be keep updating as and when discovers. Please note that the links that are added are distinct, which means that say if a url is already added to the file, it will not be added in this irrespective of how many no. of times it appears withing a url or from different url. The value defaults to `links.csv`
throttleCount | It is the number of concurrent request sent to a website. It value defaults to 5.
maxPagesToScrape | It is the number of pages, that the program is supposed to visit recursively. For Infinit set it `Infinity`. example: `-m=Infinity`

## Performance Consideration
To avoid re-processing URLs, the value is mainained in-memory. For scraping a site which has too many links, it is advisable to use a DB, to store the URLs, and to test if the url should be processed or not again.

Since, this is more of a POC, such things are not been added.

## Other Consideration
This is a not a production ready-code. For scraping you should prefer using python. In case you need to use node, please use the available libraries for fetching the page, and parsing the document.

This repositiory was build only for self-learining purpose. And other libraries were avoided in order to explore more of node-provided  modules.