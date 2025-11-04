// ========================================
// CLASH ARENA ESP MANAGER - CORE SCRIPT
// Version: 1.6.0 - Logic & Visibility Fixes
// ========================================

/**
 * Application Configuration
 */
const APP_CONFIG = {
    name: 'Clash Arena ESP Manager',
    version: '1.6.0',
    maxLobbies: 4,
    maxTeams: 12,
    maxMatches: 6,
    storageKey: 'clashArenaData'
};

/**
 * Points System Configuration
 * FIXED: Booyah no longer adds +1 point, only used for tiebreaking
 */
const POINTS_SYSTEM = {
    kill: 1,
    placement: {
        1: 12,  // 1st place (NO booyah bonus in points)
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
    booyahBonus: 0  // CHANGED: Was 1, now 0 (used only for tiebreaking)
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
    console.log(`⚙️ Configuration loaded successfully`);
    console.log(`🎯 BOOYAH LOGIC: Tiebreaker only (no +1 point bonus)`);
    
    // Check for localStorage support
    if (typeof Storage !== 'undefined') {
        console.log('💾 LocalStorage available');
        loadAppData();
    } else {
        console.warn('⚠️ LocalStorage not available - data will not persist');
    }
    
    // Set initialization flag
    appState.initialized = true;
    console.log('✅ System ready for operation');
    
    // Initialize UI
    initializeUI();
    updateLobbyListUI();
}

/**
 * Initialize UI Event Listeners
 */
function initializeUI() {
    // Create lobby buttons
    document.getElementById('createLobbyBtn').addEventListener('click', openCreateModal);
    document.getElementById('createFirstLobby').addEventListener('click', openCreateModal);
    
    // Modal controls
    document.getElementById('modalClose').addEventListener('click', closeCreateModal);
    document.getElementById('modalOverlay').addEventListener('click', closeCreateModal);
    document.getElementById('cancelBtn').addEventListener('click', closeCreateModal);
    document.getElementById('confirmCreateBtn').addEventListener('click', createLobby);
    
    // Delete modal controls
    document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteModalOverlay').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Lobby detail controls
    document.getElementById('backToLobbies').addEventListener('click', showLobbyList);
    document.getElementById('addMatchBtn').addEventListener('click', showMatchForm);
    document.getElementById('closeMatchForm').addEventListener('click', hideMatchForm);
    document.getElementById('cancelMatchBtn').addEventListener('click', hideMatchForm);
    document.getElementById('saveMatchBtn').addEventListener('click', saveMatchResults);
    document.getElementById('exportTableBtn').addEventListener('click', exportTable);
    
    // Enter key in lobby name input
    document.getElementById('lobbyName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createLobby();
        }
    });
    
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
            console.log(`📥 Loaded ${appState.lobbies.length} lobbies from storage`);
        } else {
            console.log('📝 No saved data found - starting fresh');
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
        console.log('💾 Data saved successfully');
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
    // Check max lobbies
    if (appState.lobbies.length >= APP_CONFIG.maxLobbies) {
        alert(`Maximum ${APP_CONFIG.maxLobbies} lobbies allowed`);
        return;
    }
    
    const modal = document.getElementById('createLobbyModal');
    const input = document.getElementById('lobbyName');
    
    modal.classList.add('active');
    input.value = '';
    input.focus();
    
    console.log('📝 Create lobby modal opened');
}

/**
 * Close create lobby modal
 */
function closeCreateModal() {
    const modal = document.getElementById('createLobbyModal');
    modal.classList.remove('active');
    console.log('❌ Create lobby modal closed');
}

/**
 * Create new lobby
 */
