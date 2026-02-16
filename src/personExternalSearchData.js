export function extractYearFromDate(dateStr) {
  if (!dateStr) return ''
  const match = dateStr.match(/^\d{4}/)
  return match ? match[0] : ''
}

export function buildExternalSearchData(person) {
  const profile = person?.profile || {}
  return {
    name_given: profile.name_given,
    name_surname: profile.name_surname,
    name_middle: profile.name_given?.split(' ')[1] || '',
    place_name:
      profile.birth?.place_name ||
      profile.birth?.place ||
      profile.death?.place_name ||
      profile.death?.place ||
      '',
    birth_year: extractYearFromDate(profile.birth?.date),
    death_year: extractYearFromDate(profile.death?.date),
  }
}
