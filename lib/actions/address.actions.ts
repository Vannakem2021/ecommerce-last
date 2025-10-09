'use server'

import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { ShippingAddress } from '@/types'
import { revalidatePath } from 'next/cache'

// Get all addresses for the current user
export async function getUserAddresses() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized', data: [] }
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id).select('addresses address').lean() as any
    if (!user) {
      return { success: false, message: 'User not found', data: [] }
    }

    // Auto-migrate: if addresses array is empty but old address field exists
    if ((!user.addresses || user.addresses.length === 0) && user.address) {
      const migratedAddress = {
        ...user.address,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Add migrated address and clear old address field to prevent duplicate migrations
      await User.findByIdAndUpdate(session.user.id, {
        $push: { addresses: migratedAddress },
        $unset: { address: 1 }  // Clear old address field
      })
      
      // Serialize MongoDB objects for client component compatibility
      return { 
        success: true, 
        message: 'Address migrated successfully',
        data: [{
          ...migratedAddress,
          _id: migratedAddress._id?.toString(),
          createdAt: migratedAddress.createdAt?.toISOString?.() || migratedAddress.createdAt,
          updatedAt: migratedAddress.updatedAt?.toISOString?.() || migratedAddress.updatedAt,
        }]
      }
    }

    // Ensure only one address is marked as default
    let addresses = user.addresses || []
    const defaultAddresses = addresses.filter((addr: any) => addr.isDefault)
    
    // If multiple defaults exist, keep only the first one
    if (defaultAddresses.length > 1) {
      addresses = addresses.map((addr: any, index: number) => {
        const isFirstDefault = addr.isDefault && addresses.findIndex((a: any) => a.isDefault) === index
        return {
          ...addr,
          isDefault: isFirstDefault
        }
      })
      
      // Update in database
      await User.findByIdAndUpdate(session.user.id, {
        addresses: addresses
      })
    }
    
    // If no default exists and there are addresses, make the first one default
    if (defaultAddresses.length === 0 && addresses.length > 0) {
      addresses[0].isDefault = true
      await User.findByIdAndUpdate(session.user.id, {
        addresses: addresses
      })
    }

    // Serialize MongoDB objects for client component compatibility
    const serializedAddresses = addresses.map((addr: any) => ({
      ...addr,
      _id: addr._id?.toString(),
      createdAt: addr.createdAt?.toISOString?.() || addr.createdAt,
      updatedAt: addr.updatedAt?.toISOString?.() || addr.updatedAt,
    }))

    return { 
      success: true, 
      data: serializedAddresses
    }
  } catch (error) {
    console.error('Error getting user addresses:', error)
    return { 
      success: false, 
      message: 'Failed to fetch addresses', 
      data: [] 
    }
  }
}

// Get default address
export async function getDefaultAddress() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized', data: null }
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id).select('addresses address').lean() as any
    if (!user) {
      return { success: false, message: 'User not found', data: null }
    }

    // Check for default address in addresses array
    const defaultAddr = user.addresses?.find((addr: any) => addr.isDefault)
    
    if (defaultAddr) {
      // Serialize MongoDB objects for client component compatibility
      return { 
        success: true, 
        data: {
          ...defaultAddr,
          _id: defaultAddr._id?.toString(),
          createdAt: defaultAddr.createdAt?.toISOString?.() || defaultAddr.createdAt,
          updatedAt: defaultAddr.updatedAt?.toISOString?.() || defaultAddr.updatedAt,
        }
      }
    }

    // Fallback: check legacy address field
    if (user.address) {
      // Serialize MongoDB objects for client component compatibility
      return { 
        success: true, 
        data: {
          ...user.address,
          _id: user.address._id?.toString(),
          createdAt: user.address.createdAt?.toISOString?.() || user.address.createdAt,
          updatedAt: user.address.updatedAt?.toISOString?.() || user.address.updatedAt,
        }
      }
    }

    return { success: true, data: null }
  } catch (error) {
    console.error('Error getting default address:', error)
    return { success: false, message: 'Failed to fetch default address', data: null }
  }
}

