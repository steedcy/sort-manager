const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'config.js') continue
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(target)
    else if (entry.name.endsWith('.js')) execFileSync(process.execPath, ['--check', target], { stdio: 'inherit' })
    else if (entry.name.endsWith('.json')) JSON.parse(fs.readFileSync(target, 'utf8'))
  }
}

visit(root)
console.log('Mini Program JavaScript and JSON checks passed.')
