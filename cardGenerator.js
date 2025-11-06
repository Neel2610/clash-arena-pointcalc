// ========================================
// CLASH ARENA ESP MANAGER - CARD GENERATOR
// Phase 2 - Card Generation & Export
// ========================================

/**
 * Card Customization State
 */
let cardState = {
    backgroundImage: '',
    backgroundColor: '#0a0a0f',
    textColor: '#ffffff',
    overlayColor: '#1a1a24',
    overlayOpacity: 90
};

/**
 * Initialize Card Generator
 */
function initializeCardGenerator() {
    console.log('🎨 Card Generator initialized');
    
    // Generate Card button
    const generateBtn = document.getElementById('generateCardBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', openCardGenerator);
    }
    
    // Export CSV button
    const csvBtn = document.getElementById('exportCSVBtn');
    if (csvBtn) {
        csvBtn.addEventListener('click', exportTableAsCSV);
    }
    
    // Back button from card generator
    const backBtn = document.getElementById('backToLobbyFromCard');
    if (backBtn) {
        backBtn.addEventListener('click', closeCardGenerator);
    }
    
    // Download card button
    const downloadBtn = document.getElementById('downloadCardBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCardAsImage);
    }
    
    // Background image
    const bgInput = document.getElementById('bgImageInput');
    const applyBgBtn = document.getElementById('applyBgBtn');
    if (applyBgBtn) {
        applyBgBtn.addEventListener('click', applyBackgroundImage);
    }
    if (bgInput) {
        bgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyBackgroundImage();
        });
    }
    
    // Background color
    const bgColorInput = document.getElementById('bgColorInput');
    const bgColorText = document.getElementById('bgColorText');
    if (bgColorInput) {
        bgColorInput.addEventListener('input', (e) => {
            cardState.backgroundColor = e.target.value;
            if (bgColorText) bgColorText.value = e.target.value;
            updateCardStyles();
        });
    }
    if (bgColorText) {
        bgColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                cardState.backgroundColor = color;
                if (bgColorInput) bgColorInput.value = color;
                updateCardStyles();
            }
        });
    }
    
    // Text color
    const textColorInput = document.getElementById('textColorInput');
    const textColorText = document.getElementById('textColorText');
    if (textColorInput) {
        textColorInput.addEventListener('input', (e) => {
            cardState.textColor = e.target.value;
            if (textColorText) textColorText.value = e.target.value;
            updateCardStyles();
        });
    }
    if (textColorText) {
        textColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                cardState.textColor = color;
                if (textColorInput) textColorInput.value = color;
                updateCardStyles();
            }
        });
    }
    
    // Overlay color
    const overlayColorInput = document.getElementById('overlayColorInput');
    if (overlayColorInput) {
        overlayColorInput.addEventListener('input', (e) => {
            cardState.overlayColor = e.target.value;
            updateCardStyles();
        });
    }
    
    // Overlay opacity
    const overlayOpacity = document.getElementById('overlayOpacity');
    const overlayOpacityValue = document.getElementById('overlayOpacityValue');
    if (overlayOpacity) {
        overlayOpacity.addEventListener('input', (e) => {
            cardState.overlayOpacity = e.target.value;
            if (overlayOpacityValue) {
                overlayOpacityValue.textContent = `${e.target.value}%`;
            }
            updateCardStyles();
        });
    }
    
    // Reset styles button
    const resetBtn = document.getElementById('resetStylesBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCardStyles);
    }
    
    console.log('✅ Card Generator controls ready');
}

/**
 * Open Card Generator View
 */
function openCardGenerator() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    // Check if there are matches
    if (lobby.matches.length === 0) {
        alert('Please add at least one match before generating a card.');
        return;
    }
    
    // Hide lobby detail, show card generator
    const detailView = document.getElementById('lobbyDetailView');
    const cardView = document.getElementById('cardGeneratorView');
    
    if (detailView) detailView.classList.add('hidden');
    if (cardView) cardView.classList.remove('hidden');
    
    // Populate card with data
    populateCard();
    
    // Reset to default styles
    resetCardStyles();
    
    console.log('🎨 Card generator opened');
}

