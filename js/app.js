// State & Default Data Initialization
let db = {
    users: [
        { id: '1', name: 'Super Admin', email: 'admin@reseller.com', password: 'admin123', role: 'admin', balance: 1000 },
        { id: '2', name: 'Demo Reseller', email: 'reseller@test.com', password: 'pass123', role: 'reseller', balance: 50 }
    ],
    keys: [
        { id: 'k1', key: 'KEY-7X9P-2M4Q-8W1L', tier: '30 Days', cost: 35, note: 'Client Test', status: 'Active', ownerEmail: 'reseller@test.com' }
    ],
    apps: [
        { id: 'a1', name: 'Pro Client Tool', version: 'v1.4.2', description: 'Advanced automation tool with login & key verification support.', url: 'https://example.com/download/pro-client.apk' },
        { id: 'a2', name: 'Reseller Companion APK', version: 'v2.0.0', description: 'Official Android companion app for mobile key distribution.', url: 'https://example.com/download/companion.apk' }
    ]
};

let currentUser = null;

// LocalStorage Persistence
function loadData() {
    const saved = localStorage.getItem('reseller_panel_db');
    if (saved) {
        try {
            db = JSON.parse(saved);
        } catch(e) {
            console.error('Error loading database', e);
        }
    }
}

function saveData() {
    localStorage.setItem('reseller_panel_db', JSON.stringify(db));
}

// UI Notification Toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Navigation & Tab Switching
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    checkExistingSession();
});

function setupEventListeners() {
    // Auth Tabs
    document.querySelectorAll('.auth-card .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.auth-card .tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const targetTab = e.target.getAttribute('data-tab');
            if (targetTab === 'login') {
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('registerForm').classList.add('hidden');
            } else {
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('registerForm').classList.remove('hidden');
            }
        });
    });

    // Login Form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value.trim();

        const user = db.users.find(u => u.email === email && u.password === pass);
        if (user) {
            currentUser = user;
            localStorage.setItem('reseller_current_user', JSON.stringify(user));
            initDashboard();
            showToast('Login successful!');
        } else {
            showToast('Invalid email or password!');
        }
    });

    // Register Form
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const pass = document.getElementById('regPassword').value.trim();

        if (db.users.some(u => u.email === email)) {
            showToast('Email already registered!');
            return;
        }

        const newUser = {
            id: 'u_' + Date.now(),
            name,
            email,
            password: pass,
            role: 'reseller',
            balance: 10 // Welcome bonus credits
        };

        db.users.push(newUser);
        saveData();

        currentUser = newUser;
        localStorage.setItem('reseller_current_user', JSON.stringify(newUser));
        initDashboard();
        showToast('Account created successfully with 10 welcome credits!');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('reseller_current_user');
        document.getElementById('dashboardView').classList.remove('active');
        document.getElementById('authView').classList.add('active');
        showToast('Logged out successfully.');
    });

    // Sidebar Nav Items
    document.querySelectorAll('.sidebar .nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sidebar .nav-item').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const sectionId = e.target.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Generate Key Form
    document.getElementById('generateKeyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const cost = parseInt(document.getElementById('keyTierSelect').value);
        const note = document.getElementById('keyNote').value.trim() || 'General Key';
        const tierText = document.getElementById('keyTierSelect').selectedOptions[0].text.split(' (')[0];

        // Reload fresh user balance
        const freshUser = db.users.find(u => u.id === currentUser.id);
        if (freshUser.balance < cost) {
            showToast('Insufficient balance! Please contact admin to add credits.');
            return;
        }

        // Deduct balance
        freshUser.balance -= cost;
        currentUser.balance = freshUser.balance;
        localStorage.setItem('reseller_current_user', JSON.stringify(currentUser));

        // Generate Random License Key
        const newKey = {
            id: 'k_' + Date.now(),
            key: 'KEY-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            tier: tierText,
            cost: cost,
            note: note,
            status: 'Active',
            ownerEmail: currentUser.email
        };

        db.keys.push(newKey);
        saveData();

        document.getElementById('keyNote').value = '';
        renderDashboardData();
        showToast('License key generated successfully!');
    });

    // Upload App Form (Admin Only)
    const uploadForm = document.getElementById('uploadAppForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('appName').value.trim();
            const version = document.getElementById('appVersion').value.trim();
            const description = document.getElementById('appDesc').value.trim();
            const url = document.getElementById('appFileUrl').value.trim();

            const newApp = {
                id: 'a_' + Date.now(),
                name,
                version,
                description,
                url
            };

            db.apps.push(newApp);
            saveData();
            uploadForm.reset();
            renderDashboardData();
            showToast('Application published successfully!');
        });
    }
}

