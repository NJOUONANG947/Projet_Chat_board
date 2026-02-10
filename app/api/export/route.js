import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request) {
  try {
    const body = await request.json()
    const { cvData, template } = body

    if (!cvData) {
      return NextResponse.json({ error: 'Données CV requises' }, { status: 400 })
    }

    // Generate HTML from CV data
    const htmlContent = generateCVHTML(cvData, template)

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set content and generate PDF
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })

    await browser.close()

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CV_${cvData.personal?.firstName || 'User'}_${cvData.personal?.lastName || ''}.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF Export Error:', error)
    return NextResponse.json({
      error: 'Erreur lors de l\'export PDF'
    }, { status: 500 })
  }
}

function generateCVHTML(cvData, template = 'modern') {
  const templates = {
    modern: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    classic: {
      primaryColor: '#000000',
      secondaryColor: '#666666',
      fontFamily: 'Times New Roman, serif'
    },
    minimal: {
      primaryColor: '#374151',
      secondaryColor: '#9ca3af',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    creative: {
      primaryColor: '#7c3aed',
      secondaryColor: '#a855f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }

  const theme = templates[template] || templates.modern

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV - ${cvData.personal?.firstName || ''} ${cvData.personal?.lastName || ''}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: ${theme.fontFamily};
          line-height: 1.6;
          color: #374151;
          background: white;
        }

        .cv-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${theme.primaryColor};
        }

        .name {
          font-size: 32px;
          font-weight: bold;
          color: ${theme.primaryColor};
          margin-bottom: 10px;
        }

        .contact {
          font-size: 14px;
          color: ${theme.secondaryColor};
          margin-bottom: 5px;
        }

        .section {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: ${theme.primaryColor};
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid ${theme.secondaryColor};
        }

        .experience-item, .education-item {
          margin-bottom: 20px;
        }

        .job-title {
          font-size: 16px;
          font-weight: bold;
          color: ${theme.primaryColor};
        }

        .company, .school {
          font-size: 14px;
          color: ${theme.secondaryColor};
          margin-bottom: 5px;
        }

        .date {
          font-size: 12px;
          color: ${theme.secondaryColor};
          font-style: italic;
        }

        .description {
          margin-top: 8px;
          font-size: 14px;
          line-height: 1.5;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .skill-item {
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
          text-align: center;
        }

        .languages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .language-item {
          text-align: center;
        }

        .language-name {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .language-level {
          font-size: 12px;
          color: ${theme.secondaryColor};
        }

        @media print {
          body {
            font-size: 12px;
          }

          .cv-container {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <!-- Header -->
        <div class="header">
          <div class="name">
            ${cvData.personal?.firstName || ''} ${cvData.personal?.lastName || ''}
          </div>
          <div class="contact">
            ${cvData.personal?.email || ''} ${cvData.personal?.phone ? '• ' + cvData.personal.phone : ''}
          </div>
          ${cvData.personal?.address ? `<div class="contact">${cvData.personal.address}</div>` : ''}
          <div class="contact">
            ${cvData.personal?.linkedin ? cvData.personal.linkedin + ' • ' : ''}
            ${cvData.personal?.website || ''}
          </div>
        </div>

        <!-- Summary -->
        ${cvData.summary ? `
          <div class="section">
            <div class="section-title">Profil Professionnel</div>
            <p class="description">${cvData.summary}</p>
          </div>
        ` : ''}

        <!-- Experience -->
        ${cvData.experience && cvData.experience.length > 0 ? `
          <div class="section">
            <div class="section-title">Expérience Professionnelle</div>
            ${cvData.experience.map(exp => `
              <div class="experience-item">
                <div class="job-title">${exp.position || ''}</div>
                <div class="company">${exp.company || ''}</div>
                <div class="date">${exp.startDate || ''} - ${exp.endDate || 'Présent'}</div>
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Education -->
        ${cvData.education && cvData.education.length > 0 ? `
          <div class="section">
            <div class="section-title">Formation</div>
            ${cvData.education.map(edu => `
              <div class="education-item">
                <div class="job-title">${edu.degree || ''}</div>
                <div class="school">${edu.school || ''}</div>
                <div class="date">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Skills -->
        ${cvData.skills && cvData.skills.length > 0 ? `
          <div class="section">
            <div class="section-title">Compétences</div>
            <div class="skills-grid">
              ${cvData.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Languages -->
        ${cvData.languages && cvData.languages.length > 0 ? `
          <div class="section">
            <div class="section-title">Langues</div>
            <div class="languages-grid">
              ${cvData.languages.map(lang => `
                <div class="language-item">
                  <div class="language-name">${lang.name || ''}</div>
                  <div class="language-level">${lang.level || ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `
}
