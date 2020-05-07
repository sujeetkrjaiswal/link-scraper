import fetch from 'node-fetch'
import cheerio from 'cheerio'
import url from 'url'
import { Link } from './writer.model'

export async function getRemoteDocumentLink(urlToScrape: string): Promise<Link[]> {
  const res = await fetch(urlToScrape)
  const document = await res.text()
  const $ = cheerio.load(document)
  const links: Link[] = []
  $('a').each((_, linkElem) => {
    const link = $(linkElem)
    const href = url.resolve(urlToScrape, link.attr('href') || '')
    if (href) {
      links.push({ href, title: link.text() || 'NOT_AVAILABLE' })
    }
  })
  return links
}
