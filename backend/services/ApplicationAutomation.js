/**
 * Automatisation navigateur (Puppeteer) pour postuler à la place du candidat.
 * Remplit les formulaires sur les pages des plateformes (Adzuna, LBA, etc.) et soumet.
 * Activer avec ENABLE_BROWSER_AUTOMATION=true.
 */

const path = require('path')
if (!process.env.PUPPETEER_CACHE_DIR) {
  process.env.PUPPETEER_CACHE_DIR = path.join(process.cwd(), '.puppeteer-cache')
}

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

const PAGE_TIMEOUT_MS = 35000
const NAVIGATION_TIMEOUT_MS = 20000

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

/** Mots / expressions indiquant une page de confirmation après candidature. */
const SUCCESS_INDICATORS = [
  'candidature envoyée', 'candidature enregistrée', 'candidature reçue', 'merci pour votre candidature',
  'votre candidature a bien été', 'confirmation', 'message envoyé', 'envoyé avec succès',
  'thank you', 'application sent', 'successfully submitted', 'we have received',
  'postulation enregistrée', 'votre demande a bien été', 'bien reçu', 'application received',
  'votre candidature a été transmise', 'merci d\'avoir postulé',
  'déjà postulé', 'already applied', 'vous avez déjà postulé', 'votre candidature a été envoyée',
  'candidature transmise', 'merci pour votre demande', 'votre message a été envoyé',
  'envoi réussi', 'bien envoyé', 'enregistrée avec succès', 'applied successfully'
]

/**
 * Après un clic sur "Envoyer", vérifie si la page affiche une confirmation (URL ou texte).
 */
async function detectConfirmationPage(page) {
  try {
    const url = page.url()
    const text = await page.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText.toLowerCase() : '')
    const combined = `${url} ${text}`
    const found = SUCCESS_INDICATORS.some((ind) => combined.includes(ind.toLowerCase()))
    return { confirmed: found, url, excerpt: text.slice(0, 300) }
  } catch (_) {
    return { confirmed: false, url: '', excerpt: '' }
  }
}
/**
 * Sélecteurs supplémentaires pour les plateformes externes (Indeed, Hello Work, etc.) après redirection.
 * Structure souvent différente — on essaie des patterns plus larges.
 */
const EXTERNAL_SELECTORS = {
  email: [
    'input[type="email"]',
    'input[name*="mail" i]', 'input[name*="email" i]',
    'input[id*="mail" i]', 'input[id*="email" i]',
    'input[placeholder*="mail" i]', 'input[placeholder*="e-mail" i]',
    'input[data-testid*="email" i]', 'input[aria-label*="mail" i]'
  ],
  name: [
    'input[name*="name" i]', 'input[name*="prenom" i]', 'input[name*="nom" i]',
    'input[id*="name" i]', 'input[id*="nom" i]', 'input[id*="prenom" i]',
    'input[placeholder*="nom" i]', 'input[placeholder*="prénom" i]',
    'input[data-testid*="name" i]'
  ],
  phone: [
    'input[type="tel"]',
    'input[name*="phone" i]', 'input[name*="tel" i]',
    'input[id*="phone" i]', 'input[id*="tel" i]',
    'input[placeholder*="tél" i]', 'input[placeholder*="phone" i]'
  ],
  message: [
    'textarea[name*="message" i]', 'textarea[name*="lettre" i]', 'textarea[name*="motivation" i]',
    'textarea[name*="cover" i]', 'textarea[id*="message" i]', 'textarea[id*="lettre" i]',
    'textarea[placeholder*="message" i]', 'textarea[data-testid*="cover" i]',
    'textarea'
  ]
}

async function fillFieldExternal(page, selectors, value) {
  if (!value) return false
  for (const sel of selectors) {
    try {
      const el = await page.$(sel)
      if (el) {
        const visible = await page.evaluate((e) => {
          const rect = e.getBoundingClientRect()
          const style = window.getComputedStyle(e)
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        }, el)
        if (!visible) { await el.dispose(); continue }
        await el.click({ clickCount: 3 })
        await el.type(value, { delay: 40 })
        await el.dispose()
        return true
      }
    } catch (_) {}
  }
  return false
}

