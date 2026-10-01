// ── Fixture content — not translated UI chrome ────────────────────────────────
// Task 868: CMS page bodies that use the rich-text editor's layout features (columns, a table, an image,
// aligned text), per locale, shaped like real `pages.content.<locale>.body` rows. Read through the
// Storybook locale toolbar by the `RichTextEditor`, `PageEditorDialogView` and `CmsPageView` Stories and
// by the editor round-trip test. They are CMS data, not UI copy of any component.
//
// The markup is assembled through tag helpers, never as a literal `<tag>text</tag>` span on one source
// line: `check:stories` (§14.7, `jsx-text-literal`) reads such a line like hardcoded JSX copy.

export type RichFixtureLocale = 'en' | 'sq' | 'uk' | 'it'

const CLOUDINARY_DEMO = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'

function h2(text: string): string {
  return `<h2>${text}</h2>`
}
function h3(text: string): string {
  return `<h3>${text}</h3>`
}
function p(text: string): string {
  return `<p>${text}</p>`
}
function centred(text: string): string {
  return `<p style="text-align:center">${text}</p>`
}
function column(inner: string): string {
  return `<div data-type="column">${inner}</div>`
}
function columns(cols: 2 | 3, ...items: string[]): string {
  return `<div data-type="columns" data-cols="${cols}">${items.map(column).join('')}</div>`
}
function th(text: string): string {
  return `<th>${text}</th>`
}
function td(text: string): string {
  return `<td>${text}</td>`
}
function table(header: string[], rows: string[][]): string {
  const head = `<tr>${header.map(th).join('')}</tr>`
  const body = rows.map((row) => `<tr>${row.map(td).join('')}</tr>`).join('')
  return `<table><tbody>${head}${body}</tbody></table>`
}
function image(alt: string): string {
  return `<img src="${CLOUDINARY_DEMO}" alt="${alt}" width="1200" height="800" />`
}

interface RichParts {
  heading: string
  intro: string
  two: [string, string, string, string]
  three: [string, string, string]
  header: [string, string, string, string, string, string]
  rows: string[][]
  imageAlt: string
  closing: string
}

function build(parts: RichParts): string {
  return [
    h2(parts.heading),
    p(parts.intro),
    columns(2, h3(parts.two[0]) + p(parts.two[1]), h3(parts.two[2]) + p(parts.two[3])),
    columns(3, p(parts.three[0]), p(parts.three[1]), p(parts.three[2])),
    table(parts.header, parts.rows),
    image(parts.imageAlt),
    centred(parts.closing),
  ].join('')
}

export const RICH_LAYOUT_BODIES: Record<RichFixtureLocale, string> = {
  en: build({
    heading: 'Our services',
    intro: 'Everything you need to buy, sell or rent a home in one place.',
    two: ['For buyers', 'Browse verified listings and contact the owner directly.', 'For sellers', 'Publish a listing in minutes and reach thousands of buyers.'],
    three: ['Search by city and price.', 'Save your favourite listings.', 'Get notified about new offers.'],
    header: ['Package', 'Listings included', 'Photos per listing', 'Monthly price', 'Support', 'Contract term'],
    rows: [
      ['Basic', '3', '10', '0 EUR', 'Email', 'Monthly'],
      ['Professional', '30', '30', '29 EUR', 'Phone', 'Yearly'],
    ],
    imageAlt: 'The Lero.al office building',
    closing: 'Questions? We are happy to help.',
  }),
  sq: build({
    heading: 'Shërbimet tona',
    intro: 'Gjithçka që ju nevojitet për të blerë, shitur ose marrë me qira një shtëpi, në një vend.',
    two: ['Për blerësit', 'Shfletoni shpallje të verifikuara dhe kontaktoni drejtpërdrejt pronarin.', 'Për shitësit', 'Publikoni një shpallje brenda pak minutash dhe arrini mijëra blerës.'],
    three: ['Kërkoni sipas qytetit dhe çmimit.', 'Ruani shpalljet tuaja të preferuara.', 'Njoftohuni për ofertat e reja.'],
    header: ['Paketa', 'Shpallje të përfshira', 'Foto për shpallje', 'Çmimi mujor', 'Mbështetja', 'Kohëzgjatja'],
    rows: [
      ['Bazë', '3', '10', '0 EUR', 'Email', 'Mujore'],
      ['Profesionale', '30', '30', '29 EUR', 'Telefon', 'Vjetore'],
    ],
    imageAlt: 'Ndërtesa e zyrës së Lero.al',
    closing: 'Keni pyetje? Jemi të gatshëm t’ju ndihmojmë.',
  }),
  uk: build({
    heading: 'Наші послуги',
    intro: 'Усе потрібне, щоб купити, продати чи орендувати житло, в одному місці.',
    two: ['Для покупців', 'Переглядайте перевірені оголошення та зв’язуйтеся з власником напряму.', 'Для продавців', 'Опублікуйте оголошення за кілька хвилин і охопіть тисячі покупців.'],
    three: ['Шукайте за містом і ціною.', 'Зберігайте улюблені оголошення.', 'Отримуйте сповіщення про нові пропозиції.'],
    header: ['Пакет', 'Оголошень у пакеті', 'Фото до оголошення', 'Ціна за місяць', 'Підтримка', 'Тривалість'],
    rows: [
      ['Базовий', '3', '10', '0 EUR', 'Email', 'Щомісяця'],
      ['Професійний', '30', '30', '29 EUR', 'Телефон', 'Щороку'],
    ],
    imageAlt: 'Будівля офісу Lero.al',
    closing: 'Маєте запитання? Ми із задоволенням допоможемо.',
  }),
  it: build({
    heading: 'I nostri servizi',
    intro: 'Tutto ciò che serve per comprare, vendere o affittare una casa, in un unico posto.',
    two: ['Per chi compra', 'Sfoglia annunci verificati e contatta direttamente il proprietario.', 'Per chi vende', 'Pubblica un annuncio in pochi minuti e raggiungi migliaia di acquirenti.'],
    three: ['Cerca per città e prezzo.', 'Salva gli annunci preferiti.', 'Ricevi notifiche sulle nuove offerte.'],
    header: ['Pacchetto', 'Annunci inclusi', 'Foto per annuncio', 'Prezzo mensile', 'Supporto', 'Durata'],
    rows: [
      ['Base', '3', '10', '0 EUR', 'Email', 'Mensile'],
      ['Professionale', '30', '30', '29 EUR', 'Telefono', 'Annuale'],
    ],
    imageAlt: 'La sede di Lero.al',
    closing: 'Hai domande? Siamo felici di aiutarti.',
  }),
}

/** A page title for the `CmsPageView` Story, per locale. */
export const RICH_LAYOUT_TITLES: Record<RichFixtureLocale, string> = {
  en: 'Services and pricing',
  sq: 'Shërbimet dhe çmimet',
  uk: 'Послуги та ціни',
  it: 'Servizi e prezzi',
}

/** Pick the fixture for the toolbar locale, falling back to English. */
export function richFixtureLocale(locale: unknown): RichFixtureLocale {
  return locale === 'sq' || locale === 'uk' || locale === 'it' ? locale : 'en'
}
