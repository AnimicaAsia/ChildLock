document.addEventListener('DOMContentLoaded', () => {
    let config = {
        homepage: "https://edu.google.com",
        blocked_sites: ["youtube.com", "facebook.com"],
        browser_title: "School Protected Browser",
        cloud_bookmarks: [
            { title: "Google Classroom", url: "https://classroom.google.com", folder: "Cloud" }
        ]
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
    const ghTokenInput = document.getElementById('ghToken');
    const gistIdInput = document.getElementById('gistId');
    const loadCloudBtn = document.getElementById('loadCloudBtn');
    const saveCloudBtn = document.getElementById('saveCloudBtn');
    const cloudStatus = document.getElementById('cloudStatus');
    const linkPanel = document.getElementById('linkPanel');
    const rawUrlInput = document.getElementById('rawUrl');
    const copyUrlBtn = document.getElementById('copyUrlBtn');

    // Persistence Logic (Local Storage for Token/ID)
    ghTokenInput.value = localStorage.getItem('gh_token') || '';
    gistIdInput.value = localStorage.getItem('gist_id') || '';

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

    // Gist Interaction
    async function saveToCloud() {
        const token = ghTokenInput.value.trim();
        const gistId = gistIdInput.value.trim();

        if (!token) {
            alert('Please enter a GitHub Token');
            return;
        }

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
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();
                gistIdInput.value = data.id;
                localStorage.setItem('gh_token', token);
                localStorage.setItem('gist_id', data.id);

                cloudStatus.innerHTML = 'Status: <span class="status-online">Connected</span>';

                // Show raw URL
                const rawUrl = data.files['config.json'].raw_url;
                rawUrlInput.value = rawUrl;
                linkPanel.style.display = 'block';

                alert('Saved to Cloud! Use the Raw URL in your browser config.');
            } else {
                throw new Error('Failed to save to Gist');
            }
        } catch (err) {
            alert('Error: ' + err.message);
            cloudStatus.innerHTML = 'Status: <span class="status-offline">Error</span>';
        } finally {
            saveCloudBtn.textContent = 'Save to Cloud & Sync';
            saveCloudBtn.disabled = false;
        }
    }

    async function loadFromCloud() {
        const token = ghTokenInput.value.trim();
        const gistId = gistIdInput.value.trim();

        if (!token || !gistId) {
            alert('Need Token and Gist ID to load');
            return;
        }

        loadCloudBtn.textContent = 'Loading...';
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: { 'Authorization': `token ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                config = JSON.parse(data.files['config.json'].content);

                browserTitleInput.value = config.browser_title;
                homepageInput.value = config.homepage;
                renderBlockedSites();
                renderBookmarks();

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

    // Initial render
    renderBlockedSites();
    renderBookmarks();
});