async function clickSubmitExternal(page) {
  const patterns = ['Postuler', 'Envoyer', 'Candidater', 'Submit', 'Apply', 'Valider', 'Soumettre', 'Envoyer ma candidature', 'Postuler maintenant', 'Apply now']
  for (const text of patterns) {
    try {
      const clicked = await page.evaluate((t) => {
        const nodes = document.querySelectorAll('button, input[type="submit"], input[type="button"], a, [role="button"], [data-testid]')
        for (const n of nodes) {
          const label = (n.innerText || n.textContent || n.value || n.getAttribute('aria-label') || '').toLowerCase()
          if (label.includes(t.toLowerCase()) && n.offsetParent !== null) {
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
    const btn = await page.$('button[type="submit"], input[type="submit"], [data-testid*="submit" i], [data-testid*="apply" i]')
    if (btn) {
      await btn.click()
      await btn.dispose()
      return true
    }
  } catch (_) {}
  return false
}

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
    await new Promise((r) => setTimeout(r, 2500))
    const finalUrl = page.url()
    const isExternal = finalUrl && /indeed|linkedin|hellowork|monster|pole-emploi|chooseyourboss|welcometothejungle|jobteaser|regionsjob|cadremploi/i.test(finalUrl)
    if (isExternal) await new Promise((r) => setTimeout(r, 3000))

    try {
      const title = await page.title()
      console.log('[applyWithBrowser] page ouverte', { jobUrl, title })
    } catch (_) {
      console.log('[applyWithBrowser] page ouverte', { jobUrl })
    }

    const { fullName, email, phone, coverLetter } = getCandidateData(profile)

    let filled = 0
    if (email) { if (await fillField(page, SELECTORS.email, email)) filled++ }
    if (fullName) { if (await fillField(page, SELECTORS.name, fullName)) filled++ }
    if (phone) { if (await fillField(page, SELECTORS.phone, phone)) filled++ }
    if (coverLetter) { if (await fillField(page, SELECTORS.message, coverLetter.slice(0, 2000))) filled++ }

    let submitted = await clickSubmit(page)
    if (!submitted && filled === 0 && isExternal) {
      await new Promise((r) => setTimeout(r, 1500))
      if (email) { if (await fillFieldExternal(page, EXTERNAL_SELECTORS.email, email)) filled++ }
      if (fullName) { if (await fillFieldExternal(page, EXTERNAL_SELECTORS.name, fullName)) filled++ }
      if (phone) { if (await fillFieldExternal(page, EXTERNAL_SELECTORS.phone, phone)) filled++ }
      if (coverLetter) { if (await fillFieldExternal(page, EXTERNAL_SELECTORS.message, coverLetter.slice(0, 2000))) filled++ }
      submitted = await clickSubmitExternal(page)
    }
    await new Promise((r) => setTimeout(r, 3500))

    let verification = await detectConfirmationPage(page)
    if (!verification.confirmed && submitted) {
      const pages = await browser.pages()
      for (const p of pages) {
        if (p === page) continue
        try {
          const v = await detectConfirmationPage(p)
          if (v.confirmed) {
            verification = v
            console.log('[applyWithBrowser] confirmation détectée dans un autre onglet', { jobUrl, afterUrl: v.url })
            break
          }
        } catch (_) {}
      }
    }
    if (verification.confirmed) {
      console.log('[applyWithBrowser] confirmation détectée (candidature bien partie)', {
        jobUrl,
        afterUrl: verification.url,
        excerpt: verification.excerpt?.slice(0, 120)
      })
    } else if (submitted) {
      console.log('[applyWithBrowser] bouton cliqué mais aucune page de confirmation détectée', {
        jobUrl,
        afterUrl: verification.url,
        pageExcerpt: (verification.excerpt || '').slice(0, 250)
      })
    }

    await browser.close()

    if (submitted) {
      const verified = verification.confirmed
      const msg = verified
        ? `Candidature envoyée et confirmée (${filled} champ(s) rempli(s)).`
        : `Candidature soumise (${filled} champ(s)). La plateforme peut t'envoyer un email de confirmation à ton adresse.`
      if (!verified) {
        console.log('[applyWithBrowser] formulaire soumis, pas de confirmation page — considéré comme envoyé', { jobUrl, filled })
      }
      return {
        success: true,
        verified: !!verified,
        message: msg,
        afterSubmitUrl: verification.url || undefined
      }
    }
    if (filled > 0) {
      const error = 'Champs remplis mais bouton de soumission non trouvé.'
      console.log('[applyWithBrowser] partiel sans submit', { jobUrl, filled, error })
      return { success: false, error, message: `${filled} champ(s) rempli(s).` }
    }
    const error = 'Aucun formulaire de candidature détecté sur cette page.'
    console.log('[applyWithBrowser] aucun formulaire détecté', { jobUrl, error })
    return { success: false, error }
  } catch (err) {
    if (browser) try { await browser.close() } catch (_) {}
    console.warn('[applyWithBrowser] erreur', { jobUrl, error: err.message || String(err) })
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Lance l'automatisation pour une liste d'offres. Limite le nombre par batch.
 */
const ALLOWED_SOURCES = ['lba', 'internal', 'manual', 'adzuna', 'lba_v1', 'lba_v3', 'france_travail', 'google', 'other']
function mapSourceForDb(source) {
  const s = (source || 'adzuna').toLowerCase()
  if (ALLOWED_SOURCES.includes(s)) return s
  if (s.includes('adzuna')) return 'adzuna'
  if (s.includes('lba')) return 'lba_v1'
  if (s.includes('france') || s.includes('travail')) return 'france_travail'
  return 'other'
}

export async function applyToOffersWithBrowser(offers, profile, maxApplications = 5) {
  const results = []
  const list = offers.slice(0, Math.max(1, maxApplications))
  for (let i = 0; i < list.length; i++) {
    const offer = list[i]
    const url = offer.url || offer.href
    if (!url) continue
    let result = await applyWithBrowser(url, profile)
    if (!result.success && result.error) {
      await new Promise((r) => setTimeout(r, 2000))
      const retry = await applyWithBrowser(url, profile)
      if (retry.success) result = retry
    }
    const source = mapSourceForDb(offer.source)
    results.push({ name: offer.name || offer.label, url, source, ...result })
    if (i < list.length - 1) await new Promise((r) => setTimeout(r, 3000))
  }
  return results
}