/**
 * Close Card Generator and return to lobby
 */
function closeCardGenerator() {
    const detailView = document.getElementById('lobbyDetailView');
    const cardView = document.getElementById('cardGeneratorView');
    
    if (cardView) cardView.classList.add('hidden');
    if (detailView) detailView.classList.remove('hidden');
    
    console.log('❌ Card generator closed');
}

/**
 * Populate card with lobby data
 */
function populateCard() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    // Update header
    const lobbyNameEl = document.getElementById('cardLobbyName');
    const matchCountEl = document.getElementById('cardMatchCount');
    
    if (lobbyNameEl) lobbyNameEl.textContent = lobby.name.toUpperCase();
    if (matchCountEl) {
        matchCountEl.textContent = `After ${lobby.matches.length} Match${lobby.matches.length === 1 ? '' : 'es'}`;
    }
    
    // Populate table
    const tbody = document.getElementById('cardTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort teams
    const sortedTeams = sortTeamsByRanking(lobby.teams);
    
    sortedTeams.forEach((team, index) => {
        const rank = index + 1;
        const row = createCardTableRow(rank, team);
        tbody.appendChild(row);
    });
    
    console.log('✅ Card populated with data');
}

/**
 * Create card table row
 */
function createCardTableRow(rank, team) {
    const tr = document.createElement('tr');
    
    let rankClass = 'card-rank-default';
    if (rank === 1) rankClass = 'card-rank-1';
    else if (rank === 2) rankClass = 'card-rank-2';
    else if (rank === 3) rankClass = 'card-rank-3';
    
    tr.innerHTML = `
        <td class="card-rank-col">
            <div class="card-rank-badge ${rankClass}">${rank}</div>
        </td>
        <td class="card-team-col">
            <span class="card-team-name">${escapeHtml(team.name)}</span>
        </td>
        <td class="card-stat-col">
            <span class="card-booyah-value">${team.booyahs}</span>
        </td>
        <td class="card-stat-col">${team.placementPoints}</td>
        <td class="card-stat-col">${team.killPoints}</td>
        <td class="card-stat-col card-total-col">
            <span class="card-total-value">${team.totalPoints}</span>
        </td>
    `;
    
    return tr;
}

/**
 * Apply background image
 */
function applyBackgroundImage() {
    const input = document.getElementById('bgImageInput');
    if (!input) return;
    
    const url = input.value.trim();
    
    if (!url) {
        cardState.backgroundImage = '';
        updateCardStyles();
        return;
    }
    
    // Validate URL format (basic)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }
    
    cardState.backgroundImage = url;
    updateCardStyles();
    
    console.log('🖼️ Background image applied');
}

/**
 * Update card styles based on current state
 */
function updateCardStyles() {
    const bgLayer = document.getElementById('cardBgLayer');
    const contentLayer = document.getElementById('cardContentLayer');
    
    if (!bgLayer || !contentLayer) return;
    
    // Background layer
    if (cardState.backgroundImage) {
        bgLayer.style.backgroundImage = `url('${cardState.backgroundImage}')`;
        bgLayer.style.backgroundColor = cardState.backgroundColor;
    } else {
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.backgroundColor = cardState.backgroundColor;
    }
    
    // Content layer (overlay)
    const opacity = cardState.overlayOpacity / 100;
    const overlayRgb = hexToRgb(cardState.overlayColor);
    contentLayer.style.background = `rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, ${opacity})`;
    
    // Text color
    const card = document.getElementById('resultCard');
    if (card) {
        card.style.setProperty('--card-text-color', cardState.textColor);
        
        // Apply to all text elements
        const textElements = card.querySelectorAll('.card-main-title, .card-subtitle, .card-table th, .card-table td, .card-footer-text, .card-team-name');
        textElements.forEach(el => {
            el.style.color = cardState.textColor;
        });
        
        // Keep special colors
        const accentElements = card.querySelectorAll('.card-highlight, .card-total-value');
        accentElements.forEach(el => {
            el.style.color = '#ff0844';
        });
        
        const booyahElements = card.querySelectorAll('.card-booyah-value');
        booyahElements.forEach(el => {
            el.style.color = '#ffd700';
        });
    }
}

