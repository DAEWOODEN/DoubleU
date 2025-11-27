// Utility to reset session for new visitors
// This ensures each user gets a fresh start

export function resetSessionForNewVisitor() {
  // Clear all user-generated content
  const keysToKeep = ['ideasInitialized', 'timelineInitialized'];
  
  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  
  // Remove all except initialization flags
  allKeys.forEach(key => {
    // Keep initialization flags
    if (keysToKeep.includes(key)) {
      return;
    }
    
    // Clear all user data
    localStorage.removeItem(key);
  });
  
  // Ensure sample data will show by removing initialization flags
  localStorage.removeItem('ideasInitialized');
  localStorage.removeItem('timelineInitialized');
}

// Check if this is a new session (first visit in this browser session)
export function isNewSession(): boolean {
  // Check sessionStorage instead of localStorage for session-based detection
  const sessionVisited = sessionStorage.getItem('hasVisited');
  
  if (!sessionVisited) {
    // First visit in this session
    sessionStorage.setItem('hasVisited', 'true');
    return true;
  }
  
  return false;
}

// Clear all user data for fresh start
export function clearAllUserData() {
  // Clear all localStorage except essential flags
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    // Only keep initialization flags if needed
    if (!key.includes('Initialized')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage too
  sessionStorage.clear();
}

