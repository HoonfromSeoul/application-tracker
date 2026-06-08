// Minify source.js into a `javascript:` bookmarklet URL.
// Usage: node bookmarklet/build.mjs [APP_URL]
//   APP_URL defaults to http://localhost:5173
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const APP = process.argv[2] || 'http://localhost:5173'

let src = readFileSync(join(here, 'source.js'), 'utf8')
src = src.replace(/var APP = '[^']+';/, `var APP = '${APP}';`)

// Strip // line comments + collapse whitespace. Naive but adequate for this script.
const minified = src
  .split('\n')
  .map(l => l.replace(/(^|\s)\/\/.*$/, ''))
  .join(' ')
  .replace(/\s+/g, ' ')
  .trim()

const href = 'javascript:' + encodeURIComponent(minified)
writeFileSync(join(here, 'bookmarklet.txt'), href + '\n')
console.log('Wrote bookmarklet/bookmarklet.txt — drag this href onto your bookmark bar.')
console.log('Target app:', APP)
console.log('Length:', href.length, 'chars')
