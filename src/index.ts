import chalk from 'chalk'
import { getConfiguration } from './link-scraper-configuration-prompt'
import { LinkScraper } from './link-scraper'
import { ScrapperFileWriter } from './link-scraper-writer'
import { Writer } from './writer.model'

async function init() {
  const configuration = await getConfiguration()
  console.log(configuration)
  const { url, outputFileFormat, outputFileName, depth } = configuration
  console.info(chalk.blue(`Scraper initiated for ${url} until depth of ${depth}`))
  const fileWriter: Writer = new ScrapperFileWriter(outputFileName, outputFileFormat)
  const scraper = new LinkScraper(configuration, fileWriter, true)
  await scraper.process()
}

init().then(
  () => {
    console.info(chalk.bgGreen.black('Link Scraper finished successfully'))
  },
  (error) => {
    console.error(chalk.bgRed.black('Link Scraper failed to finish.'))
    console.error(error)
  }
)