function checkExistingSession() {
    const savedUser = localStorage.getItem('reseller_current_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            // Sync with db
            const fresh = db.users.find(u => u.id === currentUser.id);
            if (fresh) {
                currentUser = fresh;
                initDashboard();
            }
        } catch(e) {
            console.error('Session restore failed', e);
        }
    }
}

function initDashboard() {
    document.getElementById('authView').classList.remove('active');
    document.getElementById('dashboardView').classList.add('active');

    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userRoleBadge').textContent = currentUser.role.toUpperCase();

    if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }

    renderDashboardData();
}

function renderDashboardData() {
    // Refresh current user balance
    const freshUser = db.users.find(u => u.id === currentUser.id);
    if (freshUser) {
        currentUser = freshUser;
        document.getElementById('userBalanceCredits').textContent = currentUser.balance;
        document.getElementById('statBalance').textContent = currentUser.balance + ' Credits';
    }

    // Filter keys for reseller, show all for admin
    const userKeys = currentUser.role === 'admin' ? db.keys : db.keys.filter(k => k.ownerEmail === currentUser.email);
    document.getElementById('statKeysCount').textContent = userKeys.length;
    document.getElementById('statAppsCount').textContent = db.apps.length;

    // Render Keys Table
    const keysTbody = document.getElementById('keysTableBody');
    keysTbody.innerHTML = '';
    if (userKeys.length === 0) {
        keysTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No keys generated yet.</td></tr>';
    } else {
        userKeys.forEach(k => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${k.key}</code></td>
                <td>${k.tier}</td>
                <td>${k.cost} Credits</td>
                <td>${k.note}</td>
                <td><span class="badge">${k.status}</span></td>
                <td><button class="btn danger-btn" onclick="revokeKey('${k.id}')">Revoke</button></td>
            `;
            keysTbody.appendChild(tr);
        });
    }

    // Render Apps Grid
    const appsGrid = document.getElementById('appsGrid');
    appsGrid.innerHTML = '';
    db.apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-version">${app.version}</div>
            <h3>${app.name}</h3>
            <p>${app.description}</p>
            <a href="${app.url}" target="_blank" class="btn primary-btn" style="text-align:center; text-decoration:none;">Download App / APK</a>
            ${currentUser.role === 'admin' ? `<button class="btn danger-btn" onclick="deleteApp('${app.id}')">Delete App</button>` : ''}
        `;
        appsGrid.appendChild(card);
    });

    // Render Resellers Table for Admin
    if (currentUser.role === 'admin') {
        const resellersTbody = document.getElementById('resellersTableBody');
        resellersTbody.innerHTML = '';
        db.users.filter(u => u.role === 'reseller').forEach(res => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${res.name}</td>
                <td>${res.email}</td>
                <td><strong>${res.balance} Credits</strong></td>
                <td>
                    <button class="btn primary-btn" style="padding: 6px 12px; font-size: 12px;" onclick="addCredits('${res.id}', 50)">+50 Credits</button>
                    <button class="btn secondary-btn" style="padding: 6px 12px; font-size: 12px; margin-left:6px;" onclick="addCredits('${res.id}', 100)">+100 Credits</button>
                </td>
            `;
            resellersTbody.appendChild(tr);
        });
    }
}

function selectPricingTier(cost, tierName) {
    document.getElementById('keyTierSelect').value = cost;
    switchSection('keysSection');
    showToast('Selected ' + tierName + ' tier. Generate your key now.');
}

function switchSection(sectionId) {
    document.querySelectorAll('.sidebar .nav-item').forEach(b => b.classList.remove('active'));
    const targetNav = document.querySelector(`.sidebar .nav-item[data-section="${sectionId}"]`);
    if (targetNav) targetNav.classList.add('active');

    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

function revokeKey(keyId) {
    db.keys = db.keys.filter(k => k.id !== keyId);
    saveData();
    renderDashboardData();
    showToast('License key revoked.');
}

function deleteApp(appId) {
    db.apps = db.apps.items ? db.apps : db.apps.filter(a => a.id !== appId);
    saveData();
    renderDashboardData();
    showToast('Application deleted.');
}

function addCredits(userId, amount) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
        user.balance += amount;
        saveData();
        renderDashboardData();
        showToast('Successfully added ' + amount + ' credits to ' + user.name);
    }
                                              }
