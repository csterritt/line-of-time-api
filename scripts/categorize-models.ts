#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ModelInfo {
  name: string
  description: string
  serviceType: string
  isBeta: boolean
  unitPricing?: string
}

function parseModelFile(filePath: string): ModelInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    // Parse front matter
    let frontMatterEnd = -1
    let inFrontMatter = false
    let frontMatterText = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === '---') {
        if (!inFrontMatter) {
          inFrontMatter = true
        } else {
          frontMatterEnd = i
          break
        }
      } else if (inFrontMatter) {
        frontMatterText += line + '\n'
      }
    }

    if (frontMatterEnd === -1) return null

    // Extract name and description from front matter
    const nameMatch = frontMatterText.match(/title:\s*"([^"]+)"/)
    const descriptionMatch = frontMatterText.match(/description:\s*"([^"]+)"/)

    if (!nameMatch || !descriptionMatch) return null

    const name = nameMatch[1]
    const description = descriptionMatch[1]

    // Find the service type line after front matter
    let serviceType = ''

    for (let i = frontMatterEnd + 1; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip logo link and empty lines
      if (line.startsWith('![') || line === '' || line.startsWith('##')) {
        continue
      }

      // Look for the service type line (contains "•")
      if (line.includes('•')) {
        serviceType = line.split('•')[0].trim()
        break
      }

      // Stop when we find the @ line
      if (line.startsWith('@')) {
        break
      }
    }

    // Find the table and check for Beta and Unit Pricing
    let isBeta = false
    let unitPricing = ''
    let inTable = false

    for (let i = frontMatterEnd + 1; i < lines.length; i++) {
      const line = lines[i].trim()

      if (line.startsWith('|')) {
        inTable = true
        if (line.includes('Beta')) {
          isBeta = true
        }
        if (line.includes('Unit Pricing')) {
          const pricingMatch = line.match(
            /\|\s*Unit Pricing\s*\|\s*([^|]+)\s*\|/
          )
          if (pricingMatch) {
            unitPricing = pricingMatch[1].trim()
          }
        }
      } else if (inTable && line === '') {
        // End of table
        break
      }
    }

    // Apply the filtering logic
    if (isBeta) {
      return {
        name,
        description,
        serviceType,
        isBeta: true,
        unitPricing: undefined,
      }
    } else if (unitPricing) {
      return {
        name,
        description,
        serviceType,
        isBeta: false,
        unitPricing,
      }
    }

    return null
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error)
    return null
  }
}

function main() {
  const modelsDir = path.join(__dirname, '..', 'tmp', 'models')

  if (!fs.existsSync(modelsDir)) {
    console.error(`Models directory not found: ${modelsDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(modelsDir).filter((file) => file.endsWith('.md'))

  // CSV header
  console.log('name,description,service_type,is_beta,unit_pricing')

  for (const file of files) {
    const filePath = path.join(modelsDir, file)
    const modelInfo = parseModelFile(filePath)

    if (modelInfo) {
      // Escape CSV fields if needed
      const escapeCsvField = (field: string) => {
        if (
          field.includes(',') ||
          field.includes('"') ||
          field.includes('\n')
        ) {
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      }

      const row = [
        escapeCsvField(modelInfo.name),
        escapeCsvField(modelInfo.description),
        escapeCsvField(modelInfo.serviceType),
        modelInfo.isBeta ? 'true' : 'false',
        modelInfo.unitPricing ? escapeCsvField(modelInfo.unitPricing) : '',
      ]

      console.log(row.join(','))
    }
  }
}

main()