function createLobby() {
    const input = document.getElementById('lobbyName');
    const lobbyName = input.value.trim();
    
    // Validate input
    if (!lobbyName) {
        alert('Please enter a lobby name');
        input.focus();
        return;
    }
    
    if (lobbyName.length > 30) {
        alert('Lobby name must be 30 characters or less');
        return;
    }
    
    // Check max lobbies
    if (appState.lobbies.length >= APP_CONFIG.maxLobbies) {
        alert(`Maximum ${APP_CONFIG.maxLobbies} lobbies allowed`);
        return;
    }
    
    // Create lobby object
    const newLobby = {
        id: generateLobbyId(),
        name: lobbyName,
        teams: initializeTeams(),
        matches: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add to state
    appState.lobbies.push(newLobby);
    
    // Save and update UI
    saveAppData();
    updateLobbyListUI();
    closeCreateModal();
    
    console.log(`✅ Lobby created: ${lobbyName} (${newLobby.id})`);
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
    
    nameElement.textContent = lobby.name;
    modal.classList.add('active');
    
    console.log(`⚠️ Delete confirmation for: ${lobby.name}`);
}

/**
 * Close delete lobby modal
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteLobbyModal');
    modal.classList.remove('active');
    lobbyToDelete = null;
    console.log('❌ Delete modal closed');
}

/**
 * Confirm and delete lobby
 */
function confirmDelete() {
    if (!lobbyToDelete) return;
    
    const lobbyIndex = appState.lobbies.findIndex(l => l.id === lobbyToDelete);
    if (lobbyIndex === -1) return;
    
    const deletedLobby = appState.lobbies[lobbyIndex];
    
    // Remove from state
    appState.lobbies.splice(lobbyIndex, 1);
    
    // If we're viewing this lobby, go back to list
    if (appState.currentLobbyId === lobbyToDelete) {
        appState.currentLobbyId = null;
        showLobbyList();
    }
    
    // Save and update UI
    saveAppData();
    updateLobbyListUI();
    closeDeleteModal();
    
    console.log(`🗑️ Lobby deleted: ${deletedLobby.name}`);
}

/**
 * Delete lobby
 */
function deleteLobby(lobbyId) {
    openDeleteModal(lobbyId);
}

/**
 * View/Open lobby detail
 */
function viewLobby(lobbyId) {
    const lobby = appState.lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;
    appState.currentLobbyId = lobbyId;
    // Hide lobby list, show detail
    document.getElementById('lobbyListView').classList.add('hidden');
    document.getElementById('lobbyDetailView').classList.remove('hidden');
    // Update detail view
    updateLobbyDetailUI();
    console.log(`👁️ Viewing lobby: ${lobby.name}`);
}

/**
 * Show lobby list view
 */
function showLobbyList() {
    appState.currentLobbyId = null;
    document.getElementById('lobbyDetailView').classList.add('hidden');
    document.getElementById('lobbyListView').classList.remove('hidden');
    updateLobbyListUI();
    console.log('📋 Showing lobby list');
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
    document.getElementById('totalLobbies').textContent = totalLobbies;
    document.getElementById('totalTeams').textContent = totalTeams;
    document.getElementById('totalMatches').textContent = totalMatches;
}

/**
 * Render all lobby cards
 */
function renderLobbies() {
    const container = document.getElementById('lobbiesGrid');
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
    card.onclick = () => viewLobby(lobby.id);
    const matchCount = lobby.matches.length;
    const maxMatches = APP_CONFIG.maxMatches;
    card.innerHTML = `<div class="lobby-card-header">
        <div class="lobby-info">
            <h3 class="lobby-name">${escapeHtml(lobby.name)}</h3>
            <div class="lobby-id">${lobby.id}</div>
        </div>
        <div class="lobby-actions">
            <button onclick="event.stopPropagation(); deleteLobby('${lobby.id}')" class="delete-lobby-btn" title="Delete Lobby">&times;</button>
        </div>
    </div>
    <div class="lobby-card-body">
        <div>Teams: ${lobby.teams.length}</div>
        <div>Matches: ${matchCount}/${maxMatches}</div>
        <div>Total Points: ${calculateLobbyTotalPoints(lobby)}</div>
    </div>`;
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
        emptyState.classList.remove('hidden');
        lobbiesGrid.style.display = 'none';
    } else {
        emptyState.classList.add('hidden');
        lobbiesGrid.style.display = 'grid';
    }
}

/**
 * Update lobby detail UI
 */
function updateLobbyDetailUI() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    // Update header
    document.getElementById('currentLobbyName').textContent = lobby.name;
    document.getElementById('currentLobbyId').textContent = lobby.id;
    document.getElementById('currentMatchCount').textContent = `Match ${lobby.matches.length}/${APP_CONFIG.maxMatches}`;
    // Update rankings table
    renderRankingsTable();
    // Update match history
    renderMatchHistory();
    // Hide match form if visible
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
    // Check if max matches reached
    if (lobby.matches.length >= APP_CONFIG.maxMatches) {
        alert(`Maximum ${APP_CONFIG.maxMatches} matches per lobby reached`);
        return;
    }
    const form = document.getElementById('matchForm');
    form.classList.remove('hidden');
    // Generate form inputs
    renderMatchFormInputs();
    console.log('📝 Match form opened');
}

/**
 * Hide match input form
 */
function hideMatchForm() {
    const form = document.getElementById('matchForm');
    form.classList.add('hidden');
    console.log('❌ Match form closed');
}

