# nodejs-scraper-for-fetching-links
A Nodejs application, without using any external dependency to fetch all the links within a site. It processes all the links which is in the same domain as the first url provided.

# How to use
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

## Sample Driver Program
A sample driver program is also provides `index.js`, which will read the above parameters from command line argument. Below are the list of arguments it expects and its default value for the driver program.

Driver Program Parameter | Scraper Parameter | Default Value
-|-|-
-i | url | 'https://medium.com/'
-0 | file | 'output.csv'
-m | maxPagesToScrape | 1000
-w | throttleCount | 5