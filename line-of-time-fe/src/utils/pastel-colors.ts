export const PASTEL_COLORS: string[] = [
  'oklch(0.85 0.08 0)',
  'oklch(0.85 0.08 90)',
  'oklch(0.85 0.08 180)',
  'oklch(0.85 0.08 270)',
  'oklch(0.85 0.08 45)',
  'oklch(0.85 0.08 135)',
  'oklch(0.85 0.08 225)',
  'oklch(0.85 0.08 315)',
]

export const connectorColor = (index: number): string =>
  PASTEL_COLORS[index % PASTEL_COLORS.length]!
