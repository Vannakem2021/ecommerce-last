import { CambodiaAddress, LegacyAddress } from '@/types'
import { formatCambodiaAddress } from '@/lib/utils/cambodia-address'

interface AddressDisplayProps {
  address: CambodiaAddress | LegacyAddress
  className?: string
}

export function AddressDisplay({ address, className = '' }: AddressDisplayProps) {
  // Check if it's a Cambodia address format
  const isCambodiaAddress = (addr: any): addr is CambodiaAddress => {
    return 'provinceId' in addr || 'districtId' in addr || 'communeCode' in addr
  }

  if (isCambodiaAddress(address)) {
    // Cambodia address format
    const formattedAddress = formatCambodiaAddress({
      fullName: address.fullName,
      houseNumber: address.houseNumber,
      street: address.street,
      commune: address.communeName,
      district: address.districtName,
      province: address.provinceName,
      postalCode: address.postalCode,
      phone: address.phone,
    })

    return (
      <div className={className}>
        {formattedAddress.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    )
  } else {
    // Legacy address format
    const legacyAddr = address as LegacyAddress
    return (
      <div className={className}>
        <p>
          {legacyAddr.fullName} {legacyAddr.phone}
        </p>
        <p>
          {legacyAddr.street}, {legacyAddr.city}, {legacyAddr.province}, {legacyAddr.postalCode}, {legacyAddr.country}
        </p>
      </div>
    )
  }
}

// Utility function to check if address is complete
export function isAddressComplete(address: CambodiaAddress | LegacyAddress): boolean {
  const isCambodiaAddress = (addr: any): addr is CambodiaAddress => {
    return 'provinceId' in addr || 'districtId' in addr || 'communeCode' in addr
  }

  if (isCambodiaAddress(address)) {
    return !!(
      address.fullName &&
      address.phone &&
      address.provinceId &&
      address.districtId &&
      address.communeCode &&
      address.houseNumber &&
      address.postalCode
    )
  } else {
    const legacyAddr = address as LegacyAddress
    return !!(
      legacyAddr.fullName &&
      legacyAddr.phone &&
      legacyAddr.street &&
      legacyAddr.city &&
      legacyAddr.province &&
      legacyAddr.postalCode &&
      legacyAddr.country
    )
  }
}
