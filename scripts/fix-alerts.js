const fs = require('fs')
const path = 'frontend/components/JobCampaigns.js'
let s = fs.readFileSync(path, 'utf8')
if (s.includes("alert('Indique l")) {
  s = s.replace("alert('Indique l'adresse mail sur laquelle tu veux recevoir les réponses (champ « Quelle adresse mail pour cette campagne ? »).')", "toast.error('Indique l\\'adresse mail sur laquelle tu veux recevoir les réponses (champ « Quelle adresse mail pour cette campagne ? »).')")
}
if (s.includes("alert('Campagne lancée")) {
  s = s.replace("alert('Campagne lancée. L'IA enverra tes candidatures sur des horaires de bureau.')", "toast.success('Campagne lancée. L\\'IA enverra tes candidatures sur des horaires de bureau.')")
}
fs.writeFileSync(path, s)
console.log('Done')
