document.addEventListener('DOMContentLoaded', () => {
    let config = {
        homepage: "https://edu.google.com",
        blocked_sites: ["youtube.com", "facebook.com"],
        browser_title: "School Protected Browser",
        cloud_bookmarks: [
            { title: "Google Classroom", url: "https://classroom.google.com", folder: "Cloud" }
        ],
        whitelist_mode: false,
        allowed_sites: []
    };

    // DOM Elements
    const browserTitleInput = document.getElementById('browserTitle');
    const homepageInput = document.getElementById('homepage');
    const siteInput = document.getElementById('siteInput');
    const addSiteBtn = document.getElementById('addSiteBtn');
    const blockedSitesList = document.getElementById('blockedSitesList');
    const bmTitleInput = document.getElementById('bmTitle');
    const bmUrlInput = document.getElementById('bmUrl');
    const addBmBtn = document.getElementById('addBmBtn');
    const bookmarksList = document.getElementById('bookmarksList');
    const jsonPreview = document.getElementById('jsonPreview');
    // Hardcoded Gist ID (Safe)
    const CLOUD_GIST_ID = "bcb0a130b9ee68d7ad56011ac4c2ebcb";

    const ghTokenInput = document.getElementById('ghToken');
    const loadCloudBtn = document.getElementById('loadCloudBtn');
    const saveCloudBtn = document.getElementById('saveCloudBtn');
    const cloudStatus = document.getElementById('cloudStatus');
    const linkPanel = document.getElementById('linkPanel');
    const rawUrlInput = document.getElementById('rawUrl');
    const copyUrlBtn = document.getElementById('copyUrlBtn');

    // Whitelist Mode Elements
    const whitelistModeToggle = document.getElementById('whitelistMode');
    const whitelistPanel = document.getElementById('whitelistPanel');
    const allowedSiteInput = document.getElementById('allowedSiteInput');
    const timeLimitInput = document.getElementById('timeLimitInput');
    const addAllowedSiteBtn = document.getElementById('addAllowedSiteBtn');
    const allowedSitesList = document.getElementById('allowedSitesList');

    // Persistence Logic (Local Storage for Token)
    ghTokenInput.value = localStorage.getItem('gh_token') || '';

    function updatePreview() {
        jsonPreview.textContent = JSON.stringify(config, null, 2);
    }

    function renderBlockedSites() {
        blockedSitesList.innerHTML = '';
        config.blocked_sites.forEach((site, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${site}</span><button data-index="${index}">Delete</button>`;
            blockedSitesList.appendChild(li);
        });
        updatePreview();
    }

    function renderBookmarks() {
        bookmarksList.innerHTML = '';
        config.cloud_bookmarks.forEach((bm, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<div><strong>${bm.title}</strong><br><small>${bm.url}</small></div><button data-index="${index}">Delete</button>`;
            bookmarksList.appendChild(li);
        });
        updatePreview();
    }

    function renderAllowedSites() {
        allowedSitesList.innerHTML = '';
        config.allowed_sites.forEach((site, index) => {
            const li = document.createElement('li');
            const timeText = site.time_limit ? ` (${site.time_limit} min)` : '';
            li.innerHTML = `<span>${site.url}${timeText}</span><button data-index="${index}">Delete</button>`;
            allowedSitesList.appendChild(li);
        });
        updatePreview();
    }

    function updateWhitelistUI() {
        whitelistModeToggle.checked = config.whitelist_mode;
        whitelistPanel.style.opacity = config.whitelist_mode ? '1' : '0.5';
    }

    // Gist Interaction
    async function saveToCloud() {
        const token = ghTokenInput.value.trim();
        const gistId = CLOUD_GIST_ID;

        if (!token) {
            alert('Please enter your GitHub Token');
            return;
        }

        localStorage.setItem('gh_token', token);

        saveCloudBtn.textContent = 'Saving...';
        saveCloudBtn.disabled = true;

        const body = {
            description: "Child Lock Browser Configuration",
            public: false,
            files: {
                "config.json": {
                    content: JSON.stringify(config, null, 2)
                }
            }
        };

        const method = gistId ? 'PATCH' : 'POST';
        const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github+json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();
                cloudStatus.innerHTML = 'Status: <span class="status-online">Connected</span>';

                // Show raw URL
                const rawUrl = data.files['config.json'].raw_url;
                rawUrlInput.value = rawUrl;
                linkPanel.style.display = 'block';

                alert('Saved to Cloud! Use the Raw URL in your browser config.');
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `API Error: ${response.status}`);
            }
        } catch (err) {
            let msg = err.message;
            if (msg.includes('Resource not accessible')) {
                msg += " (Ensure your GitHub Token has the 'gist' scope enabled)";
            }
            alert('Error: ' + msg);
            cloudStatus.innerHTML = 'Status: <span class="status-offline">Error</span>';
        } finally {
            saveCloudBtn.textContent = 'Save to Cloud & Sync';
            saveCloudBtn.disabled = false;
        }
    }

    async function loadFromCloud() {
        const token = ghTokenInput.value.trim();
        const gistId = CLOUD_GIST_ID;

        if (!token) {
            alert('Please enter your GitHub Token to load');
            return;
        }

        loadCloudBtn.textContent = 'Loading...';
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                config = JSON.parse(data.files['config.json'].content);

                browserTitleInput.value = config.browser_title;
                homepageInput.value = config.homepage;
                renderBlockedSites();
                renderBookmarks();
                renderAllowedSites();
                updateWhitelistUI();

                rawUrlInput.value = data.files['config.json'].raw_url;
                linkPanel.style.display = 'block';
                cloudStatus.innerHTML = 'Status: <span class="status-online">Connected</span>';
            }
        } catch (err) {
            alert('Load failed: ' + err.message);
        } finally {
            loadCloudBtn.textContent = 'Load from Cloud';
        }
    }

    // Event Listeners
    browserTitleInput.addEventListener('input', (e) => { config.browser_title = e.target.value; updatePreview(); });
    homepageInput.addEventListener('input', (e) => { config.homepage = e.target.value; updatePreview(); });
    addSiteBtn.addEventListener('click', () => {
        const site = siteInput.value.trim();
        if (site) { config.blocked_sites.push(site); siteInput.value = ''; renderBlockedSites(); }
    });
    blockedSitesList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') { config.blocked_sites.splice(e.target.dataset.index, 1); renderBlockedSites(); }
    });
    addBmBtn.addEventListener('click', () => {
        const title = bmTitleInput.value.trim();
        const url = bmUrlInput.value.trim();
        if (title && url) { config.cloud_bookmarks.push({ title, url, folder: "Cloud" }); bmTitleInput.value = ''; bmUrlInput.value = ''; renderBookmarks(); }
    });
    bookmarksList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') { config.cloud_bookmarks.splice(e.target.dataset.index, 1); renderBookmarks(); }
    });
    saveCloudBtn.addEventListener('click', saveToCloud);
    loadCloudBtn.addEventListener('click', loadFromCloud);
    copyUrlBtn.addEventListener('click', () => {
        rawUrlInput.select();
        document.execCommand('copy');
        alert('URL Copied to clipboard!');
    });

    // Whitelist Mode Event Listeners
    whitelistModeToggle.addEventListener('change', (e) => {
        config.whitelist_mode = e.target.checked;
        updateWhitelistUI();
        updatePreview();
    });
    addAllowedSiteBtn.addEventListener('click', () => {
        const url = allowedSiteInput.value.trim();
        const timeLimit = timeLimitInput.value ? parseInt(timeLimitInput.value) : null;
        if (url) {
            config.allowed_sites.push({ url, time_limit: timeLimit });
            allowedSiteInput.value = '';
            timeLimitInput.value = '';
            renderAllowedSites();
        }
    });
    allowedSitesList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            config.allowed_sites.splice(e.target.dataset.index, 1);
            renderAllowedSites();
        }
    });

    // Initial render
    renderBlockedSites();
    renderBookmarks();
    renderAllowedSites();
    updateWhitelistUI();

    // Auto-load if token exists
    if (ghTokenInput.value.trim()) {
        loadFromCloud();
    }
});
