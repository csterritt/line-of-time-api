import { chromium, Browser, Page } from 'playwright'
import fs from 'fs'
import path from 'path'
import { setTimeout } from 'timers/promises'

interface ModelInfo {
  name: string
  type: string
  description: string
  pricing: string
}

async function getModelInfo(): Promise<ModelInfo[]> {
  const browser: Browser = await chromium.launch({ headless: false })
  const page: Page = await browser.newPage()

  try {
    // Navigate to the main models page
    await page.goto('https://developers.cloudflare.com/workers-ai/models/')
    await page.waitForLoadState('networkidle')

    // Find all model blocks/links
    const modelLinks = await page
      .locator('a[href*="/workers-ai/models/"]')
      .all()

    // console.log(`Found ${modelLinks.length} model links`)

    const models: ModelInfo[] = []

    for (const link of modelLinks) {
      try {
        // Get the href attribute
        const href = await link.getAttribute('href')
        if (!href) continue

        // Navigate to the model page
        if (!/workers-ai\/models\/\S+/.test(href)) {
          continue
        }
        const fullUrl = href.startsWith('http')
          ? href
          : `https://developers.cloudflare.com${href}`

        console.log(
          `curl defuddle.md/${fullUrl.replace(
            'https://',
            ''
          )} > tmp/models/${fullUrl
            .replace('https://developers.cloudflare.com/workers-ai/models/', '')
            .replace(/\//g, '-')}.md`
        )
        console.log('sleep 2')
      } catch (error) {
        console.error(`Error processing model: ${error}`)
        break
        // // Continue to next model
        // await page.goBack().catch(() => {})
        // await page.waitForLoadState('networkidle').catch(() => {})
      }
    }

    return models
  } finally {
    await browser.close()
  }
}

function generateCSV(models: ModelInfo[]): string {
  const headers = ['Name', 'Type', 'Description', 'Pricing']
  const csvRows = [headers.join(',')]

  for (const model of models) {
    // Escape commas and quotes in fields
    const escapeField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
      }
      return field
    }

    const row = [
      escapeField(model.name),
      escapeField(model.type),
      escapeField(model.description),
      escapeField(model.pricing),
    ].join(',')

    csvRows.push(row)
  }

  return csvRows.join('\n')
}

async function main() {
  // console.log('Starting to extract model information...')

  const models = await getModelInfo()
  console.log(`Extracted ${models.length} models`)

  const csvContent = generateCSV(models)

  // Write to CSV file
  const outputPath = path.join(process.cwd(), 'models.csv')
  fs.writeFileSync(outputPath, csvContent)

  // console.log(`CSV file saved to: ${outputPath}`)
  // console.log('Models extracted:')
  // models.forEach((model, index) => {
  //   console.log(
  //     `${index + 1}. ${model.name} (${model.type}) - ${model.pricing || 'No pricing info'}`
  //   )
  // })
}

main().catch(console.error)
