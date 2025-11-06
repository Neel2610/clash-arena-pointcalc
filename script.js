// ========================================
// CLASH ARENA ESP MANAGER - CORE SCRIPT
// Version: 1.6.1 - Bug Fixes
// ========================================

/**
 * Application Configuration
 */
const APP_CONFIG = {
    name: 'Clash Arena ESP Manager',
    version: '1.6.1',
    maxLobbies: 4,
    maxTeams: 12,
    maxMatches: 6,
    storageKey: 'clashArenaData'
};

/**
 * Points System Configuration
 * Booyah no longer adds +1 point, only used for tiebreaking
 */
const POINTS_SYSTEM = {
    kill: 1,
    placement: {
        1: 12,
        2: 9,
        3: 8,
        4: 7,
        5: 6,
        6: 5,
        7: 4,
        8: 3,
        9: 2,
        10: 1,
        11: 0,
        12: 0
    },
    booyahBonus: 0
};

/**
 * Application State
 */
let appState = {
    lobbies: [],
    currentLobbyId: null,
    initialized: false
};

/**
 * Lobby to be deleted (temp storage)
 */
let lobbyToDelete = null;

/**
 * Initialize Application
 */
function initializeApp() {
    console.log('🔥 Clash Arena ESP Manager initialized');
    console.log(`📦 Version: ${APP_CONFIG.version}`);
    
    // Check for localStorage support
    if (typeof Storage !== 'undefined') {
        console.log('💾 LocalStorage available');
        loadAppData();
    } else {
        console.warn('⚠️ LocalStorage not available');
    }
    
    appState.initialized = true;
    console.log('✅ System ready');
    
    // Initialize UI
    initializeUI();
    updateLobbyListUI();
}

/**
 * Initialize UI Event Listeners
 */
function initializeUI() {
    // Create lobby buttons
    const createBtn = document.getElementById('createLobbyBtn');
    const createFirstBtn = document.getElementById('createFirstLobby');
    
    if (createBtn) createBtn.addEventListener('click', openCreateModal);
    if (createFirstBtn) createFirstBtn.addEventListener('click', openCreateModal);
    
    // Modal controls
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmCreateBtn');
    
    if (modalClose) modalClose.addEventListener('click', closeCreateModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeCreateModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCreateModal);
    if (confirmBtn) confirmBtn.addEventListener('click', createLobby);
    
    // Delete modal controls
    const deleteClose = document.getElementById('deleteModalClose');
    const deleteOverlay = document.getElementById('deleteModalOverlay');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (deleteClose) deleteClose.addEventListener('click', closeDeleteModal);
    if (deleteOverlay) deleteOverlay.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    // Lobby detail controls
    const backBtn = document.getElementById('backToLobbies');
    const addMatchBtn = document.getElementById('addMatchBtn');
    const closeFormBtn = document.getElementById('closeMatchForm');
    const cancelMatchBtn = document.getElementById('cancelMatchBtn');
    const saveMatchBtn = document.getElementById('saveMatchBtn');
    const exportBtn = document.getElementById('exportTableBtn');
    
    if (backBtn) backBtn.addEventListener('click', showLobbyList);
    if (addMatchBtn) addMatchBtn.addEventListener('click', showMatchForm);
    if (closeFormBtn) closeFormBtn.addEventListener('click', hideMatchForm);
    if (cancelMatchBtn) cancelMatchBtn.addEventListener('click', hideMatchForm);
    if (saveMatchBtn) saveMatchBtn.addEventListener('click', saveMatchResults);
    if (exportBtn) exportBtn.addEventListener('click', exportTable);
    
    // Enter key in lobby name input
    const lobbyNameInput = document.getElementById('lobbyName');
    if (lobbyNameInput) {
        lobbyNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createLobby();
            }
        });
    }
    
    console.log('🎨 UI initialized');
}

/**
 * Load application data from localStorage
 */
