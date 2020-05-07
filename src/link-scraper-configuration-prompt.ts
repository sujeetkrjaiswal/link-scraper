import { Command } from 'commander'
import inquirer from 'inquirer'

export interface CommandLineConfiguration {
  url: string
  whitelisted: string
  outFile: string
  extension: string
  depth: number
  query: boolean
  hash: boolean
  secure: boolean
}

export interface Configuration {
  url: string
  whitelistedDomains: string[]
  depth: number
  outputFileName: string
  outputFileFormat: Set<'md' | 'tsv'>
  isHttpsProtocolScraping: boolean
  isSearchParamIgnored: boolean
  isHashParamIgnored: boolean
}

const program = new Command()

program
  .option('-u, --url <string>', 'seed url')
  .option('-w, --whitelisted <string>', 'Whitelisted url')
  .option('-o, --outFile <string>', 'Output file name')
  .option('-e, --extension <string>', 'depth limit to recursively scrape')
  .option('-d, --depth <number>', 'depth limit to recursively scrape', parseInt)
  .option('-q, --query', 'Consider Query Params for URL Uniqueness ')
  .option('-h, --hash', 'Ignore Hash Params for URL Uniqueness')
  .option('-s, --secure', 'Scrape only secured URLs (https: only)')
  .option('--no-hash', 'Ignore Hash Params for URL Uniqueness')
  .option('--no-query', 'Ignore Hash Params for URL Uniqueness')
  .option('--no-secure', 'Allow scraping Non secure URLs (http: & https:)')

program.parse(process.argv)

export async function getConfiguration(): Promise<Configuration> {
  const opts: CommandLineConfiguration = program.opts() as CommandLineConfiguration
  console.log(opts)
  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter the seed url',
      default: 'https://www.npmjs.com/',
      when: () => {
        try {
          if (!opts.url) return true
          const parsedUrl = new URL(opts.url)
          return parsedUrl.origin === null
        } catch (e) {
          return true
        }
      },
      validate: (userInput) => {
        try {
          const parsedUrl = new URL(userInput)
          return parsedUrl.origin !== null
        } catch {
          return false
        }
      },
    },
    {
      type: 'input',
      name: 'whitelistedDomains',
      when: () => opts.whitelisted === undefined,
      message: 'Enter the comma separated white listed domains, defaults to seed url domain',
      default: (answers: any) => (opts.url || answers.url ? new URL(opts.url || answers.url).origin : undefined),
    },
    {
      type: 'input',
      name: 'file',
      when: () => opts.outFile === undefined,
      message: 'name of the output files (.md, .tsv)',
      default: (answers: any) => `scrapped-links-${new URL(opts.url || answers.url).hostname}`,
    },
    {
      type: 'checkbox',
      name: 'fileOutputFormat',
      when: () => opts.extension === undefined,
      message: 'Enter the outputs you need',
      choices: [
        { type: 'choice', name: '.md : Markdown File (list of links)', value: 'md' },
        { type: 'choice', name: '.tsv : Data File with link relation', value: 'tsv', checked: true },
      ],
    },
    {
      type: 'number',
      name: 'depth',
      when: () => opts.depth === undefined,
      message: 'Depth to recursively scrape for links (1: only the seed url)',
      default: 1,
    },
    {
      type: 'confirm',
      name: 'secure',
      when: () => opts.secure === undefined,
      message: 'Should scrape only secure URLs (https only)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'query',
      when: () => opts.query === undefined,
      message: 'Should consider search/query params (?...) in url, when checking uniqueness of url?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'hash',
      when: () => opts.hash === undefined,
      message: 'Should consider hash params (#...) in url, when checking uniqueness of url?',
      default: false,
    },
  ])
  const whitelistedDomains =
    opts.whitelisted === undefined ? response.whitelistedDomains.trim() : opts.whitelisted.trim()
  return {
    depth: Number(opts.depth || response.depth || 1),
    outputFileName: opts.outFile || response.file,
    isHttpsProtocolScraping: opts.secure === undefined ? response.secure : opts.secure,
    isHashParamIgnored: opts.hash === undefined ? !response.hash : !opts.hash,
    isSearchParamIgnored: opts.query === undefined ? !response.query : !opts.query,
    url: opts.url || response.url,
    outputFileFormat:
      opts.extension === undefined
        ? new Set(response.fileOutputFormat)
        : (new Set(opts.extension.toLowerCase().split(',')) as any),
    whitelistedDomains:
      whitelistedDomains === '*'
        ? []
        : whitelistedDomains
            .split(',')
            .map((url: string) => {
              try {
                const parsed = new URL(url)
                return parsed.origin
              } catch {
                return null
              }
            })
            .filter(Boolean),
  }
}
