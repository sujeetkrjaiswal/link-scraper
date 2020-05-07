import chalk from 'chalk'
import ora, { Ora } from 'ora'
import { Configuration } from './link-scraper-configuration-prompt'
import { getRemoteDocumentLink } from './process-url'
import { Writer } from './writer.model'

export class LinkScraper {
  private readonly configuration: Configuration

  private readonly fileWriter: Writer

  private readonly urlsScraped = new Set<string>()

  private urlsToProcessForNextDepth = new Map<string, string>()

  private readonly verboseLog: boolean

  private spinner?: Ora

  private readonly stats = {
    totalLinksFound: 0,
    totalLinksIgnoredConfiguration: 0,
    totalLinksIgnoredSimilar: 0,

    totalLinksScrappedSuccessfully: 0,
    totalLinksScrappedError: 0,

    currentDepth: 1,

    currentDepthLinks: 0,
    currentDepthLinksScrappedSuccess: 0,
    currentDepthLinksScrappedError: 0,
  }

  constructor(configuration: Configuration, writer: Writer, verboseLog = true) {
    this.configuration = configuration
    this.fileWriter = writer
    this.verboseLog = verboseLog
  }

  async process() {
    const { url, depth } = this.configuration
    const key = this.getUrlKey(url)
    console.log('key', key)
    if (key) {
      this.urlsToProcessForNextDepth.set(key, url)
    }
    if (this.verboseLog) {
      this.spinner = ora('Initialized').start()
    }
    for (let currentDepth = 1; currentDepth <= depth; currentDepth += 1) {
      this.stats.currentDepth = currentDepth
      this.stats.currentDepthLinks = 0
      this.stats.currentDepthLinksScrappedSuccess = 0
      this.stats.currentDepthLinksScrappedError = 0
      await this.processDepth()
      this.logStatOnDepthUpdate()
    }
    if (this.spinner) {
      this.spinner.succeed(chalk.bgGreen.black(`Scrapping done`))
    }
  }

  async processDepth() {
    const urlsToProcessForCurrentDepth: Map<string, string> = this.urlsToProcessForNextDepth
    this.urlsToProcessForNextDepth = new Map<string, string>()
    this.stats.currentDepthLinks = urlsToProcessForCurrentDepth.size
    this.stats.currentDepthLinksScrappedSuccess = 0
    // eslint-disable-next-line no-restricted-syntax
    for (const [urlKey, url] of urlsToProcessForCurrentDepth) {
      await this.processURl(urlKey, url, urlsToProcessForCurrentDepth)
    }
  }

  async processURl(urlKey: string, url: string, urlsToProcessForCurrentDepth: Map<string, string>) {
    try {
      const links = await getRemoteDocumentLink(url)
      this.fileWriter.write(url, links)
      this.urlsScraped.add(urlKey)
      links.forEach(({ href }) => {
        const key = this.getUrlKey(href)
        if (!key) {
          this.stats.totalLinksIgnoredConfiguration += 1
        } else if (
          this.urlsScraped.has(key) ||
          this.urlsToProcessForNextDepth.has(key) ||
          urlsToProcessForCurrentDepth.has(key)
        ) {
          this.stats.totalLinksIgnoredSimilar += 1
        } else {
          this.urlsToProcessForNextDepth.set(key, href)
        }
      })
      this.stats.totalLinksFound += links.length
      this.stats.totalLinksScrappedSuccessfully += 1
      this.stats.currentDepthLinksScrappedSuccess += 1
    } catch (error) {
      this.stats.totalLinksScrappedError += 1
      this.stats.currentDepthLinksScrappedError += 1
      if (this.verboseLog && this.spinner) {
        this.spinner = this.spinner.warn(
          chalk.red(`Error processing scraping for url:${url}  ErrorMessage: ${error.message}`)
        )
        this.spinner.start()
      }
    }
    if (this.verboseLog) {
      this.logStat()
    }
  }

  getUrlKey(href: string): string | null {
    const url = new URL(href)
    const { isSearchParamIgnored, isHashParamIgnored, isHttpsProtocolScraping, whitelistedDomains } = this.configuration
    if (isHttpsProtocolScraping && url.protocol !== 'https:') return null
    if (whitelistedDomains.length && !whitelistedDomains.some((domain) => url.href.startsWith(domain))) return null
    return `${url.origin}${url.pathname}${isSearchParamIgnored ? '' : url.search}${isHashParamIgnored ? '' : url.hash}`
  }

  private logStat() {
    if (!this.spinner) return
    const {
      currentDepth,
      totalLinksFound,
      totalLinksScrappedSuccessfully,
      totalLinksScrappedError,
      totalLinksIgnoredSimilar,
      totalLinksIgnoredConfiguration,
      currentDepthLinksScrappedSuccess,
      currentDepthLinksScrappedError,
      currentDepthLinks,
    } = this.stats
    this.spinner.text = [
      chalk`{inverse  Depth: ${currentDepth}/${this.configuration.depth}} `,
      chalk`Current Depth: {green ${currentDepthLinksScrappedSuccess}} + {red ${currentDepthLinksScrappedError}} of {blue ${currentDepthLinks}}`,
      chalk`Total Scrapped: {green ${totalLinksScrappedSuccessfully}} + {red ${totalLinksScrappedError}} of {blue ${this.urlsScraped.size}}`,
      chalk`Ignored:: {yellow Configuration:${totalLinksIgnoredConfiguration} Similarity:${totalLinksIgnoredSimilar} of ${totalLinksFound}}`,
    ].join(' | ')
  }

  private logStatOnDepthUpdate() {
    if (!this.spinner) return
    const {
      totalLinksFound,
      totalLinksScrappedSuccessfully,
      totalLinksScrappedError,
      currentDepth,
      totalLinksIgnoredSimilar,
      totalLinksIgnoredConfiguration,
    } = this.stats
    this.spinner = this.spinner.succeed(chalk.green(`Depth ${currentDepth} completed sucessully`))
    console.log(chalk`
    Depth Status: {green ${currentDepth} of ${this.configuration.depth}}
    Total Links Scrapped:: {green Success: ${totalLinksScrappedSuccessfully}} | {red Error: ${totalLinksScrappedError}} | {blue Total: ${this.urlsScraped.size}}
    Total Links Ignored:: {gray ${totalLinksIgnoredConfiguration} - ${totalLinksIgnoredSimilar}} 
    Total Links Found: {cyan ${totalLinksFound}}
    Links To Scrap in Next Depth: {cyan ${this.urlsToProcessForNextDepth.size}}
    `)
    if (currentDepth < this.configuration.depth) {
      this.spinner.start(`Initializing Next Depth`)
    }
  }
}
