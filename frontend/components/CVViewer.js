'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getColorById, getTemplateById, CV_COLORS, CV_TEMPLATES } from '../lib/cvTemplates'

export default function CVViewer({ cvData, photoUrl, onClose }) {
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const downloadPDF = async () => {
    setGeneratingPDF(true)
    try {
      const element = document.getElementById('cv-content')
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save('cv_optimise.pdf')
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (!cvData) return null

  const {
    personal_info = {},
    professional_summary,
    experience = [],
    education = [],
    skills = [],
    keywords = [],
    template: templateId,
    accentColor
  } = cvData

  const template = getTemplateById(templateId || 'moderne')
  const color = getColorById(accentColor || 'blue')
  const cssVars = {
    '--cv-primary': color.primary,
    '--cv-secondary': color.secondary,
    '--cv-primary-light': color.primary + '20'
  }

  const contactLine = [personal_info.contact, personal_info.location].filter(Boolean).join(' · ')
  const photoEl = photoUrl ? (
    <img
      src={photoUrl}
      alt=""
      className="object-cover rounded-lg shadow-sm border border-gray-200"
      style={{ width: 96, height: 120 }}
      crossOrigin="anonymous"
    />
  ) : null

  const sectionTitle = (title) => {
    if (template.id === 'moderne') {
      return (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 mt-8 first:mt-0 border-b border-gray-200 pb-1.5">
          {title}
        </h3>
      )
    }
    if (template.id === 'tech') {
      return (
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 mt-6 first:mt-0" style={{ color: color.primary }}>
          {title}
        </h3>
      )
    }
    if (template.id === 'elegant') {
      return (
        <h3 className="text-sm font-bold text-gray-800 mb-2 mt-6 first:mt-0 border-l-4 pl-3" style={{ borderColor: color.primary }}>
          {title}
        </h3>
      )
    }
    if (template.id === 'creatif') {
      return (
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 mt-6 first:mt-0 px-3 py-1.5 rounded-r-md text-white" style={{ backgroundColor: color.primary }}>
          {title}
        </h3>
      )
    }
    return <h3 className="text-sm font-semibold text-gray-800 mb-2 mt-6">{title}</h3>
  }

  const skillsList = skills && skills.length > 0 ? (
    <ul className="text-sm text-gray-700 leading-relaxed list-none space-y-0.5">
      {skills.map((s, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color.primary }} />
          {s}
        </li>
      ))}
    </ul>
  ) : null

  const keywordsList = keywords && keywords.length > 0 ? (
    <p className="text-sm text-gray-600 leading-relaxed">
      {keywords.join(' · ')}
    </p>
  ) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 page-root">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gray-900 text-white px-4 py-3 flex-shrink-0 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">CV — {template.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {generatingPDF ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Génération…
                </>
              ) : (
                <>📄 Télécharger PDF</>
              )}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100"
            >
              ✕ Fermer
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-56px)] bg-gray-50">
          <div
            id="cv-content"
            className="bg-white text-gray-800 mx-auto max-w-[210mm] min-h-[297mm] shadow-sm"
            style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', ...cssVars }}
          >
            {/* Template Tech: 2 colonnes sidebar + contenu */}
            {template.id === 'tech' && (
              <div className="flex min-h-[297mm]">
                <aside className="w-[36%] flex-shrink-0 p-6 text-white" style={{ backgroundColor: color.primary }}>
                  <h1 className="text-xl font-bold leading-tight mb-1">{personal_info.name}</h1>
                  <p className="text-white/90 text-sm font-medium mb-6">{personal_info.title}</p>
                  {photoEl && <div className="mb-6 rounded-lg overflow-hidden">{photoEl}</div>}
                  {contactLine && (
                    <div className="text-sm text-white/90 whitespace-pre-wrap mb-6">{contactLine}</div>
                  )}
                  {sectionTitle('Compétences')}
                  {skillsList}
                  {keywordsList && (
                    <>
                      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 mt-6 text-white/80">Mots-clés</h3>
                      {keywordsList}
                    </>
                  )}
                </aside>
                <main className="flex-1 p-8">
                  {professional_summary && (
                    <>
                      {sectionTitle('Profil')}
                      <p className="text-sm text-gray-700 leading-relaxed">{professional_summary}</p>
                    </>
                  )}
                  {experience.length > 0 && (
                    <>
                      {sectionTitle('Expérience')}
                      <div className="space-y-5">
                        {experience.map((exp, i) => (
                          <div key={i}>
                            <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                            <p className="text-sm font-medium mb-1" style={{ color: color.primary }}>{exp.company} · {exp.period}</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {education.length > 0 && (
                    <>
                      {sectionTitle('Formation')}
                      <div className="space-y-3">
                        {education.map((edu, i) => (
                          <div key={i} className="flex justify-between gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                              <p className="text-sm text-gray-600">{edu.school}</p>
                            </div>
                            <span className="text-sm font-medium flex-shrink-0" style={{ color: color.primary }}>{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </main>
              </div>
            )}

            {/* Templates 1 colonne: Moderne, Élégant, Créatif */}
            {template.id !== 'tech' && (
              <div className="p-8 md:p-10">
                <header className="mb-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {personal_info.name}
                      </h1>
                      <p className="text-lg font-medium mt-1" style={{ color: color.primary }}>
                        {personal_info.title}
                      </p>
                      {contactLine && (
                        <p className="text-sm text-gray-600 mt-2">{contactLine}</p>
                      )}
                    </div>
                    {photoEl && <div className="flex-shrink-0">{photoEl}</div>}
                  </div>
                </header>

                {professional_summary && (
                  <>
                    {sectionTitle('Profil professionnel')}
                    <p className="text-sm text-gray-700 leading-relaxed">{professional_summary}</p>
                  </>
                )}

                {experience.length > 0 && (
                  <>
                    {sectionTitle('Expérience professionnelle')}
                    <div className="space-y-5">
                      {experience.map((exp, i) => (
                        <div key={i} className={template.id === 'creatif' ? 'p-4 rounded-lg bg-gray-50 border border-gray-100' : ''}>
                          <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                          <p className="text-sm font-medium mb-1" style={{ color: color.primary }}>{exp.company} · {exp.period}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {education.length > 0 && (
                  <>
                    {sectionTitle('Formation')}
                    <div className="space-y-3">
                      {education.map((edu, i) => (
                        <div key={i} className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                            <p className="text-sm text-gray-600">{edu.school}</p>
                          </div>
                          <span className="text-sm font-medium flex-shrink-0" style={{ color: color.primary }}>{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {skills.length > 0 && (
                  <>
                    {sectionTitle('Compétences')}
                    {skillsList}
                  </>
                )}

                {keywordsList && (
                  <>
                    {sectionTitle('Mots-clés')}
                    {keywordsList}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { CV_COLORS, CV_TEMPLATES }
