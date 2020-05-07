import { WriteStream, createWriteStream } from 'fs'
import * as path from 'path'
import { Writer, Link } from './writer.model'

export class ScrapperFileWriter implements Writer {
  private readonly mdWriteStream?: WriteStream

  private readonly tsvWriteStream?: WriteStream

  private linesWritten = 0

  constructor(fileName: string, outputFileFormat: Set<'md' | 'tsv'>) {
    if (outputFileFormat.has('md')) {
      this.mdWriteStream = createWriteStream(path.resolve(__dirname, `${fileName}.md`), { encoding: 'utf8' })
    }
    if (outputFileFormat.has('tsv')) {
      this.tsvWriteStream = createWriteStream(path.resolve(__dirname, `${fileName}.tsv`), { encoding: 'utf8' })
      this.tsvWriteStream.write(`scrapedURL\turlInPage`)
    }
  }

  write(urlScrapped: string, links: Link[]) {
    if (links.length === 0) return
    this.linesWritten += 1
    this.writeMd(`\n## ${this.linesWritten} ${urlScrapped}\n\n`)
    links.forEach((link, idx) => {
      this.writeMd(`\n${idx + 1}. [${link.title}](${link.href})`)
      this.writeTsv(`\n${urlScrapped}\t${link.href}`)
    })
  }

  done() {
    return Promise.all([this.endMd(), this.endData()])
  }

  private writeMd(content: string) {
    if (this.mdWriteStream) {
      this.mdWriteStream.write(content)
    }
  }

  private writeTsv(content: string) {
    if (this.tsvWriteStream) {
      this.tsvWriteStream.write(content)
    }
  }

  private endMd(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mdWriteStream) {
        this.mdWriteStream.end(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  private endData(): Promise<void> {
    return new Promise((resolve) => {
      if (this.tsvWriteStream) {
        this.tsvWriteStream.end(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}
