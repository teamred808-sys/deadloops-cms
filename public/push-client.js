const PUBLIC_VAPID_KEY_URL = '/api/vapid-public-key';
const SUBSCRIBE_URL = '/api/subscribe';

async function registerServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const register = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker Registered');

            // Request permission immediately (or delay until user interaction)
            // For this demo, we can request on load or add a button listener.
            // Ideally, specific user gesture is better. We'll do it on load for "simple mechanism" request unless disallowed.
            // Modern browsers block permission requests without user gesture.
            // So we will just log, and expose a function window.subscribeToPush() for usage.

            // Auto-subscribe if already granted
            if (Notification.permission === 'granted') {
                await subscribeUser(register);
            }

        } catch (error) {
            console.error('Service Worker Registration Failed:', error);
        }
    }
}

async function subscribeToPush() {
    if ('serviceWorker' in navigator) {
        const register = await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await subscribeUser(register);
            alert('Subscribed to notifications!');
        } else {
            console.warn('Permission denied');
        }
    }
}

async function subscribeUser(registration) {
    try {
        const response = await fetch(PUBLIC_VAPID_KEY_URL);
        const { publicKey } = await response.json();

        const translatedKey = urlBase64ToUint8Array(publicKey);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: translatedKey
        });

        await fetch(SUBSCRIBE_URL, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'content-type': 'application/json'
            }
        });

        console.log('User Subscribed!');
    } catch (error) {
        console.warn('Failed to subscribe (might be already subscribed):', error);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

window.addEventListener('load', registerServiceWorker);
window.subscribeToPush = subscribeToPush; // Expose globally
