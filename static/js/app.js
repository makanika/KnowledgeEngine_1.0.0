document.addEventListener('DOMContentLoaded', function() {
    // This event listener ensures that the script runs only after the entire
    // HTML document has been loaded and parsed by the browser.

    // --- MOCK DATA ---
    // In a real application, this data would be fetched from your Django backend API.
    const mockTickets = [
        { number: 'INC001001', priority: '1 - Critical', state: 'In Progress', short_description: 'UPS A-line is offline; running on battery', assignee: 'Okello', updated: '2025-07-30 10:05:23', description: 'The primary UPS for A-line is reporting a fault and has failed over to battery backup. All racks are still online but have limited runtime. Immediate investigation of the UPS unit is required.', activity_log: [ { user: 'System (BMS)', time: '09:45:11', entry: 'Ticket created from automated alert.' }, { user: 'Okello', time: '09:46:30', entry: 'Assigned to self. Acknowledged. On my way to the facility now.' } ] },
        { number: 'INC001002', priority: '2 - High', state: 'New', short_description: 'Generator fuel level below 25%', assignee: 'Mugisha', updated: '2025-07-30 11:15:02', description: 'The primary diesel generator is reporting a low fuel level. Refueling needs to be scheduled within the next 24 hours to ensure site readiness.', activity_log: [ { user: 'BMS Alert', time: '11:15:02', entry: 'Ticket created based on automated fuel sensor reading.' } ] },
        { number: 'INC001003', priority: '3 - Moderate', state: 'Resolved', short_description: 'IRAC unit in cold aisle 3 reporting high temp', assignee: 'Nantale', updated: '2025-07-29 16:30:00', description: 'The In-Row Air Conditioning unit for cold aisle 3 is reporting an outlet temperature of 28°C, which is above the 24°C threshold. Filter may need cleaning.', activity_log: [ { user: 'Nantale', time: '14:00:15', entry: 'Ticket created.' }, { user: 'Nantale', time: '16:25:00', entry: 'Cleaned the air filter on the unit. Temperatures have returned to normal.' }, { user: 'Okello', time: '16:30:00', entry: 'Verified temps are stable. Resolving ticket.' } ] },
    ];
    const mockAssets = {
        power: { ups_a: { load: 78 }, ups_b: { load: 81 }, pue: 1.45 },
        cooling: { iac1: { temp: 22.1, humidity: 45, status: 'Online' }, iac2: { temp: 22.3, humidity: 46, status: 'Online' }, iac3: { temp: 28.1, humidity: 44, status: 'Warning' } },
        batteries: { bank_a: { cells: 100, health: 'Good', runtime: '45 min' }, bank_b: { cells: 100, health: 'Warning', runtime: '42 min' } },
        plumbing: { pump1: { status: 'Online', flow_rate: 1500 }, pump2: { status: 'Online', flow_rate: 1510 }, pump3: { status: 'Standby', flow_rate: 0 } },
        fire: { room_a: { status: 'Normal', pressure: 300 }, room_b: { status: 'Warning', pressure: 295 } },
        generators: { gen_a: { status: 'Standby', fuel: 85, hours: 1423 }, gen_b: { status: 'Standby', fuel: 86, hours: 1398 } },
        cameras: { cam01: { status: 'Online' }, cam02: { status: 'Offline' }, cam03: { status: 'Online' }, cam04: { status: 'Online' } }
    };
    const mockLogs = {
        'UPS A': [ { time: '10:01:15', message: 'Input voltage normal' }, { time: '09:45:10', message: 'Utility power lost, switching to battery' } ],
        'IAC 3': [ { time: '16:25:00', message: 'Filter pressure normalized' }, { time: '14:00:14', message: 'High temperature alarm triggered' } ],
    };

    // --- DOM ELEMENTS CACHING---
    const ticketListBody = document.getElementById('ticket-list');
    const detailsPanel = document.getElementById('details-panel');
    const searchInput = document.getElementById('search-input');
    const viewTabs = document.querySelectorAll('.view-tab');
    const views = {
        'incidents-view': document.getElementById('incidents-view'),
        'dashboard-view': document.getElementById('dashboard-view'),
        'new-incident-view': document.getElementById('new-incident-view'),
        'escalation-view': document.getElementById('escalation-view'),
        'plan-view': document.getElementById('plan-view'),
        'profile-view': document.getElementById('profile-view')
    };
    const assetTabs = document.querySelectorAll('.asset-tab');
    const assetViews = document.querySelectorAll('.asset-view');

    // --- RENDER FUNCTIONS ---
    const priorityClasses = { '1 - Critical': 'priority-1', '2 - High': 'priority-2', '3 - Moderate': 'priority-3', '4 - Low': 'priority-4' };
    const stateClasses = { 'New': 'state-new', 'In Progress': 'state-in-progress', 'Resolved': 'state-resolved' };
    
    function getStatusClass(status) {
        const s = String(status).toLowerCase();
        if (s.includes('good') || s.includes('normal') || s.includes('online')) return 'status-good';
        if (s.includes('warning') || s.includes('standby')) return 'status-warning';
        if (s.includes('critical') || s.includes('offline')) return 'status-critical';
        return '';
    }

    function renderTicketList(tickets) {
        ticketListBody.innerHTML = '';
        tickets.forEach(ticket => {
            const row = document.createElement('tr');
            row.className = 'ticket-row';
            row.dataset.id = ticket.number;
            row.innerHTML = `
                <td>${ticket.number}</td>
                <td><span class="status-badge ${priorityClasses[ticket.priority] || ''}">${ticket.priority}</span></td>
                <td><span class="status-badge ${stateClasses[ticket.state] || ''}">${ticket.state}</span></td>
                <td>${ticket.short_description}</td>
                <td>${ticket.assignee}</td>`;
            row.addEventListener('click', () => renderDetails(ticket));
            ticketListBody.appendChild(row);
        });
    }

    function renderDetails(item) {
        document.querySelectorAll('.ticket-row.active, .asset-card.active').forEach(r => r.classList.remove('active'));

        if (item.number) { // It's a ticket
            document.querySelector(`.ticket-row[data-id="${item.number}"]`)?.classList.add('active');
            let activityHtml = item.activity_log.map(log => `<div class="log-item"><p class="log-meta">${log.user} @ ${log.time}</p><p class="log-entry">${log.entry}</p></div>`).join('');
            detailsPanel.innerHTML = `
                <div class="details-header"><h3>${item.number}: ${item.short_description}</h3></div>
                <div class="details-body">
                    <div class="details-grid">
                        <div><label>State</label><p>${item.state}</p></div>
                        <div><label>Priority</label><p>${item.priority}</p></div>
                        <div><label>Assignee</label><p>${item.assignee}</p></div>
                        <div><label>Last Updated</label><p>${item.updated}</p></div>
                    </div>
                    <div><label>Description</label><p>${item.description}</p></div>
                    <hr>
                    <div class="activity-log"><h4>Activity Log</h4>${activityHtml}</div>
                </div>
                <div class="details-footer">
                    <button class="button-primary" style="flex:1;">Update</button>
                    <button class="button-secondary">Resolve</button>
                </div>`;
        } else { // It's an asset
            document.querySelector(`.asset-card[data-id="${item.id}"]`)?.classList.add('active');
            const logs = mockLogs[item.id] || [];
            let detailsHtml = Object.entries(item.details).map(([key, value]) => {
                let valueHtml = `<p>${value}</p>`;
                const statusClass = getStatusClass(value);
                if (statusClass) {
                    valueHtml = `<p><span class="status-badge ${statusClass}">${value}</span></p>`;
                }
                return `<div><label>${key.replace(/_/g, ' ')}</label>${valueHtml}</div>`;
            }).join('');
            detailsPanel.innerHTML = `
                <div class="details-header"><h3>Asset Details: ${item.id}</h3></div>
                <div class="details-body">
                    <div class="details-grid">${detailsHtml}</div>
                    <hr>
                    <div id="asset-log-container"></div>
                </div>`;
            createLogPaginator(detailsPanel.querySelector('#asset-log-container'), logs, 5);
        }
    }

    function createLogPaginator(container, logs, itemsPerPage) {
        if (!container) return;
        container.innerHTML = `<h4>System Logs</h4><table class="data-table"><thead><tr><th>Time</th><th>Message</th></tr></thead><tbody class="log-list"></tbody></table><div class="pagination-controls" style="display:flex; justify-content:space-between; margin-top:0.5rem; font-size:0.8rem;"><button class="prev-btn">Prev</button><span class="page-info"></span><button class="next-btn">Next</button></div>`;
        
        let currentPage = 1;
        const totalPages = Math.ceil(logs.length / itemsPerPage);
        const logList = container.querySelector('.log-list');
        const pageInfo = container.querySelector('.page-info');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');

        function renderLogs() {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            logList.innerHTML = logs.slice(start, end).map(log => `<tr><td>${log.time}</td><td>${log.message}</td></tr>`).join('') || '<tr><td colspan="2">No logs found.</td></tr>';
            pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        }

        prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderLogs(); } });
        nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderLogs(); } });
        renderLogs();
    }

    function createAssetCard(id, title, value, unit, details) {
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.dataset.id = id;
        card.innerHTML = `<h3>${title}</h3><p>${value} <span>${unit}</span></p>`;
        card.addEventListener('click', () => renderDetails({ id, details }));
        return card;
    }
    
    function renderAssetDashboard() {
        // Power
        const powerPane = document.getElementById('power-asset');
        powerPane.innerHTML = `<div style="grid-column: 1 / -1;"><canvas id="pueChart" style="max-height: 150px;"></canvas></div>`;
        powerPane.appendChild(createAssetCard('UPS A', 'UPS A Load', mockAssets.power.ups_a.load, '%', { Name: 'UPS A', ...mockAssets.power.ups_a }));
        powerPane.appendChild(createAssetCard('UPS B', 'UPS B Load', mockAssets.power.ups_b.load, '%', { Name: 'UPS B', ...mockAssets.power.ups_b }));
        powerPane.appendChild(createAssetCard('PUE', 'PUE', mockAssets.power.pue, '', { Name: 'PUE', Value: mockAssets.power.pue }));
        new Chart(document.getElementById('pueChart'), { type: 'line', data: { labels: ['-24h', '-12h', '-6h', 'Now'], datasets: [{ data: [1.48, 1.46, 1.47, 1.45], borderColor: '#3a5a40', tension: 0.1, fill: false }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } } });
        
        // Other assets
        Object.entries(mockAssets.cooling).forEach(([key, value]) => document.getElementById('cooling-asset').appendChild(createAssetCard(key.toUpperCase(), `${key.toUpperCase()} Temp`, value.temp, '°C', { Name: key.toUpperCase(), ...value })));
        Object.entries(mockAssets.batteries).forEach(([key, value]) => document.getElementById('batteries-asset').appendChild(createAssetCard(key.replace('_', ' ').toUpperCase(), `${key.replace('_', ' ').toUpperCase()} Health`, value.health, '', { Name: key.replace('_', ' ').toUpperCase(), ...value })));
        Object.entries(mockAssets.plumbing).forEach(([key, value]) => document.getElementById('plumbing-asset').appendChild(createAssetCard(key, key.replace('_', ' ').toUpperCase(), value.level || value.flow_rate || value.status, value.level ? '%' : 'L/m', { Name: key.replace('_', ' ').toUpperCase(), ...value })));
        Object.entries(mockAssets.fire).forEach(([key, value]) => document.getElementById('fire-asset').appendChild(createAssetCard(key, key.replace('_', ' ').toUpperCase(), value.pressure, 'PSI', { Name: key.replace('_', ' ').toUpperCase(), ...value })));
        Object.entries(mockAssets.generators).forEach(([key, value]) => document.getElementById('generators-asset').appendChild(createAssetCard(key, key.replace('_', ' ').toUpperCase(), value.fuel, '% Fuel', { Name: key.replace('_', ' ').toUpperCase(), ...value })));
        
        // Cameras require special rendering
        const camPane = document.getElementById('cameras-asset');
        Object.entries(mockAssets.cameras).forEach(([key, value]) => {
            const card = document.createElement('div');
            card.className = `asset-card ${value.status === 'Offline' ? 'offline' : ''}`;
            card.dataset.id = key;
            card.innerHTML = `<h3>${key.toUpperCase()}</h3><p class="status-text ${value.status === 'Offline' ? 'status-offline' : 'status-online'}">${value.status}</p>`;
            card.addEventListener('click', () => renderDetails({ id: key.toUpperCase(), details: { Name: key.toUpperCase(), Status: value.status } }));
            camPane.appendChild(card);
        });
    }

    function renderUserProfile() {
        const profileView = document.getElementById('profile-view');
        const resolvedTickets = mockTickets.filter(t => t.assignee === 'Okello' && t.state === 'Resolved');
        profileView.innerHTML = `
            <h2>Engineer Profile: Okello</h2>
            <div class="profile-grid">
                <div class="profile-card">
                    <h3>Details</h3>
                    <p><strong>Current Shift:</strong> 08:00 - 20:00</p>
                    <p><strong>Status:</strong> <span style="color:#166534; font-weight:700;">On Duty</span></p>
                    <h4 style="margin-top:1rem;">Core Competencies</h4>
                    <ul>
                        <li>Schneider Electric UPS Certified</li>
                        <li>Advanced Diesel Generator Maintenance</li>
                        <li>Building Management System (BMS) Operation</li>
                    </ul>
                </div>
                <div class="profile-card" style="grid-column: span 2;">
                    <h3>Recently Resolved Incidents</h3>
                    <ul class="resolved-list">
                        ${resolvedTickets.map(t => `<li><strong>${t.number}:</strong> ${t.short_description}</li>`).join('') || '<li>No resolved incidents found.</li>'}
                    </ul>
                </div>
            </div>
        `;
    }

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        renderTicketList(mockTickets.filter(ticket => ticket.number.toLowerCase().includes(searchTerm) || ticket.short_description.toLowerCase().includes(searchTerm)));
    });

    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.target;
            viewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.values(views).forEach(view => view.classList.add('hidden'));
            if (views[targetId]) views[targetId].classList.remove('hidden');
        });
    });

    assetTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.asset;
            assetTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            assetViews.forEach(view => view.classList.toggle('hidden', view.id !== `${targetId}-asset`));
        });
    });

    document.querySelectorAll('[data-comment-submit]').forEach(button => {
        button.addEventListener('click', () => {
            const phase = button.dataset.commentSubmit;
            const textarea = document.querySelector(`[data-comment-input="${phase}"]`);
            const commentArea = document.querySelector(`[data-comment-area="${phase}"]`);
            if (textarea.value.trim()) {
                const newComment = document.createElement('div');
                newComment.innerHTML = `<p>${textarea.value}</p><p style="font-size:0.75rem; text-align:right;">- Customer @ ${new Date().toLocaleTimeString()}</p>`;
                commentArea.appendChild(newComment);
                textarea.value = '';
            }
        });
    });

    document.getElementById('user-profile-button').addEventListener('click', () => {
        viewTabs.forEach(t => t.classList.remove('active'));
        Object.values(views).forEach(view => view.classList.add('hidden'));
        if(views['profile-view']) {
            views['profile-view'].classList.remove('hidden');
            renderUserProfile();
        }
    });

    // --- INITIAL RENDER ---
    if (mockTickets.length > 0) {
        renderTicketList(mockTickets);
        renderDetails(mockTickets[0]);
    }
    renderAssetDashboard();
    document.querySelector('.view-tab[data-target="dashboard-view"]')?.click();
    document.querySelector('.ticket-row')?.classList.add('active');
});
