/**
 * Automatisation navigateur (Puppeteer) pour postuler à la place du candidat.
 * Remplit les formulaires sur les pages des plateformes (Adzuna, LBA, etc.) et soumet.
 * Activer avec ENABLE_BROWSER_AUTOMATION=true.
 */

const PUPPETEER_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1280,800'
  ]
}

const PAGE_TIMEOUT_MS = 25000
const NAVIGATION_TIMEOUT_MS = 15000

/**
 * Sélecteurs courants pour champs de formulaire de candidature (ordre de priorité).
 */
const SELECTORS = {
  email: [
    'input[type="email"]',
    'input[name*="mail" i]',
    'input[id*="mail" i]',
    'input[placeholder*="mail" i]'
  ],
  name: [
    'input[name*="name" i]',
    'input[name*="prenom" i]',
    'input[name*="nom" i]',
    'input[id*="name" i]',
    'input[placeholder*="nom" i]',
    'input[placeholder*="prénom" i]'
  ],
  phone: [
    'input[type="tel"]',
    'input[name*="phone" i]',
    'input[name*="tel" i]',
    'input[id*="phone" i]',
    'input[placeholder*="tél" i]'
  ],
  message: [
    'textarea[name*="message" i]',
    'textarea[name*="lettre" i]',
    'textarea[name*="motivation" i]',
    'textarea[id*="message" i]',
    'textarea[placeholder*="message" i]',
    'textarea'
  ]
}

function getCandidateData(profile) {
  const firstName = (profile.first_name || '').trim()
  const lastName = (profile.last_name || '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Candidat'
  const email = (profile.campaign_email || profile.contact_email || '').trim()
  const phone = (profile.phone || profile.contact_phone || '').trim()
  const coverLetter = (profile.default_cover_letter || '').trim() || 'Je vous prie de trouver ci-joint ma candidature. Cordialement.'
  return { fullName, firstName, lastName, email, phone, coverLetter }
}

async function fillField(page, selectors, value) {
  if (!value) return false
  for (const sel of selectors) {
    try {
      const el = await page.$(sel)
      if (el) {
        await el.click({ clickCount: 3 })
        await el.type(value, { delay: 30 })
        await el.dispose()
        return true
      }
    } catch (_) {}
  }
  return false
}

async function clickSubmit(page) {
  const patterns = ['Postuler', 'Envoyer', 'Candidater', 'Submit', 'Valider', 'Envoyer ma candidature']
  for (const text of patterns) {
    try {
      const clicked = await page.evaluate((t) => {
        const nodes = document.querySelectorAll('button, input[type="submit"], a, [role="button"]')
        for (const n of nodes) {
          if (n.innerText && n.innerText.toLowerCase().includes(t.toLowerCase())) {
            n.click()
            return true
          }
        }
        return false
      }, text)
      if (clicked) return true
    } catch (_) {}
  }
  try {
    const btn = await page.$('button[type="submit"], input[type="submit"]')
    if (btn) {
      await btn.click()
      await btn.dispose()
      return true
    }
  } catch (_) {}
  return false
}

/**
 * Ouvre l'URL d'une offre et tente de remplir le formulaire puis de soumettre.
 */
export async function applyWithBrowser(jobUrl, profile) {
  if (!jobUrl || !jobUrl.startsWith('http')) {
    return { success: false, error: 'URL invalide' }
  }

  let browser
  try {
    const puppeteer = await import('puppeteer')
    browser = await puppeteer.default.launch(PUPPETEER_LAUNCH_OPTIONS)
    const page = await browser.newPage()
    page.setDefaultTimeout(PAGE_TIMEOUT_MS)
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS)

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.setViewport({ width: 1280, height: 800 })

    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' })
    await new Promise((r) => setTimeout(r, 2000))

    const { fullName, email, phone, coverLetter } = getCandidateData(profile)

    let filled = 0
    if (email) { if (await fillField(page, SELECTORS.email, email)) filled++ }
    if (fullName) { if (await fillField(page, SELECTORS.name, fullName)) filled++ }
    if (phone) { if (await fillField(page, SELECTORS.phone, phone)) filled++ }
    if (coverLetter) { if (await fillField(page, SELECTORS.message, coverLetter.slice(0, 2000))) filled++ }

    const submitted = await clickSubmit(page)
    await new Promise((r) => setTimeout(r, 1500))

    await browser.close()

    if (submitted) {
      return { success: true, message: `Formulaire soumis (${filled} champ(s) rempli(s)).` }
    }
    if (filled > 0) {
      return { success: false, error: 'Champs remplis mais bouton de soumission non trouvé.', message: `${filled} champ(s) rempli(s).` }
    }
    return { success: false, error: 'Aucun formulaire de candidature détecté sur cette page.' }
  } catch (err) {
    if (browser) try { await browser.close() } catch (_) {}
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Lance l'automatisation pour une liste d'offres. Limite le nombre par batch.
 */
export async function applyToOffersWithBrowser(offers, profile, maxApplications = 3) {
  const results = []
  const list = offers.slice(0, maxApplications)
  for (let i = 0; i < list.length; i++) {
    const offer = list[i]
    const url = offer.url || offer.href
    if (!url) continue
    const result = await applyWithBrowser(url, profile)
    results.push({ name: offer.name || offer.label, url, ...result })
    if (i < list.length - 1) await new Promise((r) => setTimeout(r, 3000))
  }
  return results
}
