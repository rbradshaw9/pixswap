// Global debug utility with localStorage persistence

class DebugManager {
  private static instance: DebugManager;
  private _isEnabled: boolean;

  private constructor() {
    // Check localStorage on init
    this._isEnabled = localStorage.getItem('pixswap_debug') === 'true';
    
    // Expose to window for console access
    (window as any).pixswapDebug = this;
    
    if (this._isEnabled) {
      console.log('🐛 Debug mode enabled');
    }
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  enable(): void {
    this._isEnabled = true;
    localStorage.setItem('pixswap_debug', 'true');
    console.log('🐛 Debug mode ENABLED - logs will appear across all pages');
  }

  disable(): void {
    this._isEnabled = false;
    localStorage.setItem('pixswap_debug', 'false');
    console.log('🐛 Debug mode DISABLED');
  }

  toggle(): boolean {
    if (this._isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this._isEnabled;
  }

  log(...args: any[]): void {
    if (this._isEnabled) {
      console.log(...args);
    }
  }
}

// Export singleton instance
export const debug = DebugManager.getInstance();

// Helper function for conditional logging
export const debugLog = (...args: any[]) => {
  if (debug.isEnabled) {
    console.log(...args);
  }
};
