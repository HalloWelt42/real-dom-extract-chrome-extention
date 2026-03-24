// DOM Extractor Pro - Spenden-Seite Logik (CSP-konform)

// Copyright dynamisch setzen
var copyrightEl = document.getElementById('footerCopyright');
if (copyrightEl) {
    copyrightEl.textContent = i18n('footerCopyright', [chrome.runtime.getManifest().version, new Date().getFullYear().toString()]);
}

// Crypto-Tabs umschalten
document.querySelectorAll('.crypto-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        const coin = btn.dataset.coin;

        document.querySelectorAll('.crypto-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.crypto-box').forEach(box => box.classList.remove('active'));
        document.getElementById('box-' + coin).classList.add('active');
    });
});

// Adresse kopieren
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const addrEl = document.getElementById(btn.dataset.addr);
        if (addrEl) {
            navigator.clipboard.writeText(addrEl.textContent.trim()).then(() => {
                const original = btn.textContent;
                btn.textContent = i18n('donateCopied');
                setTimeout(() => { btn.textContent = original; }, 2000);
            });
        }
    });
});
