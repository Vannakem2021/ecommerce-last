import { useState, useEffect } from 'react'

function useDeviceType() {
  const [deviceType, setDeviceType] = useState('desktop') // Start with desktop instead of unknown

  useEffect(() => {
    const handleResize = () => {
      const newType = window.innerWidth <= 768 ? 'mobile' : 'desktop'
      setDeviceType(prevType => prevType === newType ? prevType : newType) // Prevent unnecessary updates
    }

    handleResize() // Set initial value
    // Use throttled resize handler to prevent excessive calls
    let resizeTimeout: NodeJS.Timeout
    const throttledResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 250)
    }
    
    window.addEventListener('resize', throttledResize)

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', throttledResize)
    }
  }, [])

  return deviceType
}

export default useDeviceType
