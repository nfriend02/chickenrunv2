import { GameManager } from './core/GameManager.js';
import './core/firebase.js';

function startApp() {
  if (window.__CHICKEN_RUN_INITIALIZED__) return;
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    window.__CHICKEN_RUN_INITIALIZED__ = true;
    try {
      const game = new GameManager(canvas);
      window.__CHICKEN_RUN_GAME__ = game;
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
