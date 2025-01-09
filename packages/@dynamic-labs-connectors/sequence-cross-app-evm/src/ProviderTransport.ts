type ConnectionState = 'disconnected' | 'connecting' | 'connected';

interface SessionData {
  walletAddress: string;
  lastConnected: number;
}

const isClient = typeof window !== 'undefined';

export class ProviderTransport {
  private walletOrigin: string;
  private walletWindow: Window | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private callbacks: Map<string, (response: any) => void> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private session: SessionData | undefined;
  private walletCheckInterval: number | undefined;
  private pendingRequests: Set<string> = new Set();

  constructor(walletUrl: string) {
    const url = new URL(walletUrl);
    this.walletOrigin = url.origin;

    if (isClient) {
      window.addEventListener('message', this.handleMessage);
      this.loadSession();
      this.observeCallbacks();
    }
  }

  private observeCallbacks() {
    const originalSet = this.callbacks.set.bind(this.callbacks);
    const originalDelete = this.callbacks.delete.bind(this.callbacks);

    this.callbacks.set = (key, value) => {
      const result = originalSet(key, value);
      this.updateWalletCheck();
      return result;
    };

    this.callbacks.delete = (key) => {
      const result = originalDelete(key);
      this.updateWalletCheck();
      return result;
    };
  }

  private updateWalletCheck() {
    if (this.callbacks.size > 0) {
      this.ensureWalletCheckActive();
    } else {
      this.ensureWalletCheckInactive();
    }
  }

  private ensureWalletCheckActive() {
    if (!isClient) return;

    if (this.walletCheckInterval === undefined) {
      this.walletCheckInterval = window.setInterval(() => {
        if (!this.isWalletOpen()) {
          this.handleWalletClosed();
        }
      }, 500); // Check every half second
    }
  }

  private ensureWalletCheckInactive() {
    if (!isClient) return;

    if (this.walletCheckInterval !== undefined) {
      clearInterval(this.walletCheckInterval);
      this.walletCheckInterval = undefined;
    }
  }

  private loadSession() {
    if (!isClient) return;

    try {
      const sessionData = localStorage.getItem('walletSession');
      if (sessionData) {
        this.session = JSON.parse(sessionData);
        this.connectionState = 'connected';
      }
    } catch (error) {
      console.warn('Failed to load wallet session:', error);
    }
  }

  private saveSession(walletAddress: string) {
    if (!isClient) return;

    try {
      this.session = { walletAddress, lastConnected: Date.now() };
      localStorage.setItem('walletSession', JSON.stringify(this.session));
    } catch (error) {
      console.warn('Failed to save wallet session:', error);
    }
  }

  private tryCloseWalletWindow() {
    if (!isClient) return;

    if (this.pendingRequests.size === 0 && this.isWalletOpen()) {
      setTimeout(() => {
        // Double check that no new requests came in during the delay
        if (this.pendingRequests.size === 0) {
          this.walletWindow?.close();
          this.walletWindow = null;
        }
      }, 500); // Add a small delay to ensure any immediate follow-up requests are captured
    }
  }

  async connect(): Promise<{ walletAddress: string }> {
    if (!isClient) {
      throw new Error('Cannot connect to wallet in non-browser environment');
    }

    if (this.connectionState === 'connected' && this.session) {
      return { walletAddress: this.session.walletAddress };
    }

    this.connectionState = 'connecting';
    const connectionId = crypto.randomUUID();
    const connectionRequest = { type: 'connection', id: connectionId };
    this.pendingRequests.add(connectionId);

    return new Promise((resolve, reject) => {
      this.callbacks.set(connectionId, (response) => {
        this.pendingRequests.delete(connectionId);
        if (response.type === 'connection' && response.status === 'accepted') {
          this.connectionState = 'connected';
          this.saveSession(response.walletAddress);
          resolve({ walletAddress: response.walletAddress });
          this.tryCloseWalletWindow();
        } else {
          this.connectionState = 'disconnected';
          reject(new Error('Connection rejected'));
          this.tryCloseWalletWindow();
        }
      });

      this.openWalletAndPostMessage(connectionRequest);
    });
  }

  async sendRequest(
    method: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any[],
    chainId: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    if (!isClient) {
      throw new Error('Cannot send request in non-browser environment');
    }

    if (this.connectionState !== 'connected') {
      throw new Error('Not connected to wallet. Call connect() first.');
    }

    const id = crypto.randomUUID();
    const request = { type: 'request', id, method, params, chainId };
    this.pendingRequests.add(id);

    return new Promise((resolve, reject) => {
      const sendMessage = async () => {
        if (!this.isWalletOpen()) {
          try {
            await this.openWalletAndPostMessage(request);
          } catch (error) {
            this.callbacks.delete(id);
            this.pendingRequests.delete(id);
            reject(error);
            return;
          }
        } else {
          this.postMessageToWallet(request);
        }
      };

      this.callbacks.set(id, (response) => {
        this.pendingRequests.delete(id);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
        this.tryCloseWalletWindow();
      });

      sendMessage().catch(reject);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private openWalletAndPostMessage(message: any): Promise<void> {
    if (!isClient) {
      return Promise.reject(
        new Error('Cannot open wallet in non-browser environment'),
      );
    }

    return new Promise((resolve, reject) => {
      console.log('Opening wallet and posting message:', message);
      if (!this.isWalletOpen()) {
        this.walletWindow = window.open(
          this.walletOrigin,
          'Wallet',
          'width=375,height=667',
        );
        if (!this.walletWindow) {
          reject(
            new Error(
              'Failed to open wallet window. Please check your pop-up blocker settings.',
            ),
          );
          return;
        }

        const waitForReady = (event: MessageEvent) => {
          if (event.origin === this.walletOrigin && event.data === 'ready') {
            console.log('Received ready message from wallet');
            window.removeEventListener('message', waitForReady);
            this.postMessageToWallet(message);
            resolve();
          }
        };
        window.addEventListener('message', waitForReady);
      } else {
        this.postMessageToWallet(message);
        resolve();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private postMessageToWallet(message: any) {
    if (!isClient) return;

    console.log('Posting message to wallet:', message);
    this.walletWindow?.postMessage(message, {
      targetOrigin: this.walletOrigin,
    });
  }

  private isWalletOpen(): boolean {
    if (!isClient) return false;
    return this.walletWindow !== null && !this.walletWindow?.closed;
  }

  private handleWalletClosed() {
    this.walletWindow = null;
    this.callbacks.forEach((callback) => {
      callback({ error: { message: 'Wallet window was closed' } });
    });
    this.callbacks.clear();
    this.pendingRequests.clear();
  }

  private handleMessage = (event: MessageEvent) => {
    if (event.origin !== this.walletOrigin) return;

    const response = event.data;
    const callback = this.callbacks.get(response.id);
    if (callback) {
      callback(response);
      this.callbacks.delete(response.id);
    }
  };

  disconnect() {
    if (!isClient) return;

    this.connectionState = 'disconnected';
    this.session = undefined;
    try {
      localStorage.removeItem('walletSession');
    } catch (error) {
      console.warn('Failed to remove wallet session:', error);
    }
    if (this.isWalletOpen()) {
      this.walletWindow?.close();
    }
    this.walletWindow = null;
    this.handleWalletClosed();
  }

  getWalletAddress(): string | undefined {
    return this.session?.walletAddress;
  }
}