function loadAppData() {
    try {
        const savedData = localStorage.getItem(APP_CONFIG.storageKey);
        if (savedData) {
            appState.lobbies = JSON.parse(savedData);
            console.log(`📥 Loaded ${appState.lobbies.length} lobbies`);
        } else {
            console.log('📝 No saved data found');
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

/**
 * Save application data to localStorage
 */
function saveAppData() {
    try {
        localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(appState.lobbies));
        console.log('💾 Data saved');
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

/**
 * Generate unique lobby ID
 */
function generateLobbyId() {
    return 'lobby_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Open create lobby modal
 */
function openCreateModal() {
    if (appState.lobbies.length >= APP_CONFIG.maxLobbies) {
        alert(`Maximum ${APP_CONFIG.maxLobbies} lobbies allowed`);
        return;
    }
    
    const modal = document.getElementById('createLobbyModal');
    const input = document.getElementById('lobbyName');
    
    if (modal) modal.classList.add('active');
    if (input) {
        input.value = '';
        input.focus();
    }
    
    console.log('📝 Create modal opened');
}

/**
 * Close create lobby modal
 */
function closeCreateModal() {
    const modal = document.getElementById('createLobbyModal');
    if (modal) modal.classList.remove('active');
    console.log('❌ Create modal closed');
}

/**
 * Create new lobby
 */
function createLobby() {
    const input = document.getElementById('lobbyName');
    if (!input) return;
    
    const lobbyName = input.value.trim();
    
    if (!lobbyName) {
        alert('Please enter a lobby name');
        input.focus();
        return;
    }
    
    if (lobbyName.length > 30) {
        alert('Lobby name must be 30 characters or less');
        return;
    }
    
    if (appState.lobbies.length >= APP_CONFIG.maxLobbies) {
        alert(`Maximum ${APP_CONFIG.maxLobbies} lobbies allowed`);
        return;
    }
    
    const newLobby = {
        id: generateLobbyId(),
        name: lobbyName,
        teams: initializeTeams(),
        matches: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    appState.lobbies.push(newLobby);
    
    saveAppData();
    updateLobbyListUI();
    closeCreateModal();
    
    console.log(`✅ Lobby created: ${lobbyName}`);
}

/**
 * Initialize teams for a new lobby
 */
function initializeTeams() {
    const teams = [];
    for (let i = 1; i <= APP_CONFIG.maxTeams; i++) {
        teams.push({
            id: `team_${i}`,
            name: `Team ${i}`,
            totalPoints: 0,
            placementPoints: 0,
            killPoints: 0,
            booyahs: 0,
            matches: []
        });
    }
    return teams;
}

/**
 * Open delete lobby modal
 */
function openDeleteModal(lobbyId) {
    const lobby = appState.lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;
    
    lobbyToDelete = lobbyId;
    
    const modal = document.getElementById('deleteLobbyModal');
    const nameElement = document.getElementById('deleteLobbyName');
    
    if (nameElement) nameElement.textContent = lobby.name;
    if (modal) modal.classList.add('active');
    
    console.log(`⚠️ Delete confirmation: ${lobby.name}`);
}

/**
 * Close delete lobby modal
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteLobbyModal');
    if (modal) modal.classList.remove('active');
    lobbyToDelete = null;
}

/**
 * Confirm and delete lobby
 */
function confirmDelete() {
    if (!lobbyToDelete) return;
    
    const lobbyIndex = appState.lobbies.findIndex(l => l.id === lobbyToDelete);
    if (lobbyIndex === -1) return;
    
    const deletedLobby = appState.lobbies[lobbyIndex];
    appState.lobbies.splice(lobbyIndex, 1);
    
    if (appState.currentLobbyId === lobbyToDelete) {
        appState.currentLobbyId = null;
        showLobbyList();
    }
    
    saveAppData();
    updateLobbyListUI();
    closeDeleteModal();
    
    console.log(`🗑️ Lobby deleted: ${deletedLobby.name}`);
}

/**
 * Delete lobby - GLOBAL FUNCTION
 */
window.deleteLobby = function(lobbyId) {
    openDeleteModal(lobbyId);
};

/**
 * View/Open lobby detail - GLOBAL FUNCTION
 */
window.viewLobby = function(lobbyId) {
    const lobby = appState.lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;
    
    appState.currentLobbyId = lobbyId;
    
    const listView = document.getElementById('lobbyListView');
    const detailView = document.getElementById('lobbyDetailView');
    
    if (listView) listView.classList.add('hidden');
    if (detailView) detailView.classList.remove('hidden');
    
    updateLobbyDetailUI();
    
    console.log(`👁️ Viewing lobby: ${lobby.name}`);
};

/**
 * Show lobby list view
 */
function showLobbyList() {
    appState.currentLobbyId = null;
    
    const listView = document.getElementById('lobbyListView');
    const detailView = document.getElementById('lobbyDetailView');
    
    if (detailView) detailView.classList.add('hidden');
    if (listView) listView.classList.remove('hidden');
    
    updateLobbyListUI();
}

/**
 * Update lobby list UI
 */
function updateLobbyListUI() {
    updateStats();
    renderLobbies();
    toggleEmptyState();
}

/**
 * Update statistics
 */
function updateStats() {
    const totalLobbies = appState.lobbies.length;
    const totalTeams = totalLobbies * APP_CONFIG.maxTeams;
    const totalMatches = appState.lobbies.reduce((sum, lobby) => sum + lobby.matches.length, 0);
    
    const lobbiesEl = document.getElementById('totalLobbies');
    const teamsEl = document.getElementById('totalTeams');
    const matchesEl = document.getElementById('totalMatches');
    
    if (lobbiesEl) lobbiesEl.textContent = totalLobbies;
    if (teamsEl) teamsEl.textContent = totalTeams;
    if (matchesEl) matchesEl.textContent = totalMatches;
}

/**
 * Render all lobby cards
 */
function renderLobbies() {
    const container = document.getElementById('lobbiesGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    appState.lobbies.forEach(lobby => {
        const card = createLobbyCard(lobby);
        container.appendChild(card);
    });
}

/**
 * Create a lobby card element
 */
function createLobbyCard(lobby) {
    const card = document.createElement('div');
    card.className = 'lobby-card';
    card.onclick = () => window.viewLobby(lobby.id);
    
    const matchCount = lobby.matches.length;
    const maxMatches = APP_CONFIG.maxMatches;
    
    card.innerHTML = `
        <div class="lobby-card-header">
            <div class="lobby-info">
                <h3 class="lobby-name">${escapeHtml(lobby.name)}</h3>
                <div class="lobby-id">${lobby.id}</div>
            </div>
            <div class="lobby-actions">
                <button class="action-btn delete" onclick="event.stopPropagation(); window.deleteLobby('${lobby.id}')" title="Delete Lobby">
                    🗑️
                </button>
            </div>
        </div>
        <div class="lobby-stats-mini">
            <div class="stat-mini">
                <div class="stat-mini-value">${APP_CONFIG.maxTeams}</div>
                <div class="stat-mini-label">Teams</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-value">${matchCount}/${maxMatches}</div>
                <div class="stat-mini-label">Matches</div>
            </div>
            <div class="stat-mini">
                <div class="stat-mini-value">${calculateLobbyTotalPoints(lobby)}</div>
                <div class="stat-mini-label">Points</div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Calculate total points in a lobby
 */
function calculateLobbyTotalPoints(lobby) {
    return lobby.teams.reduce((sum, team) => sum + team.totalPoints, 0);
}

/**
 * Toggle empty state visibility
 */
function toggleEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const lobbiesGrid = document.getElementById('lobbiesGrid');
    
    if (appState.lobbies.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (lobbiesGrid) lobbiesGrid.style.display = 'none';
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        if (lobbiesGrid) lobbiesGrid.style.display = 'grid';
    }
}

/**
 * Update lobby detail UI
 */
function updateLobbyDetailUI() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    const nameEl = document.getElementById('currentLobbyName');
    const idEl = document.getElementById('currentLobbyId');
    const countEl = document.getElementById('currentMatchCount');
    
    if (nameEl) nameEl.textContent = lobby.name;
    if (idEl) idEl.textContent = lobby.id;
    if (countEl) countEl.textContent = `Match ${lobby.matches.length}/${APP_CONFIG.maxMatches}`;
    
    renderRankingsTable();
    renderMatchHistory();
    hideMatchForm();
}

/**
 * Get current lobby
 */
function getCurrentLobby() {
    return appState.lobbies.find(l => l.id === appState.currentLobbyId);
}

/**
 * Show match input form
 */
function showMatchForm() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    if (lobby.matches.length >= APP_CONFIG.maxMatches) {
        alert(`Maximum ${APP_CONFIG.maxMatches} matches per lobby reached`);
        return;
    }
    
    const form = document.getElementById('matchForm');
    if (form) form.classList.remove('hidden');
    
    renderMatchFormInputs();
}

/**
 * Hide match input form
 */
function hideMatchForm() {
    const form = document.getElementById('matchForm');
    if (form) form.classList.add('hidden');
}

/**
 * Render match form inputs with editable team names
 */
function renderMatchFormInputs() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    const container = document.getElementById('matchFormGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    lobby.teams.forEach((team, index) => {
        const row = document.createElement('div');
        row.className = 'team-input-row';
        
        row.innerHTML = `
            <div class="team-name-input-wrapper">
                <span class="team-number-label">Team ${index + 1}</span>
                <input 
                    type="text" 
                    class="team-name-editable" 
                    id="teamname_${index}" 
                    value="${escapeHtml(team.name)}"
                    maxlength="25"
                    placeholder="Team name"
                >
            </div>
            <input 
                type="number" 
                class="input-small" 
                id="placement_${index}" 
                placeholder="Place (1-12)" 
                min="1" 
                max="12"
                value="${index + 1}"
            >
            <input 
                type="number" 
                class="input-small" 
                id="kills_${index}" 
                placeholder="Kills" 
                min="0"
                value="0"
            >
            <div class="booyah-checkbox">
                <input 
                    type="checkbox" 
                    id="booyah_${index}"
                >
                <label for="booyah_${index}">Booyah</label>
            </div>
        `;
        
        container.appendChild(row);
        
        const placementInput = row.querySelector(`#placement_${index}`);
        const booyahCheckbox = row.querySelector(`#booyah_${index}`);
        
        if (placementInput && booyahCheckbox) {
            placementInput.addEventListener('change', () => {
                if (parseInt(placementInput.value) === 1) {
                    booyahCheckbox.checked = true;
                }
            });
        }
    });
}

/**
 * Save match results
 */
function saveMatchResults() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    const matchData = [];
    const placements = [];
    
    for (let i = 0; i < lobby.teams.length; i++) {
        const teamNameInput = document.getElementById(`teamname_${i}`);
        const newTeamName = teamNameInput ? teamNameInput.value.trim() : '';
        
        if (newTeamName && newTeamName.length > 0) {
            lobby.teams[i].name = newTeamName;
        }
        
        const placementInput = document.getElementById(`placement_${i}`);
        const killsInput = document.getElementById(`kills_${i}`);
        const booyahInput = document.getElementById(`booyah_${i}`);
        
        const placement = placementInput ? parseInt(placementInput.value) || 0 : 0;
        const kills = killsInput ? parseInt(killsInput.value) || 0 : 0;
        const booyah = booyahInput ? booyahInput.checked : false;
        
        if (placement < 1 || placement > 12) {
            alert(`${lobby.teams[i].name}: Placement must be between 1 and 12`);
            return;
        }
        
        placements.push(placement);
        
        matchData.push({
            teamId: lobby.teams[i].id,
            placement,
            kills,
            booyah
        });
    }
    
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
        alert('Each team must have a unique placement!');
        return;
    }
    
    matchData.forEach((data, index) => {
        const team = lobby.teams[index];
        const points = calculateMatchPoints(data.placement, data.kills, data.booyah);
        
        team.totalPoints += points.total;
        team.placementPoints += points.placement;
        team.killPoints += points.kills;
        
        if (data.booyah) {
            team.booyahs += 1;
        }
        
        team.matches.push({
            matchNumber: lobby.matches.length + 1,
            placement: data.placement,
            kills: data.kills,
            booyah: data.booyah,
            points: points
        });
    });
    
    lobby.matches.push({
        matchNumber: lobby.matches.length + 1,
        timestamp: new Date().toISOString(),
        results: matchData
    });
    
    lobby.updatedAt = new Date().toISOString();
    
    saveAppData();
    updateLobbyDetailUI();
    
    console.log(`✅ Match ${lobby.matches.length} saved`);
}

/**
 * Calculate points for a match
 */
function calculateMatchPoints(placement, kills, booyah) {
    const placementPoints = POINTS_SYSTEM.placement[placement] || 0;
    const booyahPoints = 0;
    const killPoints = kills * POINTS_SYSTEM.kill;
    const totalPoints = placementPoints + killPoints;
    
    return {
        placement: placementPoints,
        booyah: booyahPoints,
        kills: killPoints,
        total: totalPoints
    };
}

/**
 * Render rankings table
 */
function renderRankingsTable() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    const tbody = document.getElementById('rankingsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const sortedTeams = sortTeamsByRanking(lobby.teams);
    
    sortedTeams.forEach((team, index) => {
        const rank = index + 1;
        const row = createRankingRow(rank, team);
        tbody.appendChild(row);
    });
}

/**
 * Sort teams by ranking rules
 */
function sortTeamsByRanking(teams) {
    return [...teams].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        if (b.booyahs !== a.booyahs) {
            return b.booyahs - a.booyahs;
        }
        if (b.placementPoints !== a.placementPoints) {
            return b.placementPoints - a.placementPoints;
        }
        return b.killPoints - a.killPoints;
    });
}

