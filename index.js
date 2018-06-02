/**
 * This is a driver program, whose task is to take parameters from the agruments passed.
 * or fallback to default parameters and then execute the scrapper method.
 */
const {
  URL
} = require('url');
const Scraper = require('./scraper')


// Step 1: read variables from arguments passed
const argMap = getArgvParams()
// Step 2: Create a Instance of Scrapper and then initialize it.
const scraper = new Scraper(argMap.url, argMap.file, argMap.throttleCount, argMap.maxPagesToScrape)
scraper.init()

// Utility method specifically written for the given problem
function getArgvParams() {
  const acceptedParms = /^-[iomw]=/
  const args = process.argv.filter(arg => acceptedParms.test(arg))
  return args.reduce((agg, arg) => {
    switch (arg[1]) {
      case 'i':
        let url = arg.slice(3)
        try {
          // Try parsing the url, to make sure the url is correct
          url = new URL(url)
          agg.url = url.href
        } catch (e) {
          console.error(e)
        }
        break
      case 'o':
        // Take the output file name as is.
        agg.file = arg.slice(3)
        break;
      case 'm':
        let m = arg.slice(3)
        // If the arg is Infinity, assign Positive inifinity
        if (m === 'Infinity') {
          agg.maxPagesToScrape = Number.POSITIVE_INFINITY
        } else {
          try {
            // Try to parse as Int. If failed, use the defaults
            m = parseInt(m, 10)
            agg.maxPagesToScrape = m
          } catch (e) {
            console.error(e)
          }
        }
        break
      case 'w':
        let w = arg.slice(3)
        try {
          w = parseInt(w)
          agg.throttleCount = w
        } catch (e) {
          console.error(e)
        }
    }
    return agg
  }, {
    // These are the default values
    url: 'https://medium.com/',
    file: 'output.csv',
    throttleCount: 5,
    maxPagesToScrape: 1000
  })
}
