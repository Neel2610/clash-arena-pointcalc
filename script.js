// ========================================
// CLASH ARENA ESP MANAGER - CORE SCRIPT
// Version: 1.0.0
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
 * Initialize Application
 */
function initializeApp() {
    console.log('🔥 Clash Arena ESP Manager initialized');
    console.log(`📦 Version: ${APP_CONFIG.version}`);
    console.log(`⚙️ Configuration loaded successfully`);
    console.log(`🎯 Max Lobbies: ${APP_CONFIG.maxLobbies}`);
    console.log(`👥 Teams per Lobby: ${APP_CONFIG.maxTeams}`);
    console.log(`🏆 Matches per Lobby: ${APP_CONFIG.maxMatches}`);
    
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
    
    // Log system info to page (for verification)
    logSystemStatus();
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
 * Log system status to console
 */
function logSystemStatus() {
    const statusLog = {
        timestamp: new Date().toISOString(),
        version: APP_CONFIG.version,
        initialized: appState.initialized,
        lobbiesLoaded: appState.lobbies.length,
        storageAvailable: typeof Storage !== 'undefined'
    };
    
    console.table(statusLog);
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
    load: loadAppData
};

console.log('🚀 Clash Arena ESP Manager
