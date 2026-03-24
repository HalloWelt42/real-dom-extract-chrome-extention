let currentContent = '';
let currentStyledHTML = '';

// DOM Elements
const modeSelect = document.getElementById('mode');
const extractBtn = document.getElementById('extractBtn');
const copyBtn = document.getElementById('copyBtn');
const previewBtn = document.getElementById('previewBtn');
const statusDiv = document.getElementById('status');
const statsDiv = document.getElementById('stats');
const snapshotsSection = document.getElementById('snapshotsSection');
const snapshotsDiv = document.getElementById('snapshots');
const themeBtn = document.getElementById('themeBtn');

// ============================================
// ICONS INITIALISIEREN
// ============================================
document.getElementById('headerIcon').innerHTML = icon('dom');
document.getElementById('iconPicker').innerHTML = icon('crosshairs');
document.getElementById('iconSelection').innerHTML = icon('text-width');
document.getElementById('iconPage').innerHTML = icon('file-lines');
document.getElementById('iconFullDom').innerHTML = icon('code');
document.getElementById('iconProfileAI').innerHTML = icon('robot');
document.getElementById('iconProfileDev').innerHTML = icon('laptop-code');
document.getElementById('iconProfileRaw').innerHTML = icon('file-code');
document.getElementById('iconProfileCustom').innerHTML = icon('sliders');
document.getElementById('helpBtn').innerHTML = icon('circle-exclamation');
document.getElementById('iconGithub').innerHTML = icon('github');
document.getElementById('iconDonate').innerHTML = icon('heart');
extractBtn.innerHTML = icon('download', 'icon-btn') + ' ' + i18n('btnExtract');
copyBtn.innerHTML = icon('copy', 'icon-btn') + ' ' + i18n('btnCopy');
var manifest = chrome.runtime.getManifest();
document.getElementById('footerCopyright').textContent = i18n('footerCopyright', [manifest.version, new Date().getFullYear().toString()]);
previewBtn.innerHTML = icon('expand', 'icon-btn');

// ============================================
// THEME
// ============================================
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeBtn.innerHTML = theme === 'dark' ? icon('sun') : icon('moon');
}

themeBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    chrome.storage.sync.set({ theme: next });
});

// ============================================
// PREFERENCES
// ============================================
chrome.storage.sync.get(['mode', 'filters', 'theme', 'maxChars', 'activeProfile'], (result) => {
    if (result.mode) modeSelect.value = result.mode;
    if (result.filters) {
        Object.keys(result.filters).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.checked = result.filters[key];
        });
    }
    if (result.maxChars) document.getElementById('maxChars').value = formatThousands(result.maxChars);
    applyTheme(result.theme || 'light');
    if (result.activeProfile) highlightProfile(result.activeProfile);
    loadSnapshots();
});

[modeSelect, ...document.querySelectorAll('input[type="checkbox"]')].forEach(el => {
    el.addEventListener('change', savePreferences);
});

function getFilterIds() {
    return [
        'removeJS', 'removeCSS', 'removeSVG', 'removeImages',
        'removeDataAttrs', 'removeEmptyTags', 'removeNavLinks',
        'removeForms', 'flattenDivs', 'removeDuplicates', 'normalizeSpaces'
    ];
}

function savePreferences() {
    const filters = {};
    getFilterIds().forEach(id => {
        const el = document.getElementById(id);
        if (el) filters[id] = el.checked;
    });
    chrome.storage.sync.set({
        mode: modeSelect.value,
        filters,
        maxChars: document.getElementById('maxChars').value
    });
}

function getConfig() {
    const config = { mode: modeSelect.value };
    getFilterIds().forEach(id => {
        const el = document.getElementById(id);
        if (el) config[id] = el.checked;
    });
    const rawMax = document.getElementById('maxChars').value.replace(/\./g, '').replace(/,/g, '');
    config.maxChars = parseInt(rawMax) || 100000000;
    return config;
}

// Max-Chars Feld: Tausenderpunkte bei Eingabe formatieren
const maxCharsInput = document.getElementById('maxChars');

