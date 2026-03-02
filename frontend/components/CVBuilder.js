'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function CVBuilder({ onSave, onCancel }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [cvData, setCvData] = useState({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      website: '',
      photo: '',       // base64 data URL
      jobTitle: ''     // Intitulé du poste visé
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    interests: '',     // Centres d'intérêt (normes françaises)
    template: 'modern'
  })

  const steps = [
    { id: 'personal', title: 'État civil', icon: '' },
    { id: 'summary', title: 'Profil professionnel', icon: '' },
    { id: 'experience', title: 'Expérience professionnelle', icon: '' },
    { id: 'education', title: 'Formation', icon: '' },
    { id: 'skills', title: 'Compétences', icon: '' },
    { id: 'languages', title: 'Langues', icon: '' },
    { id: 'interests', title: 'Centres d\'intérêt', icon: '' },
    { id: 'template', title: 'Design / Modèle', icon: '' },
    { id: 'preview', title: 'Aperçu', icon: '' }
  ]

  const templates = [
    { id: 'classic', name: 'Classique', description: 'Mise en page traditionnelle, photo à droite, normes AFNOR' },
    { id: 'modern', name: 'Moderne', description: 'En-tête avec photo, sections aérées' },
    { id: 'minimal', name: 'Minimal', description: 'Très épuré, sans fioritures' },
    { id: 'creative', name: 'Créatif', description: 'Barre latérale colorée, design dynamique' },
    { id: 'pro', name: 'Pro (2 colonnes)', description: 'Template éditorial : sidebar 33% + contenu principal, timeline, imprimable' }
  ]

  const updateCvData = (section, data) => {
    setCvData(prev => ({
      ...prev,
      [section]: data
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = () => {
    onSave(cvData)
  }

  const downloadPDF = async () => {
    try {
      const element = document.getElementById('cv-preview')
      if (!element) {
        throw new Error('Élément CV non trouvé')
      }

      console.log('Starting PDF generation...')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        imageTimeout: 0,
        onclone: (clonedDoc, el) => {
          const imgs = el.getElementsByTagName('img')
          for (let i = 0; i < imgs.length; i++) {
            if (imgs[i].src && imgs[i].src.startsWith('data:')) imgs[i].crossOrigin = 'anonymous'
          }
        }
      })

      console.log('Canvas created, creating PDF...')

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      console.log('PDF created, saving...')
      pdf.save('cv_preview.pdf')
      console.log('PDF saved successfully')

    } catch (error) {
      console.error('PDF generation error:', error)
      alert(`Erreur lors de la génération du PDF: ${error.message}`)
    }
  }

  const PHOTO_W = 120
  const PHOTO_H = 150

  const sectionTitle = (title, template) => {
    const base = 'font-bold text-gray-800 mb-2'
    if (template === 'classic') return <h3 className={`${base} text-sm uppercase tracking-wider border-b-2 border-gray-400 pb-1`}>{title}</h3>
    if (template === 'creative') return <h3 className={`${base} text-xs uppercase tracking-widest text-white bg-blue-900 px-3 py-1.5 rounded-r`}>{title}</h3>
    if (template === 'minimal') return <h3 className={`${base} text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1`}>{title}</h3>
    return <h3 className={`${base} text-sm border-l-4 border-blue-900 pl-2`}>{title}</h3>
  }

  const renderCVPreview = () => {
    const p = cvData.personal
    const t = cvData.template

    const contactBlock = (
      <>
        {p.email && <p>📧 {p.email}</p>}
        {p.phone && <p>📱 {p.phone}</p>}
        {p.address && <p>📍 {p.address}</p>}
        {p.linkedin && <p>🔗 {p.linkedin}</p>}
        {p.website && <p>🌐 {p.website}</p>}
      </>
    )

    const photoEl = p.photo ? (
      <img
        src={p.photo}
        alt=""
        className="object-cover border-2 border-white shadow-md"
        style={{ width: PHOTO_W, height: PHOTO_H }}
        crossOrigin="anonymous"
      />
    ) : null

    if (t === 'classic') {
      return (
        <div id="cv-preview" className="bg-white" style={{ width: 595, minHeight: 842, fontFamily: 'Georgia, "Times New Roman", serif' }}>
          <div className="bg-blue-900 text-white px-8 py-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{p.firstName} {p.lastName}</h1>
                {p.jobTitle && <p className="text-blue-100 mt-1 text-lg">{p.jobTitle}</p>}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-blue-100">{contactBlock}</div>
              </div>
              {photoEl && <div className="flex-shrink-0 rounded overflow-hidden shadow-lg" style={{ width: PHOTO_W, height: PHOTO_H }}>{photoEl}</div>}
            </div>
          </div>
          <div className="px-8 py-6 text-gray-800 text-sm">
            {cvData.summary && <div className="mb-6"><div className="border-b-2 border-gray-400 pb-1 font-bold uppercase tracking-wider text-gray-800">Profil professionnel</div><p className="mt-2 leading-relaxed">{cvData.summary}</p></div>}
            {cvData.education.length > 0 && <div className="mb-6"><div className="border-b-2 border-gray-400 pb-1 font-bold uppercase tracking-wider text-gray-800">Formation</div><div className="mt-2 space-y-2">{cvData.education.map((edu, i) => <div key={i}><span className="font-semibold">{edu.degree}</span> – {edu.school} {edu.year && `(${edu.year})`} {edu.location && `, ${edu.location}`}</div>)}</div></div>}
            {cvData.experience.length > 0 && <div className="mb-6"><div className="border-b-2 border-gray-400 pb-1 font-bold uppercase tracking-wider text-gray-800">Expérience professionnelle</div><div className="mt-2 space-y-3">{cvData.experience.map((exp, i) => <div key={i}><span className="font-semibold">{exp.position}</span> – {exp.company} {exp.period && `(${exp.period})`}{exp.description && <p className="mt-1 text-gray-700">{exp.description}</p>}</div>)}</div></div>}
            {cvData.skills.length > 0 && <div className="mb-6"><div className="border-b-2 border-gray-400 pb-1 font-bold uppercase tracking-wider text-gray-800">Compétences</div><p className="mt-2">{cvData.skills.join(' • ')}</p></div>}
            {cvData.languages.length > 0 && <div className="mb-6"><div className="border-b-2 border-gray-400 pb-1 font-bold uppercase tracking-wider text-gray-800">Langues</div><p className="mt-2">{cvData.languages.map(l => `${l.name} (${l.level})`).join(' – ')}</p></div>}
            {cvData.interests && <div className="mb-6"><div className="border-b-2 border-gray-400 pb-1 font-bold uppercase tracking-wider text-gray-800">Centres d&apos;intérêt</div><p className="mt-2">{cvData.interests}</p></div>}
          </div>
        </div>
      )
    }

    if (t === 'modern') {
      return (
        <div id="cv-preview" className="bg-white flex" style={{ width: 595, minHeight: 842 }}>
          <div className="w-44 flex-shrink-0 bg-blue-900 text-white p-5">
            {photoEl && <div className="rounded-lg overflow-hidden shadow-lg mx-auto mb-5" style={{ width: PHOTO_W, height: PHOTO_H }}>{photoEl}</div>}
            <div className="text-xs space-y-3">
              <div className="font-bold uppercase tracking-widest text-blue-200 text-[10px]">Coordonnées</div>
              <div className="space-y-1">{contactBlock}</div>
              {cvData.skills.length > 0 && <div><div className="font-bold uppercase tracking-widest text-blue-200 text-[10px]">Compétences</div><p className="mt-1 text-[11px] leading-snug">{cvData.skills.join(', ')}</p></div>}
              {cvData.languages.length > 0 && <div><div className="font-bold uppercase tracking-widest text-blue-200 text-[10px]">Langues</div><p className="mt-1 text-[11px]">{cvData.languages.map(l => `${l.name} (${l.level})`).join(', ')}</p></div>}
            </div>
          </div>
          <div className="flex-1 p-6 text-gray-800">
            <h1 className="text-2xl font-bold text-gray-900">{p.firstName} {p.lastName}</h1>
            {p.jobTitle && <p className="text-blue-900 font-semibold mt-1">{p.jobTitle}</p>}
            <div className="h-1 w-16 bg-blue-900 mt-2 rounded" />
            {cvData.summary && <div className="mt-6"><h3 className="text-sm font-bold border-l-4 border-blue-900 pl-2 mb-2">Profil professionnel</h3><p className="text-sm leading-relaxed">{cvData.summary}</p></div>}
            {cvData.education.length > 0 && <div className="mt-5"><h3 className="text-sm font-bold border-l-4 border-blue-900 pl-2 mb-2">Formation</h3><div className="space-y-2 text-sm">{cvData.education.map((edu, i) => <div key={i} className="flex justify-between"><span><span className="font-semibold">{edu.degree}</span>, {edu.school}</span><span className="text-blue-900 font-medium">{edu.year}</span></div>)}</div></div>}
            {cvData.experience.length > 0 && <div className="mt-5"><h3 className="text-sm font-bold border-l-4 border-blue-900 pl-2 mb-2">Expérience professionnelle</h3><div className="space-y-3 text-sm">{cvData.experience.map((exp, i) => <div key={i}><h4 className="font-semibold">{exp.position}</h4><p className="text-blue-900 text-xs">{exp.company} • {exp.period}</p>{exp.description && <p className="mt-1 text-gray-700">{exp.description}</p>}</div>)}</div></div>}
            {cvData.interests && <div className="mt-5"><h3 className="text-sm font-bold border-l-4 border-blue-900 pl-2 mb-2">Centres d&apos;intérêt</h3><p className="text-sm">{cvData.interests}</p></div>}
          </div>
        </div>
      )
    }

    if (t === 'minimal') {
      return (
        <div id="cv-preview" className="bg-white px-10 py-8" style={{ width: 595, minHeight: 842 }}>
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{p.firstName} {p.lastName}</h1>
              {p.jobTitle && <p className="text-gray-500 mt-1">{p.jobTitle}</p>}
              <div className="mt-3 text-sm text-gray-600 space-y-0.5">{contactBlock}</div>
            </div>
            {photoEl && <div className="flex-shrink-0 rounded-full overflow-hidden border-4 border-gray-200" style={{ width: 100, height: 100 }}><img src={p.photo} alt="" className="object-cover w-full h-full" style={{ width: 100, height: 100 }} crossOrigin="anonymous" /></div>}
          </div>
          {cvData.summary && <div className="mt-8"><h3 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 font-bold">Profil professionnel</h3><p className="mt-2 text-sm text-gray-700 leading-relaxed">{cvData.summary}</p></div>}
          {cvData.education.length > 0 && <div className="mt-8"><h3 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 font-bold">Formation</h3>{cvData.education.map((edu, i) => <div key={i} className="mt-2 flex justify-between text-sm"><span>{edu.degree}, {edu.school}</span><span className="text-gray-500">{edu.year}</span></div>)}</div>}
          {cvData.experience.length > 0 && <div className="mt-8"><h3 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 font-bold">Expérience professionnelle</h3>{cvData.experience.map((exp, i) => <div key={i} className="mt-2 text-sm"><span className="font-semibold">{exp.position}</span>, {exp.company}, {exp.period}. {exp.description && <span className="text-gray-600 block mt-0.5">{exp.description}</span>}</div>)}</div>}
          {cvData.skills.length > 0 && <div className="mt-8"><h3 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 font-bold">Compétences</h3><p className="mt-2 text-sm">{cvData.skills.join(', ')}</p></div>}
          {cvData.languages.length > 0 && <div className="mt-8"><h3 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 font-bold">Langues</h3><p className="mt-2 text-sm">{cvData.languages.map(l => `${l.name} (${l.level})`).join(' · ')}</p></div>}
          {cvData.interests && <div className="mt-8"><h3 className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 font-bold">Centres d&apos;intérêt</h3><p className="mt-2 text-sm">{cvData.interests}</p></div>}
        </div>
      )
    }

    if (t === 'creative') {
      return (
        <div id="cv-preview" className="bg-white flex" style={{ width: 595, minHeight: 842 }}>
          <div className="w-40 flex-shrink-0 bg-blue-900 text-white p-4">
            {photoEl && <div className="rounded-lg overflow-hidden border-2 border-white shadow mb-4" style={{ width: 112, height: 140 }}><img src={p.photo} alt="" className="object-cover w-full h-full" style={{ width: 112, height: 140 }} crossOrigin="anonymous" /></div>}
            <div className="text-[10px] space-y-3 text-blue-100">
              <div className="font-bold uppercase tracking-wider">Contact</div>
              <div className="space-y-0.5">{contactBlock}</div>
              {cvData.skills.length > 0 && <div><div className="font-bold uppercase tracking-wider">Compétences</div><p className="mt-1">{cvData.skills.join(', ')}</p></div>}
              {cvData.languages.length > 0 && <div><div className="font-bold uppercase tracking-wider">Langues</div><p className="mt-1">{cvData.languages.map(l => `${l.name} (${l.level})`).join(', ')}</p></div>}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="border-l-4 border-blue-900 pl-4">
              <h1 className="text-2xl font-bold text-gray-900">{p.firstName} {p.lastName}</h1>
              {p.jobTitle && <p className="text-blue-900 font-semibold mt-0.5">{p.jobTitle}</p>}
            </div>
            {cvData.summary && <div className="mt-6"><h3 className="text-xs font-bold uppercase tracking-widest text-white bg-blue-900 px-3 py-1 rounded-r mb-2">Profil professionnel</h3><p className="text-sm text-gray-700">{cvData.summary}</p></div>}
            {cvData.education.length > 0 && <div className="mt-5"><h3 className="text-xs font-bold uppercase tracking-widest text-white bg-blue-900 px-3 py-1 rounded-r mb-2">Formation</h3>{cvData.education.map((edu, i) => <div key={i} className="text-sm flex justify-between mt-1"><span>{edu.degree}, {edu.school}</span><span className="font-medium">{edu.year}</span></div>)}</div>}
            {cvData.experience.length > 0 && <div className="mt-5"><h3 className="text-xs font-bold uppercase tracking-widest text-white bg-blue-900 px-3 py-1 rounded-r mb-2">Expérience professionnelle</h3>{cvData.experience.map((exp, i) => <div key={i} className="text-sm mt-1"><span className="font-semibold">{exp.position}</span> – {exp.company} ({exp.period}){exp.description && <p className="text-gray-600 mt-0.5">{exp.description}</p>}</div>)}</div>}
            {cvData.interests && <div className="mt-5"><h3 className="text-xs font-bold uppercase tracking-widest text-white bg-blue-900 px-3 py-1 rounded-r mb-2">Centres d&apos;intérêt</h3><p className="text-sm">{cvData.interests}</p></div>}
          </div>
        </div>
      )
    }

    if (t === 'pro') {
      const descriptionToBullets = (text) => {
        if (!text || !String(text).trim()) return []
        return String(text)
          .split(/\n|(?<=[.!?])\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 0)
      }
      return (
        <div id="cv-preview" className="bg-white text-gray-900" style={{ width: 595, minHeight: 842, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32% 1fr', minHeight: 842 }}>
            {/* Colonne gauche — 30–35% : infos secondaires */}
            <div className="bg-zinc-100 border-r border-zinc-200 flex flex-col" style={{ padding: '24px 20px' }}>
              {/* Photo circulaire */}
              <div className="flex justify-center mb-4">
                {p.photo ? (
                  <div className="rounded-full overflow-hidden border-2 border-zinc-300 shadow-sm" style={{ width: 100, height: 100 }}>
                    <img src={p.photo} alt="" className="object-cover w-full h-full" style={{ width: 100, height: 100 }} crossOrigin="anonymous" />
                  </div>
                ) : (
                  <div className="rounded-full bg-zinc-300 border-2 border-zinc-400 flex items-center justify-center text-zinc-500 text-2xl" style={{ width: 100, height: 100 }}>👤</div>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 text-center leading-tight" style={{ fontSize: '18px', lineHeight: 1.25 }}>
                {p.firstName} {p.lastName}
              </h1>
              {p.jobTitle && <p className="text-center text-zinc-600 text-sm mt-1 mb-4" style={{ fontSize: '12px' }}>{p.jobTitle}</p>}
              {/* Coordonnées avec icônes */}
              <div className="space-y-2 mb-6" style={{ fontSize: '11px' }}>
                {p.email && <div className="flex items-start gap-2"><span className="text-zinc-500 flex-shrink-0">📧</span><span className="break-all">{p.email}</span></div>}
                {p.phone && <div className="flex items-start gap-2"><span className="text-zinc-500 flex-shrink-0">📱</span><span>{p.phone}</span></div>}
                {p.address && <div className="flex items-start gap-2"><span className="text-zinc-500 flex-shrink-0">📍</span><span>{p.address}</span></div>}
                {p.linkedin && <div className="flex items-start gap-2"><span className="text-zinc-500 flex-shrink-0">🔗</span><span className="break-all">{p.linkedin}</span></div>}
                {p.website && <div className="flex items-start gap-2"><span className="text-zinc-500 flex-shrink-0">🌐</span><span className="break-all">{p.website}</span></div>}
              </div>
              {/* Formation */}
              {cvData.education.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-zinc-400 pb-1 mb-2" style={{ fontSize: '10px' }}>Formation</h2>
                  <div className="space-y-3">
                    {cvData.education.map((edu, i) => (
                      <div key={i}>
                        <div className="font-semibold text-gray-900" style={{ fontSize: '11px' }}>{edu.degree}</div>
                        <div className="text-zinc-600" style={{ fontSize: '10px' }}>{edu.school}</div>
                        {edu.year && <div className="text-zinc-500" style={{ fontSize: '10px' }}>{edu.year}{edu.location ? ` · ${edu.location}` : ''}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Compétences */}
              {cvData.skills.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-zinc-400 pb-1 mb-2" style={{ fontSize: '10px' }}>Compétences</h2>
                  <p className="text-zinc-700 leading-snug" style={{ fontSize: '11px' }}>{cvData.skills.join(' · ')}</p>
                </div>
              )}
              {/* Langues */}
              {cvData.languages.length > 0 && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-zinc-400 pb-1 mb-2" style={{ fontSize: '10px' }}>Langues</h2>
                  <ul className="space-y-0.5" style={{ fontSize: '11px' }}>
                    {cvData.languages.map((l, i) => <li key={i} className="text-zinc-700">{l.name} — {l.level}</li>)}
                  </ul>
                </div>
              )}
              {/* Centres d'intérêt */}
              {cvData.interests && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-zinc-400 pb-1 mb-2" style={{ fontSize: '10px' }}>Centres d&apos;intérêt</h2>
                  <p className="text-zinc-700 leading-snug" style={{ fontSize: '11px' }}>{cvData.interests}</p>
                </div>
              )}
            </div>
            {/* Colonne droite — 65–70% : contenu principal */}
            <div style={{ padding: '28px 32px' }}>
              {/* Profil professionnel */}
              {cvData.summary && (
                <div className="mb-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b-2 border-blue-900 pb-1.5 mb-3" style={{ fontSize: '12px' }}>Profil professionnel</h2>
                  <p className="text-gray-700 leading-relaxed" style={{ fontSize: '11px' }}>{cvData.summary}</p>
                </div>
              )}
              {/* Parcours professionnel — timeline */}
              {cvData.experience.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b-2 border-blue-900 pb-1.5 mb-4" style={{ fontSize: '12px' }}>Parcours professionnel</h2>
                  <div className="space-y-6">
                    {cvData.experience.map((exp, i) => {
                      const bullets = descriptionToBullets(exp.description)
                      return (
                        <div key={i} className="flex gap-4" style={{ minHeight: 0 }}>
                          <div className="flex-shrink-0 text-right text-zinc-600 font-medium" style={{ width: 88, fontSize: '10px' }}>
                            {exp.period || '—'}
                          </div>
                          <div className="flex-1 border-l-2 border-zinc-200 pl-4 pb-2">
                            <h3 className="font-bold text-gray-900" style={{ fontSize: '12px' }}>{exp.position}</h3>
                            <p className="text-blue-900 font-medium mt-0.5" style={{ fontSize: '11px' }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</p>
                            {bullets.length > 0 && (
                              <ul className="mt-2 space-y-1 list-disc pl-4" style={{ fontSize: '11px', color: '#374151' }}>
                                {bullets.map((b, j) => <li key={j} className="leading-snug">{b}</li>)}
                              </ul>
                            )}
                            {bullets.length === 0 && exp.description && (
                              <p className="mt-2 text-gray-700 leading-snug" style={{ fontSize: '11px' }}>{exp.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info - État civil (normes françaises)
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">État civil</h2>

            {/* Photo professionnelle */}
            <div className="flex flex-col sm:flex-row items-start gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                {cvData.personal.photo ? (
                  <div className="relative">
                    <img
                      src={cvData.personal.photo}
                      alt="Photo CV"
                      className="w-28 h-28 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => updateCvData('personal', { ...cvData.personal, photo: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-600 text-white rounded-full text-xs hover:bg-zinc-700"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-900 hover:bg-gray-100 transition-colors">
                    <span className="text-3xl text-gray-400 mb-1">📷</span>
                    <span className="text-xs text-gray-500 text-center px-1">Ajouter photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => updateCvData('personal', { ...cvData.personal, photo: reader.result })
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-700">Photo professionnelle (recommandée en France)</p>
                <p>Format portrait, fond neutre. JPG ou PNG, max 2 Mo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={cvData.personal.firstName}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={cvData.personal.lastName}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={cvData.personal.email}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="votre.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={cvData.personal.phone}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="+33 6 XX XX XX XX"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={cvData.personal.address}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={cvData.personal.linkedin}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="https://linkedin.com/in/votreprofil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Web</label>
                <input
                  type="url"
                  value={cvData.personal.website}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="https://votresite.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Intitulé du poste visé</label>
                <input
                  type="text"
                  value={cvData.personal.jobTitle}
                  onChange={(e) => updateCvData('personal', { ...cvData.personal, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  placeholder="Ex: Développeur Full Stack, Chef de projet..."
                />
              </div>
            </div>
          </div>
        )

      case 1: // Summary - Profil professionnel
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profil professionnel</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rédigez un résumé accrocheur (3 à 5 phrases), conforme aux usages français
              </label>
              <textarea
                value={cvData.summary}
                onChange={(e) => updateCvData('summary', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                placeholder="Professionnel expérimenté en... Passionné par... Spécialisé dans..."
              />
            </div>
          </div>
        )

      case 2: // Experience
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Expérience professionnelle</h2>
            <div className="space-y-4">
              {cvData.experience.map((exp, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Poste occupé"
                      value={exp.position}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].position = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                    <input
                      type="text"
                      placeholder="Entreprise"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].company = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                    <input
                      type="text"
                      placeholder="Période (ex: 2020 - 2023)"
                      value={exp.period}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].period = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                    <input
                      type="text"
                      placeholder="Lieu"
                      value={exp.location}
                      onChange={(e) => {
                        const newExp = [...cvData.experience]
                        newExp[index].location = e.target.value
                        updateCvData('experience', newExp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <textarea
                    placeholder="Description des missions et responsabilités"
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...cvData.experience]
                      newExp[index].description = e.target.value
                      updateCvData('experience', newExp)
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  />
                  <button
                    onClick={() => {
                      const newExp = cvData.experience.filter((_, i) => i !== index)
                      updateCvData('experience', newExp)
                    }}
                    className="mt-2 px-3 py-1 text-zinc-600 hover:text-zinc-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateCvData('experience', [...cvData.experience, {
                    position: '',
                    company: '',
                    period: '',
                    location: '',
                    description: ''
                  }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-900 hover:text-blue-900 transition-colors"
              >
                + Ajouter une expérience
              </button>
            </div>
          </div>
        )

      case 3: // Education
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Formation</h2>
            <div className="space-y-4">
              {cvData.education.map((edu, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Diplôme obtenu"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].degree = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                    <input
                      type="text"
                      placeholder="Établissement"
                      value={edu.school}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].school = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                    <input
                      type="text"
                      placeholder="Année d'obtention"
                      value={edu.year}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].year = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                    <input
                      type="text"
                      placeholder="Lieu"
                      value={edu.location}
                      onChange={(e) => {
                        const newEdu = [...cvData.education]
                        newEdu[index].location = e.target.value
                        updateCvData('education', newEdu)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newEdu = cvData.education.filter((_, i) => i !== index)
                      updateCvData('education', newEdu)
                    }}
                    className="mt-2 px-3 py-1 text-zinc-600 hover:text-zinc-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateCvData('education', [...cvData.education, {
                    degree: '',
                    school: '',
                    year: '',
                    location: ''
                  }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-900 hover:text-blue-900 transition-colors"
              >
                + Ajouter une formation
              </button>
            </div>
          </div>
        )

      case 4: // Skills
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Compétences</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listez vos compétences (séparées par des virgules)
              </label>
              <textarea
                value={cvData.skills.join(', ')}
                onChange={(e) => updateCvData('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                placeholder="JavaScript, React, Node.js, Python, SQL, Git..."
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {cvData.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )

      case 5: // Languages
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Langues</h2>
            <div className="space-y-4">
              {cvData.languages.map((lang, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    placeholder="Langue"
                    value={lang.name}
                    onChange={(e) => {
                      const newLang = [...cvData.languages]
                      newLang[index].name = e.target.value
                      updateCvData('languages', newLang)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => {
                      const newLang = [...cvData.languages]
                      newLang[index].level = e.target.value
                      updateCvData('languages', newLang)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                  >
                    <option value="">Niveau</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                    <option value="Courant">Courant</option>
                    <option value="Langue maternelle">Langue maternelle</option>
                  </select>
                  <button
                    onClick={() => {
                      const newLang = cvData.languages.filter((_, i) => i !== index)
                      updateCvData('languages', newLang)
                    }}
                    className="px-3 py-1 text-zinc-600 hover:text-zinc-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateCvData('languages', [...cvData.languages, { name: '', level: '' }])
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-900 hover:text-blue-900 transition-colors"
              >
                + Ajouter une langue
              </button>
            </div>
          </div>
        )

      case 6: // Centres d'intérêt (normes françaises)
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Centres d'intérêt</h2>
            <p className="text-gray-600 text-sm">
              Optionnel mais apprécié en France : loisirs, associations, sports, bénévolat...
            </p>
            <textarea
              value={cvData.interests}
              onChange={(e) => updateCvData('interests', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
              placeholder="Ex: Lecture, course à pied, bénévolat Restos du Cœur, photographie..."
            />
          </div>
        )

      case 7: // Template - choix comme sur Canva
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choisissez un modèle de CV</h2>
            <p className="text-gray-600 text-sm mb-6">Le design s&apos;appliquera à l&apos;aperçu et au PDF téléchargé. Votre photo sera incluse automatiquement.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => updateCvData('template', template.id)}
                  className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all min-w-0 ${
                    cvData.template === template.id
                      ? 'border-blue-900 ring-2 ring-blue-900/30'
                      : 'border-gray-200 hover:border-blue-900/50'
                  }`}
                >
                  <div className="aspect-[595/842] max-h-64 bg-gray-100 relative overflow-hidden">
                    {template.id === 'classic' && (
                      <>
                        <div className="absolute inset-x-0 top-0 h-12 bg-blue-900" />
                        <div className="absolute top-3 left-3 right-12 h-2 bg-white/80 rounded" />
                        <div className="absolute top-6 left-3 right-3 h-1 bg-white/60 rounded" />
                        <div className="absolute left-3 right-3 top-14 bottom-0 space-y-2">
                          <div className="h-1.5 w-full bg-gray-300 rounded" />
                          <div className="h-1.5 w-3/4 bg-gray-200 rounded" />
                          <div className="h-8 w-16 bg-gray-400 rounded absolute right-3 top-2" />
                        </div>
                      </>
                    )}
                    {template.id === 'modern' && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-14 bg-blue-900" />
                        <div className="absolute right-3 top-3 h-2 w-16 bg-gray-400 rounded" />
                        <div className="absolute left-16 top-4 right-3 h-1.5 bg-gray-700 rounded" />
                        <div className="absolute left-16 top-7 right-3 h-1 bg-gray-400 rounded" />
                        <div className="absolute left-16 top-12 right-3 space-y-1.5">
                          <div className="h-1 w-full border-l-4 border-blue-900 bg-gray-200 rounded-r" />
                          <div className="h-1 w-3/4 bg-gray-200 rounded" />
                        </div>
                      </>
                    )}
                    {template.id === 'minimal' && (
                      <>
                        <div className="absolute inset-x-3 top-3 h-1.5 bg-gray-800 rounded" />
                        <div className="absolute right-3 top-2 w-8 h-8 rounded-full bg-gray-300 border-2 border-gray-400" />
                        <div className="absolute left-3 top-8 right-12 h-0.5 bg-gray-400" />
                        <div className="absolute left-3 top-12 right-3 space-y-1">
                          <div className="h-0.5 w-full bg-gray-300 rounded" />
                          <div className="h-0.5 w-full bg-gray-200 rounded" />
                        </div>
                      </>
                    )}
                    {template.id === 'creative' && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-blue-900" />
                        <div className="absolute left-2 top-2 w-10 h-12 bg-white/20 rounded" />
                        <div className="absolute left-14 top-3 right-2 h-2 bg-gray-700 rounded" />
                        <div className="absolute left-14 top-6 right-2 h-1 bg-gray-500 rounded" />
                        <div className="absolute left-14 top-10 right-2 h-1.5 w-20 bg-blue-900 rounded-r" />
                        <div className="absolute left-14 top-14 right-2 h-1 bg-gray-200 rounded" />
                      </>
                    )}
                    {template.id === 'pro' && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-[32%] bg-gray-200" />
                        <div className="absolute left-[10%] top-3 w-8 h-8 rounded-full bg-gray-400" />
                        <div className="absolute left-[34%] top-2 right-2 h-1.5 bg-gray-600 rounded" style={{ width: '58%' }} />
                        <div className="absolute left-[34%] top-5 right-2 h-1 bg-gray-400 rounded" style={{ width: '45%' }} />
                        <div className="absolute left-[34%] top-8 right-2 border-l-2 border-blue-900 h-2 bg-gray-300 rounded-r" style={{ width: '50%' }} />
                        <div className="absolute left-[34%] top-12 right-2 flex gap-1">
                          <div className="w-10 h-0.5 bg-gray-400 rounded" />
                          <div className="flex-1 h-0.5 bg-gray-300 rounded" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-semibold text-gray-800">{template.name}</h3>
                    <p className="text-gray-600 text-xs mt-1">{template.description}</p>
                    {cvData.template === template.id && <p className="text-blue-900 text-xs font-medium mt-2">✓ Modèle sélectionné</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 8: // Preview - ordre normes françaises + 4 templates
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Aperçu de votre CV</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Modèle : <strong>{templates.find(t => t.id === cvData.template)?.name ?? cvData.template}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(7)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Changer le modèle
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 border border-blue-800 transition-colors flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Télécharger PDF (avec photo)</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">Le PDF exporté utilise le modèle sélectionné et inclut votre photo si vous en avez ajouté une.</p>
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8 max-w-full mx-auto overflow-x-auto min-w-0">
              <div className="inline-block min-w-0" style={{ minWidth: 0 }}>
                {renderCVPreview()}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="page-root cv-builder min-h-screen bg-gray-50 w-full min-w-0 overflow-x-hidden overflow-y-auto box-border">
      {/* Header — max-width fixe, centré */}
      <div className="bg-white shadow-sm border-b border-gray-200 w-full">
        <div className="w-full max-w-[1280px] min-w-0 mx-auto px-4 sm:px-6 py-4 box-border">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate min-w-0">Créateur de CV</h1>
            <button
              onClick={onCancel}
              className="flex-shrink-0 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
          </div>

          {/* Progress Steps — scroll horizontal interne si nécessaire, sans faire déborder la page */}
          <div className="mt-6 min-w-0 overflow-hidden">
            <div className="overflow-x-auto overflow-y-hidden pb-2 -mx-1" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex items-center gap-1 sm:gap-2 md:justify-between md:gap-0 w-max md:w-full min-w-0">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-shrink-0 md:min-w-0 md:flex-1 md:justify-center md:max-w-[140px]">
                    <div className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 ${
                      index <= currentStep ? 'bg-blue-900 text-white' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {index < currentStep ? '✓' : <span className="text-xs sm:text-sm font-medium">{step.icon || index + 1}</span>}
                    </div>
                    <span className={`ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium truncate max-w-[90px] sm:max-w-[110px] md:max-w-none ${
                      index <= currentStep ? 'text-blue-900' : 'text-zinc-500'
                    }`} title={step.title}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`hidden md:block flex-shrink-0 w-2 h-0.5 ml-1 ${
                        index < currentStep ? 'bg-blue-900' : 'bg-zinc-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content — max-width fixe, centré, contenu contenu */}
      <div className="w-full max-w-[1280px] min-w-0 mx-auto px-4 sm:px-6 py-8 box-border">
        <div className="max-w-4xl mx-auto min-w-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 min-w-0 overflow-hidden">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto flex justify-between mt-8 flex-wrap gap-3">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
          >
            Précédent
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 border border-zinc-600 transition-colors touch-target"
            >
              Sauvegarder le CV
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 border border-blue-800 transition-colors touch-target"
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
