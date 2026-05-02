#!/usr/bin/env node
/**
 * HortiSort TDMS Watcher
 * Watches the Raw Datalog folder for new/changed .tdms files.
 * On change → runs the Python parser → writes public/datalog.json
 *
 * Usage:  node tdms-watcher.js
 * Keep running in a terminal alongside `npm run dev`
 */

import { watch } from 'fs'
import { execFile } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const WATCH_DIR   = resolve('Raw Datalog', 'Hortisort')
const PYTHON_EXE  = 'C:\\Users\\itadmin\\.local\\bin\\python3.14.exe'
const PARSER_PATH = resolve(__dirname, 'tdms-parser.py')

let debounceTimer = null

function runParser() {
  const ts = new Date().toLocaleTimeString()
  console.log(`[${ts}] TDMS change detected — running parser...`)

  execFile(PYTHON_EXE, [PARSER_PATH], (err, stdout, stderr) => {
    if (err) {
      console.error(`[${ts}] Parser error:`, err.message)
      if (stderr) console.error(stderr)
      return
    }
    console.log(stdout)
  })
}

function scheduleRun() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runParser, 1500)
}

console.log(`Watching: ${WATCH_DIR}`)
console.log(`Parser:   ${PARSER_PATH}`)
console.log('---')

// Run once on startup
runParser()

// Watch for .tdms file changes
watch(WATCH_DIR, { recursive: false }, (eventType, filename) => {
  if (filename && filename.endsWith('.tdms')) {
    console.log(`  [watch] ${eventType}: ${filename}`)
    scheduleRun()
  }
})
