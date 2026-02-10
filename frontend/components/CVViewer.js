'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function CVViewer({ cvData, onClose }) {
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

  const { personal_info, professional_summary, experience, education, skills, keywords } = cvData

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">CV Optimisé</h2>
            <div className="flex space-x-2">
              <button
                onClick={downloadPDF}
                disabled={generatingPDF}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 flex items-center space-x-2"
              >
                {generatingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    <span>Télécharger PDF</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30"
              >
                ✕ Fermer
              </button>
            </div>
          </div>
        </div>

        {/* CV Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div id="cv-content" className="p-8 bg-white">
            {/* Personal Info */}
            <div className="border-b-4 border-blue-600 pb-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {personal_info.name}
              </h1>
              <h2 className="text-xl text-blue-600 font-semibold mb-4">
                {personal_info.title}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {personal_info.contact && (
                  <span>📧 {personal_info.contact}</span>
                )}
                {personal_info.location && (
                  <span>📍 {personal_info.location}</span>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            {professional_summary && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-1">
                  💼 PROFIL PROFESSIONNEL
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {professional_summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                  💼 EXPÉRIENCE PROFESSIONNELLE
                </h3>
                <div className="space-y-6">
                  {experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-md font-semibold text-gray-800">
                        {exp.position}
                      </h4>
                      <p className="text-blue-600 font-medium mb-2">
                        {exp.company} • {exp.period}
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                  🎓 FORMATION
                </h3>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {edu.degree}
                        </h4>
                        <p className="text-gray-600">
                          {edu.school}
                        </p>
                      </div>
                      <span className="text-blue-600 font-medium">
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                  🛠️ COMPÉTENCES
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {keywords && keywords.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-1">
                  🔍 MOTS-CLÉS OPTIMISÉS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
