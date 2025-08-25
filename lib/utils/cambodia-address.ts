import cambodiaData from '@/lib/data/cambodia-postal-codes.json'

export interface CambodiaCommune {
  km: string
  en: string
  code: string
}

export interface CambodiaDistrict {
  id: number
  no: string
  location_kh: string
  location_en: string
  codes: CambodiaCommune[]
}

export interface CambodiaProvince {
  id: number
  name: string
  name_en?: string
  districts: CambodiaDistrict[]
}

export interface CambodiaAddressData {
  provinces: CambodiaProvince[]
}

// Type the imported data
const data = cambodiaData as CambodiaProvince[]

/**
 * Get all provinces/cities in Cambodia
 */
export function getProvinces(): Array<{ id: number; name: string; name_en?: string }> {
  return data.map(province => ({
    id: province.id,
    name: province.name,
    name_en: province.name_en
  }))
}

/**
 * Get all districts for a specific province
 */
export function getDistrictsByProvinceId(provinceId: number): CambodiaDistrict[] {
  const province = data.find(p => p.id === provinceId)
  return province?.districts || []
}

/**
 * Get all communes for a specific district
 */
export function getCommunesByDistrictId(provinceId: number, districtId: number): CambodiaCommune[] {
  const province = data.find(p => p.id === provinceId)
  const district = province?.districts.find(d => d.id === districtId)
  return district?.codes || []
}

/**
 * Get postal code for a specific commune
 */
export function getPostalCodeByCommune(provinceId: number, districtId: number, communeCode: string): string {
  const communes = getCommunesByDistrictId(provinceId, districtId)
  const commune = communes.find(c => c.code === communeCode)
  return commune?.code || ''
}

/**
 * Find province by ID
 */
export function getProvinceById(provinceId: number): CambodiaProvince | undefined {
  return data.find(p => p.id === provinceId)
}

/**
 * Find district by ID within a province
 */
export function getDistrictById(provinceId: number, districtId: number): CambodiaDistrict | undefined {
  const province = getProvinceById(provinceId)
  return province?.districts.find(d => d.id === districtId)
}

/**
 * Find commune by code within a district
 */
export function getCommuneByCode(provinceId: number, districtId: number, communeCode: string): CambodiaCommune | undefined {
  const communes = getCommunesByDistrictId(provinceId, districtId)
  return communes.find(c => c.code === communeCode)
}

/**
 * Format address for display
 */
export function formatCambodiaAddress(address: {
  fullName: string
  houseNumber?: string
  street?: string
  commune?: string
  district?: string
  province?: string
  postalCode?: string
  phone?: string
}): string {
  const parts = []
  
  if (address.fullName) parts.push(address.fullName)
  if (address.phone) parts.push(address.phone)
  
  const addressLine = []
  if (address.houseNumber) addressLine.push(address.houseNumber)
  if (address.street) addressLine.push(address.street)
  if (addressLine.length > 0) parts.push(addressLine.join(', '))
  
  const locationLine = []
  if (address.commune) locationLine.push(address.commune)
  if (address.district) locationLine.push(address.district)
  if (address.province) locationLine.push(address.province)
  if (address.postalCode) locationLine.push(address.postalCode)
  if (locationLine.length > 0) parts.push(locationLine.join(', '))
  
  return parts.join('\n')
}

/**
 * Validate Cambodia address structure
 */
export function validateCambodiaAddress(address: {
  provinceId?: number
  districtId?: number
  communeCode?: string
}): boolean {
  if (!address.provinceId || !address.districtId || !address.communeCode) {
    return false
  }
  
  const province = getProvinceById(address.provinceId)
  if (!province) return false
  
  const district = getDistrictById(address.provinceId, address.districtId)
  if (!district) return false
  
  const commune = getCommuneByCode(address.provinceId, address.districtId, address.communeCode)
  if (!commune) return false
  
  return true
}

/**
 * Get address names by IDs for display
 */
export function getAddressNames(address: {
  provinceId?: number
  districtId?: number
  communeCode?: string
}): {
  provinceName?: string
  districtName?: string
  communeName?: string
  postalCode?: string
} {
  const result: {
    provinceName?: string
    districtName?: string
    communeName?: string
    postalCode?: string
  } = {}
  
  if (address.provinceId) {
    const province = getProvinceById(address.provinceId)
    result.provinceName = province?.name_en || province?.name
  }
  
  if (address.provinceId && address.districtId) {
    const district = getDistrictById(address.provinceId, address.districtId)
    result.districtName = district?.location_en
  }
  
  if (address.provinceId && address.districtId && address.communeCode) {
    const commune = getCommuneByCode(address.provinceId, address.districtId, address.communeCode)
    result.communeName = commune?.en
    result.postalCode = commune?.code
  }
  
  return result
}
