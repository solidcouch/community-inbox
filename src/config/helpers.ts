export const envToBoolean = (value: string | undefined): boolean => {
  if (value === 'false') return false
  if (value === '0') return false
  return !!value
}

export const envToArray = (value: string | undefined) => {
  if (!value) return []
  return value.split(/\s*,\s*/)
}
