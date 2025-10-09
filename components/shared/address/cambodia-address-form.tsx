'use client'

import { useEffect, useState } from 'react'
import { Control, FieldPath, FieldValues, useWatch } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getProvinces,
  getDistrictsByProvinceId,
  getCommunesByDistrictId,
  getAddressNames,
} from '@/lib/utils/cambodia-address'

interface CambodiaAddressFormProps<T extends FieldValues> {
  control: Control<T>
  setValue: (name: FieldPath<T>, value: any) => void
  namePrefix?: string
  disabled?: boolean
  onFieldChange?: (fieldName: string, value: any) => void
}

export function CambodiaAddressForm<T extends FieldValues>({
  control,
  setValue,
  namePrefix = '',
  disabled = false,
  onFieldChange,
}: CambodiaAddressFormProps<T>) {
  const [provinces] = useState(() => getProvinces())
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([])
  const [communes, setCommunes] = useState<Array<{ code: string; name: string }>>([])
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null)

  const getFieldName = (field: string): FieldPath<T> => {
    return (namePrefix ? `${namePrefix}.${field}` : field) as FieldPath<T>
  }

  // Watch form values to sync with local state
  const watchedProvinceId = useWatch({
    control,
    name: getFieldName('provinceId'),
  })
  const watchedDistrictId = useWatch({
    control,
    name: getFieldName('districtId'),
  })

  // Initialize local state from form values and sync when form values change
  useEffect(() => {
    if (watchedProvinceId) {
      const provinceId = typeof watchedProvinceId === 'string' ? parseInt(watchedProvinceId) : watchedProvinceId
      
      // Only update if province changed or districts are empty (component just mounted/remounted)
      if (provinceId !== selectedProvinceId || districts.length === 0) {
        setSelectedProvinceId(provinceId)
        const loadedDistricts = getDistrictsByProvinceId(provinceId).map(d => ({ id: d.id, name: d.location_en }))
        setDistricts(loadedDistricts)

        // If district is also set, initialize it
        if (watchedDistrictId) {
          const districtId = typeof watchedDistrictId === 'string' ? parseInt(watchedDistrictId) : watchedDistrictId
          
          // Only update if district changed or communes are empty
          if (districtId !== selectedDistrictId || communes.length === 0) {
            setSelectedDistrictId(districtId)
            setCommunes(
              getCommunesByDistrictId(provinceId, districtId).map(c => ({
                code: c.code,
                name: c.en,
              }))
            )
          }
        }
      }
    }
  }, [watchedProvinceId, watchedDistrictId, selectedProvinceId, selectedDistrictId, districts.length, communes.length])

  // Handle district changes when only district changes (not province)
  useEffect(() => {
    if (watchedDistrictId && selectedProvinceId) {
      const districtId = typeof watchedDistrictId === 'string' ? parseInt(watchedDistrictId) : watchedDistrictId
      
      // Only update if district changed or communes are empty (handles separate district updates)
      if (districtId !== selectedDistrictId || (communes.length === 0 && districts.length > 0)) {
        setSelectedDistrictId(districtId)
        setCommunes(
          getCommunesByDistrictId(selectedProvinceId, districtId).map(c => ({
            code: c.code,
            name: c.en,
          }))
        )
      }
    }
  }, [watchedDistrictId, selectedProvinceId, selectedDistrictId, communes.length, districts.length])

  const handleProvinceChange = (provinceId: string, onChange: (value: any) => void) => {
    const id = parseInt(provinceId)
    setSelectedProvinceId(id)
    setSelectedDistrictId(null)
    const loadedDistricts = getDistrictsByProvinceId(id).map(d => ({ id: d.id, name: d.location_en }))
    setDistricts(loadedDistricts)
    setCommunes([])
    onChange(id)
    
    // Immediately set provinceName when province changes (for real-time payment method filtering)
    const selectedProvince = provinces.find(p => p.id === id)
    const provinceName = selectedProvince?.name_en || selectedProvince?.name || ''
    
    if (provinceName) {
      setValue(getFieldName('provinceName'), provinceName)
      
      // Notify parent component of the change for real-time filtering
      if (onFieldChange) {
        onFieldChange('provinceName', provinceName)
      }
    }
    
    // Clear district and commune names since they're no longer valid
    setValue(getFieldName('districtName'), '')
    setValue(getFieldName('communeName'), '')
    setValue(getFieldName('postalCode'), '')
  }

  const handleDistrictChange = (districtId: string, onChange: (value: any) => void) => {
    const id = parseInt(districtId)
    setSelectedDistrictId(id)
    if (selectedProvinceId) {
      const loadedCommunes = getCommunesByDistrictId(selectedProvinceId, id).map(c => ({
        code: c.code,
        name: c.en,
      }))
      setCommunes(loadedCommunes)
      
      // Immediately set districtName when district changes
      const selectedDistrict = districts.find(d => d.id === id)
      if (selectedDistrict) {
        setValue(getFieldName('districtName'), selectedDistrict.name)
      }
      
      // Clear commune name and postal code since they're no longer valid
      setValue(getFieldName('communeName'), '')
      setValue(getFieldName('postalCode'), '')
    }
    onChange(id)
  }

  const handleCommuneChange = (
    communeCode: string,
    onChange: (value: any) => void,
    postalCodeOnChange: (value: any) => void,
    provinceNameOnChange: (value: any) => void,
    districtNameOnChange: (value: any) => void,
    communeNameOnChange: (value: any) => void
  ) => {
    onChange(communeCode)
    
    if (selectedProvinceId && selectedDistrictId) {
      const addressNames = getAddressNames({
        provinceId: selectedProvinceId,
        districtId: selectedDistrictId,
        communeCode,
      })
      
      postalCodeOnChange(addressNames.postalCode || '')
      provinceNameOnChange(addressNames.provinceName || '')
      districtNameOnChange(addressNames.districtName || '')
      communeNameOnChange(addressNames.communeName || '')
    }
  }

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <FormField
        control={control}
        name={getFieldName('fullName')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter full name"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Phone Number */}
      <FormField
        control={control}
        name={getFieldName('phone')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter phone number"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Province/City */}
      <FormField
        control={control}
        name={getFieldName('provinceId')}
        render={({ field }) => (
            <FormItem>
              <FormLabel>Province/City *</FormLabel>
              <Select
                onValueChange={(value) => handleProvinceChange(value, field.onChange)}
                value={field.value ? String(field.value) : ""}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select province/city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]" position="popper" sideOffset={5}>
                  {provinces.length > 0 ? (
                    provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">No provinces available</div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
        )}
      />

      {/* District */}
      <FormField
        control={control}
        name={getFieldName('districtId')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>District/Srok/Khan *</FormLabel>
            <Select
              onValueChange={(value) => handleDistrictChange(value, field.onChange)}
              value={field.value ? String(field.value) : ""}
              disabled={disabled || !selectedProvinceId}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]" position="popper" sideOffset={5}>
                {districts.length > 0 ? (
                  districts.map((district) => (
                    <SelectItem key={district.id} value={district.id.toString()}>
                      {district.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Select a province first</div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Commune with auto-population */}
      <CommuneField
        control={control}
        setValue={setValue}
        namePrefix={namePrefix}
        communes={communes}
        disabled={disabled || !selectedDistrictId}
        selectedProvinceId={selectedProvinceId}
        selectedDistrictId={selectedDistrictId}
      />

      {/* House Number */}
      <FormField
        control={control}
        name={getFieldName('houseNumber')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>House Number *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter house number"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Street (Optional) */}
      <FormField
        control={control}
        name={getFieldName('street')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter street name"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Postal Code (Read-only) */}
      <FormField
        control={control}
        name={getFieldName('postalCode')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Postal Code</FormLabel>
            <FormControl>
              <Input
                placeholder="Auto-populated"
                disabled={true}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hidden fields for display names */}
      <FormField
        control={control}
        name={getFieldName('provinceName')}
        render={({ field }) => (
          <input type="hidden" {...field} />
        )}
      />
      <FormField
        control={control}
        name={getFieldName('districtName')}
        render={({ field }) => (
          <input type="hidden" {...field} />
        )}
      />
      <FormField
        control={control}
        name={getFieldName('communeName')}
        render={({ field }) => (
          <input type="hidden" {...field} />
        )}
      />
    </div>
  )
}

// Separate component to handle commune selection with auto-population
function CommuneField<T extends FieldValues>({
  control,
  setValue,
  namePrefix,
  communes,
  disabled,
  selectedProvinceId,
  selectedDistrictId,
}: {
  control: Control<T>
  setValue: (name: FieldPath<T>, value: any) => void
  namePrefix?: string
  communes: Array<{ code: string; name: string }>
  disabled: boolean
  selectedProvinceId: number | null
  selectedDistrictId: number | null
}) {
  const getFieldName = (field: string): FieldPath<T> => {
    return (namePrefix ? `${namePrefix}.${field}` : field) as FieldPath<T>
  }

  return (
    <>
      <FormField
        control={control}
        name={getFieldName('communeCode')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Commune/Khum/Sangkat *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value)

                // Auto-populate related fields
                if (selectedProvinceId && selectedDistrictId) {
                  const addressNames = getAddressNames({
                    provinceId: selectedProvinceId,
                    districtId: selectedDistrictId,
                    communeCode: value,
                  })

                  // Update other fields using setValue
                  setValue(getFieldName('postalCode'), addressNames.postalCode || '')
                  setValue(getFieldName('provinceName'), addressNames.provinceName || '')
                  setValue(getFieldName('districtName'), addressNames.districtName || '')
                  setValue(getFieldName('communeName'), addressNames.communeName || '')
                }
              }}
              value={field.value ? String(field.value) : ""}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select commune" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[300px]" position="popper" sideOffset={5}>
                {communes.length > 0 ? (
                  communes.map((commune) => (
                    <SelectItem key={commune.code} value={commune.code}>
                      {commune.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Select a district first</div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
