// ========================================
// CLASH ARENA ESP MANAGER - CORE SCRIPT
// Version: 1.0.0 - Phase 1
// ========================================

/**
 * Application Configuration
 */
const APP_CONFIG = {
    name: 'Clash Arena ESP Manager',
    version: '1.0.0',
    maxLobbies: 4,
    maxTeams: 12,
    maxMatches: 6,
    storageKey: 'clashArenaData'
};

/**
 * Points System Configuration
 */
const POINTS_SYSTEM = {
    kill: 1,
    placement: {
        1: 12,  // 1st place (+ 1 Booyah bonus)
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
    booyahBonus: 1
};

/**
 * Application State
 */
let appState = {
    lobbies: [],
    currentLobby: null,
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
    updateUI();
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
    updateUI();
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
            placement: 0,
            kills: 0,
            totalPoints: 0,
            placementPoints: 0,
            killPoints: 0,
            booyahs: 0
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
    
    // Save and update UI
    saveAppData();
    updateUI();
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
 * View/Select lobby (placeholder for Phase 2)
 */
function viewLobby(lobbyId) {
    const lobby = appState.lobbies.find(l => l.id === lobbyId);
    if (!lobby) return;
    
    console.log(`👁️ Viewing lobby: ${lobby.name} (Phase 2 feature)`);
    // This will be implemented in Phase 2
}

/**
 * Update entire UI
 */
function updateUI() {
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
    const completedMatches = matchCount;
    const maxMatches = APP_CONFIG.maxMatches;
    
    card.innerHTML = `
        <div class="lobby-card-header">
            <div class="lobby-info">
                <h3 class="lobby-name">${escapeHtml(lobby.name)}</h3>
                <div class="lobby-id">${lobby.id}</div>
            </div>
            <div class="lobby-actions">
                <button class="action-btn delete" onclick="event.stopPropagation(); deleteLobby('${lobby.id}')" title="Delete Lobby">
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
                <div class="stat-mini-value">${completedMatches}/${maxMatches}</div>
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
        emptyState.classList.remove('hidden');
        lobbiesGrid.style.display = 'none';
    } else {
        emptyState.classList.add('hidden');
        lobbiesGrid.style.display = 'grid';
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Calculate points for a team
 * @param {number} placement - Team placement (1-12)
 * @param {number} kills - Number of kills
 * @returns {object} Points breakdown
 */
function calculatePoints(placement, kills) {
    const placementPoints = POINTS_SYSTEM.placement[placement] || 0;
    const booyahBonus = placement === 1 ? POINTS_SYSTEM.booyahBonus : 0;
    const killPoints = kills * POINTS_SYSTEM.kill;
    const totalPoints = placementPoints + booyahBonus + killPoints;
    
    return {
        placement: placementPoints,
        booyah: booyahBonus,
        kills: killPoints,
        total: totalPoints
    };
}

/**
 * DOM Ready Event
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    initializeApp();
    
    // Add animation classes after load
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

/**
 * Export utility for future use
 */
window.ClashArena = {
    config: APP_CONFIG,
    state: appState,
    points: POINTS_SYSTEM,
    calculatePoints: calculatePoints,
    save: saveAppData,
    load: loadAppData,
    createLobby: createLobby,
    deleteLobby: deleteLobby,
    viewLobby: viewLobby
};

console.log('🚀 Clash Arena ESP Manager script loaded - Phase 1 Complete');