/**
 * Create ranking table row
 */
function createRankingRow(rank, team) {
    const tr = document.createElement('tr');
    
    let rankClass = 'rank-default';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';
    
    tr.innerHTML = `
        <td class="rank-col">
            <div class="rank-badge ${rankClass}">${rank}</div>
        </td>
        <td class="team-col">
            <div class="team-name-cell">
                <span class="team-name-display" id="display_${team.id}">${escapeHtml(team.name)}</span>
                <button class="edit-team-btn" onclick="window.editTeamName('${team.id}')">✏️ Edit</button>
            </div>
        </td>
        <td class="stat-col booyah-cell">${team.booyahs}</td>
        <td class="stat-col">
            <span class="stat-value">${team.placementPoints}</span>
        </td>
        <td class="stat-col">
            <span class="stat-value">${team.killPoints}</span>
        </td>
        <td class="stat-col total-col">
            <span class="total-points">${team.totalPoints}</span>
        </td>
    `;
    
    return tr;
}

/**
 * Edit team name inline - GLOBAL FUNCTION
 */
window.editTeamName = function(teamId) {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    const team = lobby.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const displayElement = document.getElementById(`display_${teamId}`);
    if (!displayElement) return;
    
    const currentName = team.name;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'team-name-input';
    input.value = currentName;
    input.maxLength = 25;
    
    const cell = displayElement.parentElement;
    cell.replaceChild(input, displayElement);
    input.focus();
    input.select();
    
    const saveEdit = () => {
        const newName = input.value.trim();
        if (newName && newName.length > 0) {
            team.name = newName;
            saveAppData();
        }
        renderRankingsTable();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
};

/**
 * Render match history
 */
function renderMatchHistory() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    const container = document.getElementById('matchHistoryList');
    const emptyState = document.getElementById('emptyMatchHistory');
    
    if (!container || !emptyState) return;
    
    if (lobby.matches.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    container.innerHTML = '';
    
    [...lobby.matches].reverse().forEach(match => {
        const card = createMatchHistoryCard(match, lobby);
        container.appendChild(card);
    });
}

/**
 * Create match history card
 */
function createMatchHistoryCard(match, lobby) {
    const card = document.createElement('div');
    card.className = 'match-history-card';
    
    const winnerResult = match.results.find(r => r.placement === 1);
    const winnerTeam = lobby.teams.find(t => t.id === winnerResult.teamId);
    
    const totalKills = match.results.reduce((sum, r) => sum + r.kills, 0);
    const booyahCount = match.results.filter(r => r.booyah).length;
    
    const date = new Date(match.timestamp);
    const dateStr = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        <div class="match-header">
            <div class="match-number">Match ${match.matchNumber}</div>
            <div class="match-date">${dateStr}</div>
        </div>
        <div class="match-details">
            <div class="match-detail-item">
                <div class="detail-label">Winner</div>
                <div class="detail-value" style="font-size: 1rem; color: var(--gold);">
                    ${escapeHtml(winnerTeam.name)}
                </div>
            </div>
            <div class="match-detail-item">
                <div class="detail-label">Total Kills</div>
                <div class="detail-value">${totalKills}</div>
            </div>
            <div class="match-detail-item">
                <div class="detail-label">Booyahs</div>
                <div class="detail-value">${booyahCount}</div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Export table
 */
function exportTable() {
    console.log('📥 Export - Coming soon');
    alert('Export functionality coming in Phase 2!');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * DOM Ready Event
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    initializeApp();
});

/**
 * Export for debugging
 */
window.ClashArena = {
    config: APP_CONFIG,
    state: appState,
    points: POINTS_SYSTEM,
    save: saveAppData,
    load: loadAppData,
    getCurrentLobby: getCurrentLobby
};

console.log('🚀 Clash Arena ESP Manager v1.6.1 loaded');