/**
 * Render match form inputs with editable team names
 */
function renderMatchFormInputs() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    const container = document.getElementById('matchFormGrid');
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

        // Auto-check booyah for 1st place
        const placementInput = row.querySelector(`#placement_${index}`);
        const booyahCheckbox = row.querySelector(`#booyah_${index}`);

        placementInput.addEventListener('change', () => {
            if (parseInt(placementInput.value) === 1) {
                booyahCheckbox.checked = true;
            }
        });
    });
}

/**
 * Save match results
 * UPDATED: Save team names and apply booyah tiebreaker logic
 */
function saveMatchResults() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    // Collect match data
    const matchData = [];
    const placements = [];
    for (let i = 0; i < lobby.teams.length; i++) {
        // Get and save team name
        const teamNameInput = document.getElementById(`teamname_${i}`);
        const newTeamName = teamNameInput.value.trim();
        if (newTeamName && newTeamName.length > 0) {
            lobby.teams[i].name = newTeamName;
        }

        const placement = parseInt(document.getElementById(`placement_${i}`).value) || 0;
        const kills = parseInt(document.getElementById(`kills_${i}`).value) || 0;
        const booyah = document.getElementById(`booyah_${i}`).checked;

        // Validate placement
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
    // Check for duplicate placements
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
        alert('Each team must have a unique placement! Please check for duplicates.');
        return;
    }
    // Calculate points and update teams
    matchData.forEach((data, index) => {
        const team = lobby.teams[index];
        const points = calculateMatchPoints(data.placement, data.kills, data.booyah);
        // Update team totals
        team.totalPoints += points.total;
        team.placementPoints += points.placement;
        team.killPoints += points.kills;

        // Track booyahs separately for tiebreaking
        if (data.booyah) {
            team.booyahs += 1;
        }

        // Add match to team history
        team.matches.push({
            matchNumber: lobby.matches.length + 1,
            placement: data.placement,
            kills: data.kills,
            booyah: data.booyah,
            points: points
        });
    });
    // Save match to lobby history
    lobby.matches.push({
        matchNumber: lobby.matches.length + 1,
        timestamp: new Date().toISOString(),
        results: matchData
    });
    lobby.updatedAt = new Date().toISOString();
    // Save and update UI
    saveAppData();
    updateLobbyDetailUI();
    console.log(`✅ Match ${lobby.matches.length} saved`);
}

/**
 * Calculate points for a match
 * FIXED: Booyah adds 0 points (only for tiebreaking)
 * @param {number} placement - Team placement (1-12)
 * @param {number} kills - Number of kills
 * @param {boolean} booyah - Whether team got booyah (for tracking only)
 * @returns {object} Points breakdown
 */
function calculateMatchPoints(placement, kills, booyah) {
    const placementPoints = POINTS_SYSTEM.placement[placement] || 0;
    const booyahPoints = 0; // FIXED: Always 0, booyah only for tiebreaking
    const killPoints = kills * POINTS_SYSTEM.kill;
    const totalPoints = placementPoints + killPoints; // FIXED: No booyah in total
    return {
        placement: placementPoints,
        booyah: booyahPoints,
        kills: killPoints,
        total: totalPoints
    };
}

/**
 * Render rankings table with edit capability
 */
function renderRankingsTable() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    const tbody = document.getElementById('rankingsTableBody');
    tbody.innerHTML = '';
    // Sort teams by ranking rules
    const sortedTeams = sortTeamsByRanking(lobby.teams);
    sortedTeams.forEach((team, index) => {
        const rank = index + 1;
        const row = createRankingRow(rank, team);
        tbody.appendChild(row);
    });
}

/**
 * Sort teams by ranking rules
 * FIXED: Proper tiebreaker order
 * Total Points (highest first)
 * Booyahs (highest first) - TIEBREAKER
 * Placement Points (highest first)
 * Kills (highest first)
 */
function sortTeamsByRanking(teams) {
    return [...teams].sort((a, b) => {
        // 1. Total Points
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        // 2. Booyahs (TIEBREAKER)
        if (b.booyahs !== a.booyahs) {
            return b.booyahs - a.booyahs;
        }
        // 3. Placement Points
        if (b.placementPoints !== a.placementPoints) {
            return b.placementPoints - a.placementPoints;
        }
        // 4. Kills
        return b.killPoints - a.killPoints;
    });
}

/**
 * Create ranking table row with editable team name
 */
function createRankingRow(rank, team) {
    const tr = document.createElement('tr');
    // Rank badge class
    let rankClass = 'rank-default';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';
    tr.innerHTML = `<td cla
