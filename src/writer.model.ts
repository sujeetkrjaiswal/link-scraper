export interface Link {
  href: string
  title: string
}
export interface Writer {
  write(url: string, links: Link[]): void
  done(): void
}
