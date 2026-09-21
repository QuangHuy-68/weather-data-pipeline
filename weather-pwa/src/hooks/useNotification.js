import { useState, useEffect } from 'react'

export function useNotification() {
    const [permission, setPermission] = useState('default')
    const [supported, setSupported] = useState(true)

    useEffect(() => {
        // Check if the browser supports the Notification API
        if (!('Notification' in window)) {
            setSupported(false)
        } else {
            setPermission(Notification.permission)
        }
    }, [])

    // Request notification permission from the user
    const requestPermission = async () => {
        if (!supported) {
            alert('This browser does not support push notifications.')
            return false
        }

        try {
            const status = await Notification.requestPermission()
            setPermission(status)

            if (status === 'granted') {
                // Send an immediate confirmation notification once granted
                sendNotification('🔔 Weather Alerts Enabled', {
                    body: 'You will now receive instant alerts for rain and severe weather condtions!', 
                    icon: '/pwa-192x192.png',
                    badge: '/favicon.svg'
                })

                return true
            }

            return false

        } catch (err) {
            console.error('Error requesting notification permission:', err)
            return false
        }
    }

    // Trigger push notification (prioritizes PWA Service Worker for lock screen delivery)
        const sendNotification = (title, options = {}) => {
            if (!supported || Notification.permission !== 'granted') return
            
            const defaultOptions = {
                icon: '/pwa-192x192.png',
                badge: '/favicon.svg',
                vibrate: [200, 100, 200],
                ...options
            }

            // 1. Standard PWA approach: Use Service Worker for lock screen & background delivery
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                    .then(registration => {
                        registration.showNotification(title,defaultOptions)
                    })
                    .catch(() => {
                        // 2. Fallback to standard desktop Notification API
                        new Notification(title,defaultOptions)
                    })
            } else {
                new Notification(title, defaultOptions)
            }
    }

    return { permission, supported, requestPermission, sendNotification }
}