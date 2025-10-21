// Debug mode utility with persistence
class DebugMode {
  private static instance: DebugMode;
  private enabled: boolean;

  private constructor() {
    // Check URL parameter first
    const params = new URLSearchParams(window.location.search);
    const urlDebug = params.get('debug') === 'true';
    
    // Check localStorage
    const storedDebug = localStorage.getItem('pixswap_debug') === 'true';
    
    // Enable if either is true
    this.enabled = urlDebug || storedDebug;
    
    // Persist to localStorage
    if (this.enabled) {
      localStorage.setItem('pixswap_debug', 'true');
      console.log('🐛 Debug mode ENABLED - will persist across pages');
      console.log('🐛 To disable: run debugMode.disable() in console or add ?debug=false to URL');
    }
  }

  public static getInstance(): DebugMode {
    if (!DebugMode.instance) {
      DebugMode.instance = new DebugMode();
    }
    return DebugMode.instance;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    this.enabled = true;
    localStorage.setItem('pixswap_debug', 'true');
    console.log('🐛 Debug mode ENABLED');
  }

  public disable(): void {
    this.enabled = false;
    localStorage.removeItem('pixswap_debug');
    console.log('🐛 Debug mode DISABLED');
  }

  public toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  public log(...args: any[]): void {
    if (this.enabled) {
      console.log(...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  public error(...args: any[]): void {
    if (this.enabled) {
      console.error(...args);
    }
  }
}

// Create singleton instance
const debugMode = DebugMode.getInstance();

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).debugMode = debugMode;
}

export default debugMode;