function formatThousands(val) {
    const num = String(val).replace(/\./g, '').replace(/[^0-9]/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('de-DE');
}

maxCharsInput.addEventListener('input', () => {
    const pos = maxCharsInput.selectionStart;
    const oldLen = maxCharsInput.value.length;
    maxCharsInput.value = formatThousands(maxCharsInput.value);
    const newLen = maxCharsInput.value.length;
    maxCharsInput.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
});
maxCharsInput.addEventListener('change', savePreferences);

// ============================================
// PROFILE
// ============================================
const PROFILES = {
    ai: {
        mode: 'markdown',
        removeJS: true, removeCSS: true, removeSVG: true, removeImages: false,
        removeDataAttrs: true, removeEmptyTags: true, removeNavLinks: true,
        removeForms: true, flattenDivs: true, removeDuplicates: true, normalizeSpaces: true,
        maxChars: '100.000.000'
    },
    dev: {
        mode: 'html',
        removeJS: true, removeCSS: false, removeSVG: false, removeImages: false,
        removeDataAttrs: false, removeEmptyTags: false, removeNavLinks: false,
        removeForms: false, flattenDivs: false, removeDuplicates: false, normalizeSpaces: false,
        maxChars: '100.000.000'
    },
    raw: {
        mode: 'html',
        removeJS: false, removeCSS: false, removeSVG: false, removeImages: false,
        removeDataAttrs: false, removeEmptyTags: false, removeNavLinks: false,
        removeForms: false, flattenDivs: false, removeDuplicates: false, normalizeSpaces: false,
        maxChars: '100.000.000'
    }
};

const profileButtons = {
    ai: document.getElementById('profileAI'),
    dev: document.getElementById('profileDev'),
    raw: document.getElementById('profileRaw'),
    custom: document.getElementById('profileCustom')
};

function highlightProfile(name) {
    Object.values(profileButtons).forEach(btn => btn.classList.remove('active'));
    if (profileButtons[name]) profileButtons[name].classList.add('active');
    chrome.storage.sync.set({ activeProfile: name });
}

function applyProfile(name) {
    highlightProfile(name);
    if (name === 'custom') {
        chrome.storage.sync.get(['customProfile'], (result) => {
            if (result.customProfile) {
                setProfile(result.customProfile);
            }
        });
        return;
    }
    const profile = PROFILES[name];
    if (profile) setProfile(profile);
}

function setProfile(profile) {
    modeSelect.value = profile.mode || 'html';
    getFilterIds().forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = !!profile[id];
    });
    if (profile.maxChars) document.getElementById('maxChars').value = formatThousands(profile.maxChars);
    savePreferences();
}

profileButtons.ai.addEventListener('click', () => applyProfile('ai'));
profileButtons.dev.addEventListener('click', () => applyProfile('dev'));
profileButtons.raw.addEventListener('click', () => applyProfile('raw'));
profileButtons.custom.addEventListener('click', () => applyProfile('custom'));

// Eigenes Profil speichern: bei jedem manuellen Ändern die aktuellen Einstellungen als Custom-Profil sichern
function saveCustomProfile() {
    const profile = { mode: modeSelect.value };
    getFilterIds().forEach(id => {
        const el = document.getElementById(id);
        if (el) profile[id] = el.checked;
    });
    profile.maxChars = document.getElementById('maxChars').value;
    chrome.storage.sync.set({ customProfile: profile });
}

// Bei manueller Änderung auch als Custom-Profil speichern
[modeSelect, ...document.querySelectorAll('.checkbox-group input[type="checkbox"]')].forEach(el => {
    el.addEventListener('change', saveCustomProfile);
});
document.getElementById('maxChars').addEventListener('change', saveCustomProfile);

// ============================================
// CAPTURE MODES
// ============================================
document.getElementById('pickerBtn').addEventListener('click', startPicker);
document.getElementById('selectionBtn').addEventListener('click', captureSelection);
document.getElementById('pageBtn').addEventListener('click', capturePage);
document.getElementById('fullDomBtn').addEventListener('click', captureFullDOM);

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function ensureContentScript(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });
        await chrome.scripting.insertCSS({
            target: { tabId },
            files: ['picker.css']
        });
    }
}

async function startPicker() {
    try {
        const tab = await getActiveTab();
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, { action: 'startPicker' });
        // Popup schliesst sich, Ergebnis kommt via Background
        window.close();
    } catch (e) {
        showStatus(i18n('statusError') + ': ' + e.message, 'error');
    }
}

async function captureWithSource(source) {
    try {
        showStatus(i18n('statusExtracting'), 'success');
        const tab = await getActiveTab();
        await ensureContentScript(tab.id);
        const config = getConfig();
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractWithConfig',
            config: config,
            source: source
        });
        if (response && response.output) {
            currentContent = response.output;
            currentStyledHTML = response.styledHTML || '';
            copyBtn.disabled = false;
            previewBtn.disabled = false;
            const charCount = currentContent.length;
            const lineCount = currentContent.split('\n').length;
            const truncated = currentContent.endsWith(']') && currentContent.includes('[... gekürzt');
            statsDiv.textContent = i18n('statsFormat', [charCount.toString(), lineCount.toString()]) + (truncated ? ' ' + i18n('statusTruncated') : '');
            showStatus(i18n('statusSuccess'), 'success');
            saveSnapshot(charCount, response.url, response.title);
        } else {
            showStatus(i18n('statusNoContent'), 'error');
        }
    } catch (e) {
        showStatus(i18n('statusError') + ': ' + e.message, 'error');
    }
}

async function captureSelection() { await captureWithSource('selection'); }
async function capturePage() { await captureWithSource('page'); }
async function captureFullDOM() { await captureWithSource('full'); }

// ============================================
// EXTRACT BUTTON
// ============================================
extractBtn.addEventListener('click', captureFullDOM);

// ============================================
// CLIPBOARD + PREVIEW
// ============================================
copyBtn.addEventListener('click', () => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent).then(() => {
        copyBtn.innerHTML = '' + icon('check', 'icon-btn') + ' ' + i18n('btnCopied') + '';
        setTimeout(() => {
            copyBtn.innerHTML = '' + icon('copy', 'icon-btn') + ' ' + i18n('btnCopy') + '';
        }, 2000);
    }).catch(err => {
        showStatus(i18n('statusCopyFailed') + ': ' + err, 'error');
    });
});

