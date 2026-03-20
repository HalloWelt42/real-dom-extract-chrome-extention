// DOM Extractor Pro - Vorschau-Logik (CSP-konform, kein inline JS)

chrome.storage.local.get(['preview'], (result) => {
    if (!result.preview) return;

    const { content, styledHTML, mode, dark } = result.preview;
    document.body.className = dark ? 'dark' : 'light';

    const charCount = content.length;
    const lineCount = content.split('\n').length;
    document.getElementById('info').textContent = i18n('statsFormat', [charCount.toString(), lineCount.toString()]);

    if (mode === 'html') {
        // HTML-Modus: Gerendert (mit Styles) + Quellcode (gefilterter Output)
        document.getElementById('toolbar').style.display = 'flex';
        // Gerendert: styledHTML verwenden (echtes Aussehen mit CSS)
        document.getElementById('rendered').innerHTML = styledHTML || content;
        // Quellcode: gefilterter Output (das was kopiert/an KI geht)
        document.getElementById('sourceCode').textContent = content;
        document.getElementById('plaintext').style.display = 'none';

        document.getElementById('btnRendered').addEventListener('click', () => {
            document.getElementById('rendered').style.display = 'block';
            document.getElementById('source').style.display = 'none';
            document.getElementById('btnRendered').classList.add('active');
            document.getElementById('btnSource').classList.remove('active');
        });

        document.getElementById('btnSource').addEventListener('click', () => {
            document.getElementById('source').style.display = 'block';
            document.getElementById('rendered').style.display = 'none';
            document.getElementById('btnSource').classList.add('active');
            document.getElementById('btnRendered').classList.remove('active');
        });
    } else {
        // Alle anderen Modi: Plaintext
        document.getElementById('toolbar').style.display = 'flex';
        document.getElementById('rendered').style.display = 'none';
        document.getElementById('source').style.display = 'none';
        document.getElementById('plainCode').textContent = content;

        document.getElementById('btnRendered').style.display = 'none';
        document.getElementById('btnSource').style.display = 'none';
    }
});
