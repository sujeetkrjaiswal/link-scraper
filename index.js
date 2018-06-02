/**
 * This is a driver program, whose task is to take parameters from the agruments passed.
 * or fallback to default parameters and then execute the scrapper method.
 */

// Step 1: read variables from arguments passed
const argMap = getArgvParams()
// Step 2: Create a Instance of Scrapper and then initialize it.
console.log(argMap)

// Utility method specifically written for the given problem
function getArgvParams() {
    const acceptedParms = /^-[iomw]=/
    const args = process.argv.filter(arg => acceptedParms.test(arg))
    return args.reduce((agg, arg) => {
        switch (arg[1]) {
            case 'i':
                let url = arg.slice(3)
                try {
                    url = new URL(url)
                    agg.url = url.href
                } catch (e) { console.error(e) }
                break
            case 'o':
                agg.file = arg.slice(3)
                break;
            case 'm':
                let m = arg.slice(3)
                if (m === 'Infinity') {
                    agg.maxPagesToScrape = Number.POSITIVE_INFINITY
                } else {
                    try {
                        m = parseInt(m, 10)
                        agg.maxPagesToScrape = m
                    } catch (e) { console.error(e) }
                }
                break
            case 'w':
                let w = arg.slice(3)
                try {
                    w = parseInt(w)
                    agg.throttleCount = w
                } catch (e) { console.error(e) }
        }
        return agg
    }, {
            url: 'https://medium.com/',
            file: 'output.csv',
            throttleCount: 5,
            maxPagesToScrape: 1000
        })
}