previewBtn.addEventListener('click', () => {
    if (!currentContent) return;
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const bg = isDark ? '#1e1e1e' : '#fff';
    const fg = isDark ? '#d4d4d4' : '#333';
    const currentMode = modeSelect.value;

    // Vorschau-Inhalt in Storage legen, preview.html liest ihn
    chrome.storage.local.set({
        preview: {
            content: currentContent,
            styledHTML: currentStyledHTML,
            mode: currentMode,
            dark: isDark
        }
    }, () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('preview.html') });
    });
});

// ============================================
// SNAPSHOTS (max 10, löschbar)
// ============================================
function saveSnapshot(charCount, url, title) {
    chrome.storage.local.get(['snapshots'], (result) => {
        const snapshots = result.snapshots || [];
        const timestamp = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const date = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const hostname = url ? new URL(url).hostname : '';

        snapshots.unshift({
            timestamp: date + ' ' + timestamp,
            mode: modeSelect.value,
            charCount,
            content: currentContent,
            styledHTML: currentStyledHTML,
            url: hostname,
            title: title || ''
        });

        // Max 10
        while (snapshots.length > 10) snapshots.pop();

        chrome.storage.local.set({ snapshots }, loadSnapshots);
    });
}

function deleteSnapshot(index) {
    chrome.storage.local.get(['snapshots'], (result) => {
        const snapshots = result.snapshots || [];
        snapshots.splice(index, 1);
        chrome.storage.local.set({ snapshots }, loadSnapshots);
    });
}

function loadSnapshot(index) {
    chrome.storage.local.get(['snapshots'], (result) => {
        const snapshots = result.snapshots || [];
        if (snapshots[index]) {
            const snap = snapshots[index];
            currentContent = snap.content;
            currentStyledHTML = snap.styledHTML || '';
            if (snap.mode) modeSelect.value = snap.mode;
            copyBtn.disabled = false;
            previewBtn.disabled = false;

            const charCount = snap.charCount || currentContent.length;
            const lineCount = currentContent.split('\n').length;
            statsDiv.textContent = i18n('statsFormat', [charCount.toString(), lineCount.toString()]);
            showStatus(i18n('snapshotLoaded') + ': ' + snap.timestamp + ' (' + snap.mode.toUpperCase() + ')', 'success');

            // Aktiven Snapshot hervorheben
            snapshotsDiv.querySelectorAll('.snapshot-item').forEach((el, i) => {
                el.style.fontWeight = i === index ? '600' : '';
            });
        }
    });
}

function loadSnapshots() {
    chrome.storage.local.get(['snapshots'], (result) => {
        const snapshots = result.snapshots || [];
        if (snapshots.length === 0) {
            snapshotsSection.style.display = 'none';
            return;
        }
        snapshotsSection.style.display = 'block';
        snapshotsDiv.innerHTML = snapshots.map((item, i) =>
            '<div class="snapshot-item">' +
            '<span class="snapshot-info" data-index="' + i + '">' +
            item.timestamp + ' - ' + item.mode.toUpperCase() + ' - ' + item.charCount + ' ' + i18n('statsCharsShort') +
            (item.url ? ' - ' + item.url : '') +
            '</span>' +
            '<button class="snapshot-delete" data-index="' + i + '" title="' + i18n('snapshotDeleteTitle') + '">' +
            '' + icon('xmark', 'icon-btn') + '' +
            '</button>' +
            '</div>'
        ).join('');

        // Event Listeners
        snapshotsDiv.querySelectorAll('.snapshot-info').forEach(el => {
            el.addEventListener('click', () => loadSnapshot(parseInt(el.dataset.index)));
        });
        snapshotsDiv.querySelectorAll('.snapshot-delete').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSnapshot(parseInt(el.dataset.index));
            });
        });
    });
}

// ============================================
// PENDING PICKER RESULT (vom Background gespeichert)
// ============================================
chrome.storage.local.get(['pendingPicker'], (result) => {
    if (result.pendingPicker) {
        const p = result.pendingPicker;
        chrome.storage.local.remove('pendingPicker');
        currentContent = p.output;
        copyBtn.disabled = false;
        previewBtn.disabled = false;
        const charCount = currentContent.length;
        const lineCount = currentContent.split('\n').length;
        statsDiv.textContent = i18n('statsFormat', [charCount.toString(), lineCount.toString()]);
        showStatus(i18n('statusPickerResult'), 'success');
        saveSnapshot(charCount, p.url, p.title);
    }
});

// ============================================
// SPENDEN
// ============================================
document.getElementById('githubBtn').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/HalloWelt42/real-dom-extract-chrome-extention' });
});

document.getElementById('helpBtn').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
});

document.getElementById('donateBtn').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('donate.html') });
});

// ============================================
// STATUS
// ============================================
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    if (type === 'success') {
        setTimeout(() => { statusDiv.className = 'status'; }, 4000);
    }
}
