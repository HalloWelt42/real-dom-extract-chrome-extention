// Service Worker für DOM Extractor Pro Extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('[DOM Extractor] Extension installiert');

    // Defaults nur setzen wenn noch keine Einstellungen vorhanden
    chrome.storage.sync.get(['mode'], (result) => {
        if (!result.mode) {
            chrome.storage.sync.set({
                mode: 'html',
                theme: 'light',
                maxChars: '100.000.000',
                filters: {
                    removeJS: true,
                    removeCSS: true,
                    removeSVG: true,
                    removeImages: false,
                    removeDataAttrs: true,
                    removeEmptyTags: true,
                    removeNavLinks: true,
                    removeForms: true,
                    flattenDivs: true,
                    removeDuplicates: false,
                    normalizeSpaces: true
                }
            });
        }
    });

    chrome.contextMenus.create({
        id: 'extract-dom',
        title: 'DOM Extractor: Diese Seite analysieren',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'extract-selection',
        title: 'DOM Extractor: Markierung erfassen',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extract-dom') {
        chrome.action.openPopup();
    }
    if (info.menuItemId === 'extract-selection' && info.selectionText) {
        // Selektion als Snapshot speichern
        chrome.storage.local.get(['snapshots'], (result) => {
            const snapshots = result.snapshots || [];
            const now = new Date();
            snapshots.unshift({
                timestamp: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' +
                    now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                mode: 'text',
                charCount: info.selectionText.length,
                content: info.selectionText,
                url: tab.url ? new URL(tab.url).hostname : '',
                title: tab.title || ''
            });
            while (snapshots.length > 10) snapshots.pop();
            chrome.storage.local.set({ snapshots });
        });
    }
});

// Picker-Ergebnis vom Content Script empfangen und zwischenspeichern
// (Popup ist geschlossen wenn Picker aktiv ist)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pickerResult') {
        // Ergebnis in Storage zwischenspeichern, Popup liest es beim Öffnen
        chrome.storage.local.set({
            pendingPicker: {
                output: message.output,
                url: message.url,
                title: message.title
            }
        });
        // Popup öffnen damit es verarbeitet wird
        chrome.action.openPopup();
        sendResponse({ success: true });
    }

    if (message.action === 'pickerCancelled') {
        sendResponse({ success: true });
    }

    return true;
});