const http = require('http')
const https = require('https')
const fs = require('fs')
const {
  URL
} = require('url');

const Reset = "\x1b[0m"
const FgGreen = "\x1b[32m"
const FgRed = "\x1b[31m"
const FgCyan = "\x1b[36m"
const spaceStatus = '   '


class Scraper {
  /**
   * 
   * @param {*} url : The seed url
   * @param {*} fileName : Filename where the links will be saved. NOTE that url will be appended
   * @param {*} maxThrottel : Maximum number of simultaneous requests
   * @param {*} maxScraping  : Maximum number of URLs to dig
   * 
   * 
   */
  constructor(url, fileName = 'links.csv', maxThrottel = 5, maxScraping = 10) {
    this.anchorPattern = /<a[^>]*>([^<]*)<\/a>/gi
    this.attrPatter = /href=("([^"]*)"|'([^']*)')/

    // This keeps the set of all processed URLs
    /**
     * processedSet keeps set of all urls which are already processed
     * toProcessSet keeps set of urls to be processed
     * inProcessSet keeps set of urls for which the processing is going on
     */
    this.processedSet = new Set()
    this.toProcessSet = new Set()
    this.inProcessSet = new Set()
    /**
     * Counters : To keep track of how much things are processed
     * successScrapedCount: keeps count of all contnet for which scrapping has been successful
     * failedScrapedCount: keeps count of links whose scraping is failed, this happens mostly 
     *          if we try to access a page which is not allowed
     * totalEntriesInFile: This is the result of URLs added to the output file.
     */
    this.successScrapedCount = 0
    this.failedScrapedCount = 0
    this.totalEntriesInFile = 0

    this.maxWorkerCount = maxThrottel
    try {
      this.url = new URL(url)
    } catch (e) {
      throw Error('Invalid URL')
    }
    this.maxScrapingCount = maxScraping
    this.fileName = fileName
  }
  init() {
    this.toProcessSet.add(this.url.href)
    this.assignJobIfWorkerFree()
  }

  /**
   * This will check the size of inProcessSet and toProcessSet,
   * and will then call the worker, till the maxThrottel is reached.
   */
  assignJobIfWorkerFree() {
    if (this.toProcessSet.size === 0 && this.inProcessSet.size === 0) {
      console.log(FgGreen, `
                STATUS UPDATE
                ==============================================================
                Start URL: ${this.url.href}
                Extracted URLs: ${this.totalEntriesInFile}
                Total Successfully Processed URLs: ${this.successScrapedCount}
                Total Failed Processed URLs: ${this.failedScrapedCount}
                Max Scraped Allowed: ${this.maxScrapingCount}
                Max Parallel Requests: ${this.maxWorkerCount}
            `)
      return
    }
    while (this.inProcessSet.size < this.maxWorkerCount && this.toProcessSet.size > 0) {
      if (this.toProcessSet.size > 0) {
        const url = this.toProcessSet.values().next().value
        if (url) {
          this.inProcessSet.add(url)
          this.toProcessSet.delete(url)
          this.worker(url)
        }
      }
    }
    console.log(FgCyan, `Currently Scraping For ${this.inProcessSet.size} urls concurrently`)
  }
  /**
   * 
   * @param {*} links 
   * It will append one link per line to a file.
   * If  file doesn't exist it will create a fresh copy. But if it exists, it will append
   */
  appendToFile(links) {
    return new Promise((resolve, reject) => {
      if (links && links.length) {
        fs.appendFile(this.fileName, links.join('\n'), (err) => {
          if (err) {
            reject(err)
          } else {
            resolve(links.length)
          }
        })
      } else {
        resolve(0)
      }
    })
  }
  /**
   * 
   * @param {*} url 
   * This will take the url, and retrieve all the links and then
   * will add links toProcessSet, if the link is of same origin that of the seed URL
   * 
   * All the links will be saved to file, provided they are not already added.
   */
  worker(url) {
    this.getAllLinksForPage(new URL(url))
      .then((links) => {
        links = new Set(links)
        this.successScrapedCount += 1
        const toSaveToFile = []
        links.forEach(link => {
          // Ensure that the url is not present in any set: toProcess inProcess processed
          if (!this.toProcessSet.has(link) &&
            !this.inProcessSet.has(link) &&
            !this.processedSet.has(link)
          ) {
            const linkUrl = new URL(link)
            if (this.url.origin === linkUrl.origin && this.maxScrapingCount >= (this.toProcessSet.size + this.successScrapedCount + 0.5 * this.failedScrapedCount)) {
              this.toProcessSet.add(link)
            }
            toSaveToFile.push(link)
          }
        })
        return this.appendToFile(toSaveToFile)
      }, () => {
        // This will only occur, if the getAllLinksForPage is failed because of any reason
        this.failedScrapedCount += 1
        console.log(FgRed, `${spaceStatus}Failed Scraping for ${url}`)
        return -1
      })
      .then((count) => {
        // In case of -1 :: it has failed else its good to go
        if (count >= 0) {
          this.totalEntriesInFile += count
          console.log(FgGreen, `${spaceStatus}Processed Scraping (with ${count} followup links) for ${url}`)
        }
      })
      .finally(() => {
        // After the processing is done, and irrespective of its staus, do the following
        this.processedSet.add(url)
        this.inProcessSet.delete(url)
        this.assignJobIfWorkerFree()
      })
  }

  /**
   * 
   * @param {*} urlObject URL object eg. new URL(<url>)
   * This function is responsible for fetching the url, using Nodejs Native http/https client
   * and then use RegEx to extract the anchor tags and then the href value.
   * 
   * It will ignore any url with '#', as it represent the same page.
   * It will also convert any relative url to absolute URL
   * It will also convert the //<path> to absolute url and use the protocol of that of seed url
   */
  getAllLinksForPage(urlObject) {
    return new Promise((resolve, reject) => {
        const client = urlObject.protocol === 'https:' ? https : http
        client.get(urlObject.href, res => {
          res.setEncoding("utf8");
          let body = ''
          res.on('data', data => body += data)
          res.on('end', () => {
            resolve(body)
          })
        }).on('error', (e) => {
          console.error(e)
          reject()
        })
      })
      .then((content) => {
        const allAnchors = content.match(this.anchorPattern)
        return allAnchors.map(anchors => {
          const hrefResult = anchors.match(this.attrPatter)
          let href = (hrefResult && (hrefResult[2] || hrefResult[3])) || ""
          if (href && href.length > 2 && href[0] === '/' && href[1] === '/') {
            href = urlObject.protocol + href
          } else if (href && href.length > 1 && href[0] === '/' && href[1] !== '/') {
            href = urlObject.origin + href
          }
          return href

        }).filter(u => u && u[0] !== '#')
      })

  }
}

module.exports = Scraper