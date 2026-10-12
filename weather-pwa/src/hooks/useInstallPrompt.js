import { useState, useEffect } from 'react'

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // 1. Check if app is already running in standalone PWA mode
        const isStandalone = 
            window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true

        if (isStandalone) {
            setIsInstalled(true)
            return
        }

        // 2. Intercept beforeinstallprompt event to enable custom button
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        // 3. Detect when app is successfully installed
        const handleAppInstalled = () => {
            setIsInstalled(true)
            setIsInstallable(false)
            setDeferredPrompt(null)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])
    
    // Trigger native browser install dialog
    const promptInstall = async() => {
        if (!deferredPrompt) return false
        
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setIsInstalled(true)
            setIsInstallable(false)
        }

        setDeferredPrompt(null)
        return outcome === 'accepted'
    }

    return {
        isInstallable,
        isInstalled,
        promptInstall
    }
}