/**
 * Reset card styles to default
 */
function resetCardStyles() {
    cardState = {
        backgroundImage: '',
        backgroundColor: '#0a0a0f',
        textColor: '#ffffff',
        overlayColor: '#1a1a24',
        overlayOpacity: 90
    };
    
    // Reset inputs
    const bgImageInput = document.getElementById('bgImageInput');
    const bgColorInput = document.getElementById('bgColorInput');
    const bgColorText = document.getElementById('bgColorText');
    const textColorInput = document.getElementById('textColorInput');
    const textColorText = document.getElementById('textColorText');
    const overlayColorInput = document.getElementById('overlayColorInput');
    const overlayOpacity = document.getElementById('overlayOpacity');
    const overlayOpacityValue = document.getElementById('overlayOpacityValue');
    
    if (bgImageInput) bgImageInput.value = '';
    if (bgColorInput) bgColorInput.value = '#0a0a0f';
    if (bgColorText) bgColorText.value = '#0a0a0f';
    if (textColorInput) textColorInput.value = '#ffffff';
    if (textColorText) textColorText.value = '#ffffff';
    if (overlayColorInput) overlayColorInput.value = '#1a1a24';
    if (overlayOpacity) overlayOpacity.value = '90';
    if (overlayOpacityValue) overlayOpacityValue.textContent = '90%';
    
    updateCardStyles();
    
    console.log('↺ Card styles reset to default');
}

/**
 * Download card as image using html2canvas
 */
async function downloadCardAsImage() {
    const card = document.getElementById('resultCard');
    if (!card) {
        alert('Card not found');
        return;
    }
    
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    console.log('📸 Generating card image...');
    
    try {
        // Show loading indicator
        const downloadBtn = document.getElementById('downloadCardBtn');
        const originalText = downloadBtn ? downloadBtn.innerHTML : '';
        if (downloadBtn) {
            downloadBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
            downloadBtn.disabled = true;
        }
        
        // Generate image
        const canvas = await html2canvas(card, {
            scale: 2,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fileName = `${lobby.name.replace(/[^a-z0-9]/gi, '_')}_Match${lobby.matches.length}.png`;
            
            link.href = url;
            link.download = fileName;
            link.click();
            
            URL.revokeObjectURL(url);
            
            console.log(`✅ Card downloaded: ${fileName}`);
            
            // Reset button
            if (downloadBtn) {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }
        });
        
    } catch (error) {
        console.error('❌ Error generating card:', error);
        alert('Failed to generate card. Please try again.');
        
        // Reset button
        const downloadBtn = document.getElementById('downloadCardBtn');
        if (downloadBtn) {
            downloadBtn.innerHTML = '<span class="btn-icon">⬇</span> Download Card';
            downloadBtn.disabled = false;
        }
    }
}

/**
 * Export table as CSV
 */
function exportTableAsCSV() {
    const lobby = getCurrentLobby();
    if (!lobby) return;
    
    if (lobby.matches.length === 0) {
        alert('No data to export. Please add matches first.');
        return;
    }
    
    // Sort teams
    const sortedTeams = sortTeamsByRanking(lobby.teams);
    
    // Create CSV content
    let csv = 'Rank,Team Name,Booyahs,Placement Points,Kill Points,Total Points\n';
    
    sortedTeams.forEach((team, index) => {
        const rank = index + 1;
        csv += `${rank},"${team.name}",${team.booyahs},${team.placementPoints},${team.killPoints},${team.totalPoints}\n`;
    });
    
    // Add metadata
    csv += `\n"Lobby","${lobby.name}"\n`;
    csv += `"Matches","${lobby.matches.length}"\n`;
    csv += `"Generated","${new Date().toLocaleString()}"\n`;
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${lobby.name.replace(/[^a-z0-9]/gi, '_')}_Results.csv`;
    
    link.href = url;
    link.download = fileName;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log(`📊 CSV exported: ${fileName}`);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 26, g: 26, b: 36 };
}

/**
 * Initialize on DOM load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure main script is loaded
    setTimeout(() => {
        initializeCardGenerator();
    }, 100);
});

console.log('🎨 Card Generator module loaded');