// Add new address
export async function addAddress(address: ShippingAddress, setAsDefault: boolean = false) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id).lean() as any
    if (!user) {
      return { success: false, message: 'User not found' }
    }

    // If this is the first address, make it default
    const isFirstAddress = !user.addresses || user.addresses.length === 0
    
    const newAddress = {
      ...address,
      isDefault: setAsDefault || isFirstAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Build update object
    const updateOps: any = {
      $push: { addresses: newAddress }
    }

    // If setting as default, unset other defaults first
    if (setAsDefault && !isFirstAddress) {
      // First unset all defaults
      await User.findByIdAndUpdate(
        session.user.id,
        { $set: { 'addresses.$[].isDefault': false } },
        { runValidators: false }
      )
    }

    // Add the new address
    await User.findByIdAndUpdate(
      session.user.id,
      updateOps,
      { runValidators: false }
    )

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    // Serialize MongoDB objects for client component compatibility
    return { 
      success: true, 
      message: 'Address added successfully',
      data: {
        ...newAddress,
        _id: (newAddress as any)._id?.toString(),
        createdAt: newAddress.createdAt?.toISOString?.() || newAddress.createdAt,
        updatedAt: newAddress.updatedAt?.toISOString?.() || newAddress.updatedAt,
      }
    }
  } catch (error) {
    console.error('Error adding address:', error)
    return { success: false, message: 'Failed to add address' }
  }
}

// Update existing address
export async function updateAddress(addressId: string, address: ShippingAddress) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id).lean() as any
    if (!user) {
      return { success: false, message: 'User not found' }
    }

    const addressIndex = user.addresses?.findIndex((addr: any) => addr._id.toString() === addressId)
    
    if (addressIndex === -1 || addressIndex === undefined) {
      return { success: false, message: 'Address not found' }
    }

    // Keep the isDefault status and creation date
    const existingAddress = user.addresses[addressIndex]
    const updatedAddress = {
      ...address,
      _id: existingAddress._id,
      isDefault: existingAddress.isDefault,
      createdAt: existingAddress.createdAt,
      updatedAt: new Date(),
    }

    // Update addresses array
    const updatedAddresses = [...user.addresses]
    updatedAddresses[addressIndex] = updatedAddress

    // Use direct update without triggering validation
    await User.findByIdAndUpdate(
      session.user.id,
      { addresses: updatedAddresses },
      { runValidators: false }
    )

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    // Serialize MongoDB objects for client component compatibility
    return { 
      success: true, 
      message: 'Address updated successfully',
      data: {
        ...updatedAddress,
        _id: (updatedAddress as any)._id?.toString(),
        createdAt: (updatedAddress.createdAt as any)?.toISOString?.() || updatedAddress.createdAt,
        updatedAt: updatedAddress.updatedAt?.toISOString?.() || updatedAddress.updatedAt,
      }
    }
  } catch (error) {
    console.error('Error updating address:', error)
    return { success: false, message: 'Failed to update address' }
  }
}

// Delete address
export async function deleteAddress(addressId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id) as any
    if (!user) {
      return { success: false, message: 'User not found' }
    }

    const addressToDelete = user.addresses?.find((addr: any) => addr._id.toString() === addressId)
    
    if (!addressToDelete) {
      return { success: false, message: 'Address not found' }
    }

    // Prevent deleting the default address if there are other addresses
    if (addressToDelete.isDefault && user.addresses.length > 1) {
      return { 
        success: false, 
        message: 'Cannot delete default address. Please set another address as default first.' 
      }
    }

    // Use $pull to remove address without triggering validation on remaining addresses
    await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { addresses: { _id: addressId } } },
      { runValidators: false }
    )

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    return { success: true, message: 'Address deleted successfully' }
  } catch (error) {
    console.error('Error deleting address:', error)
    return { success: false, message: 'Failed to delete address' }
  }
}

// Set address as default
export async function setAddressAsDefault(addressId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' }
    }

    await connectToDatabase()
    
    const user = await User.findById(session.user.id).lean() as any
    if (!user) {
      return { success: false, message: 'User not found' }
    }

    const addressExists = user.addresses?.some((addr: any) => addr._id.toString() === addressId)
    
    if (!addressExists) {
      return { success: false, message: 'Address not found' }
    }

    // Update all addresses: unset all defaults, then set the selected one
    const updatedAddresses = user.addresses?.map((addr: any) => ({
      ...addr,
      isDefault: addr._id.toString() === addressId,
      updatedAt: addr._id.toString() === addressId ? new Date() : addr.updatedAt,
    })) || []

    // Use direct update without triggering validation
    await User.findByIdAndUpdate(
      session.user.id,
      { addresses: updatedAddresses },
      { runValidators: false }
    )

    revalidatePath('/account/addresses')
    revalidatePath('/checkout')

    return { success: true, message: 'Default address updated successfully' }
  } catch (error) {
    console.error('Error setting default address:', error)
    return { success: false, message: 'Failed to set default address' }
  }
}
