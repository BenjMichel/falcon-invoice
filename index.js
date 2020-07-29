const fs = require('fs')
const Mustache = require('mustache')
const puppeteer = require('puppeteer')

const readFile = require('./helpers')

module.exports = function invoice(template, templateVariables, options) {
  if (!template) {
    console.log('No template specified!')
  }
  let defaults = {
    filename: 'invoice.pdf',
    pdfOptions: {
      orientation: 'landscape'
    }
  }
  // Combine the two objects, overriding defaults with specified options
  let settings = Object.assign({}, defaults, options)
  let renderedData = ''
  let globalBrowser = null
  let globalPage = null
  // First, load the template file!
  return new Promise((resolve, reject) => {
    readFile(template)
      .then(fileBuffer => {
        // It resolves as a buffer, so we'll need to make a string to do things with it
        let templateString = fileBuffer.toString()

        // Run the template through mustache with variables
        renderedData = Mustache.render(templateString, templateVariables)
        return puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
      })
      .then((browser) => {
        globalBrowser = browser
        return browser.newPage();
      })
      .then((page) => {
        globalPage = page
        return page.setContent(renderedData, { waitUntil: 'networkidle2' })
      })
      .then(() => globalPage.pdf({path: settings.filename, format: 'A4'}))
      .then(() => {
        globalBrowser.close()
        resolve(settings.filename)
      })
      .catch(fileError => {
        console.log(`Error reading file: ${fileError}`)
        reject(fileError)
      })
  })
}
