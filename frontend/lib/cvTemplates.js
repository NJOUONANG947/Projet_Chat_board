/**
 * Templates et palettes de couleurs pour la génération de CV.
 * Design moderne, professionnel, adapté dev web/mobile.
 */

export const CV_TEMPLATES = [
  { id: 'moderne', name: 'Moderne', description: 'Minimal, aéré, style Notion / Vercel', layout: 'single' },
  { id: 'tech', name: 'Tech', description: 'Développeur, sobre, sidebar compétences', layout: 'sidebar' },
  { id: 'elegant', name: 'Élégant', description: 'Corporate, recrutement classique', layout: 'single' },
  { id: 'creatif', name: 'Créatif', description: 'Startup, design léger', layout: 'single' }
]

export const CV_COLORS = [
  { id: 'blue', name: 'Bleu', primary: '#1e40af', secondary: '#3b82f6', tailwind: 'blue' },
  { id: 'slate', name: 'Ardoise', primary: '#1e293b', secondary: '#475569', tailwind: 'slate' },
  { id: 'emerald', name: 'Émeraude', primary: '#047857', secondary: '#059669', tailwind: 'emerald' },
  { id: 'violet', name: 'Violet', primary: '#5b21b6', secondary: '#7c3aed', tailwind: 'violet' },
  { id: 'orange', name: 'Orange doux', primary: '#c2410c', secondary: '#ea580c', tailwind: 'orange' }
]

export function getColorById(colorId) {
  return CV_COLORS.find(c => c.id === colorId) || CV_COLORS[0]
}

export function getTemplateById(templateId) {
  return CV_TEMPLATES.find(t => t.id === templateId) || CV_TEMPLATES[0]
}
