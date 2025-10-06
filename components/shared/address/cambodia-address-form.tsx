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
}

export function CambodiaAddressForm<T extends FieldValues>({
  control,
  setValue,
  namePrefix = '',
  disabled = false,
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
    if (watchedProvinceId && watchedProvinceId !== selectedProvinceId) {
      const provinceId = typeof watchedProvinceId === 'string' ? parseInt(watchedProvinceId) : watchedProvinceId
      setSelectedProvinceId(provinceId)
      setDistricts(getDistrictsByProvinceId(provinceId).map(d => ({ id: d.id, name: d.location_en })))

      // If district is also set, initialize it
      if (watchedDistrictId && watchedDistrictId !== selectedDistrictId) {
        const districtId = typeof watchedDistrictId === 'string' ? parseInt(watchedDistrictId) : watchedDistrictId
        setSelectedDistrictId(districtId)
        setCommunes(
          getCommunesByDistrictId(provinceId, districtId).map(c => ({
            code: c.code,
            name: c.en,
          }))
        )
      }
    }
  }, [watchedProvinceId, watchedDistrictId, selectedProvinceId, selectedDistrictId])

  // Handle district changes when only district changes (not province)
  useEffect(() => {
    if (watchedDistrictId && selectedProvinceId && watchedDistrictId !== selectedDistrictId) {
      const districtId = typeof watchedDistrictId === 'string' ? parseInt(watchedDistrictId) : watchedDistrictId
      setSelectedDistrictId(districtId)
      setCommunes(
        getCommunesByDistrictId(selectedProvinceId, districtId).map(c => ({
          code: c.code,
          name: c.en,
        }))
      )
    }
  }, [watchedDistrictId, selectedProvinceId, selectedDistrictId])

  const handleProvinceChange = (provinceId: string, onChange: (value: any) => void) => {
    const id = parseInt(provinceId)
    setSelectedProvinceId(id)
    setSelectedDistrictId(null)
    setDistricts(getDistrictsByProvinceId(id).map(d => ({ id: d.id, name: d.location_en })))
    setCommunes([])
    onChange(id)
  }

  const handleDistrictChange = (districtId: string, onChange: (value: any) => void) => {
    const id = parseInt(districtId)
    setSelectedDistrictId(id)
    if (selectedProvinceId) {
      setCommunes(
        getCommunesByDistrictId(selectedProvinceId, id).map(c => ({
          code: c.code,
          name: c.en,
        }))
      )
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
              value={field.value?.toString() || ""}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select province/city" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id.toString()}>
                    {province.name_en || province.name}
                  </SelectItem>
                ))}
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
              value={field.value?.toString() || ""}
              disabled={disabled || !selectedProvinceId}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.id} value={district.id.toString()}>
                    {district.name}
                  </SelectItem>
                ))}
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
              value={field.value || ""}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select commune" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {communes.map((commune) => (
                  <SelectItem key={commune.code} value={commune.code}>
                    {commune.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
