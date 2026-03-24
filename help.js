// DOM Extractor Pro - Hilfe-Seite
document.getElementById('footerCopyright').textContent =
    i18n('footerCopyright', [chrome.runtime.getManifest().version, new Date().getFullYear().toString()]);
