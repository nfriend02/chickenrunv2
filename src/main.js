import { i18n } from './core/i18n.js';
import { GameManager } from './core/GameManager.js';
import { AuthUI } from './ui/AuthUI.js';
import { AccountUI } from './ui/AccountUI.js';

function startApp() {
  if (window.__CHICKEN_RUN_INITIALIZED__) return;
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    window.__CHICKEN_RUN_INITIALIZED__ = true;
    i18n.apply();
    try {
      const game = new GameManager(canvas);
      window.__CHICKEN_RUN_GAME__ = game;
      window.__AUTH_UI__ = new AuthUI();
      window.__ACCOUNT_UI__ = new AccountUI();
      console.log('🐔 Chicken Run Version2 Game Engine Initialized Successfully!');
    } catch (err) {
      console.error('❌ Failed to initialize GameManager:', err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  // DOM is already parsed & ready!
  startApp();
}
