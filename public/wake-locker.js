class WakeLocker extends HTMLElement {
  #wakeLockSentinel = null;
  #checkbox = null;
  #verbose = false;

  #log(level, ...args) {
    if (this.#verbose === false) return;
    const log = console[level] || console.log;
    log(...args);
  }

  #requestWakeLock = async (message = '') => {
    try {
      this.#log('info', message || 'Requesting Wake Lock.');
      this.#wakeLockSentinel = await navigator.wakeLock.request('screen');
      this.#log('info', 'Wake Lock request granted.');
      this.#wakeLockSentinel.addEventListener('release', () => {
        this.#log('info', 'Wake Lock released.');
        this.#wakeLockSentinel = null;
      });
    } catch (e) {
      // The Wake Lock request can be denied because of for example low battery.
      this.#log('warn', 'Wake Lock request denied.', e);
    }
  };

  #releaseWakeLock = async () => {
    const wakeLockSentinel = this.#wakeLockSentinel;
    if (!wakeLockSentinel) return;
    try {
      await wakeLockSentinel.release();
    } catch (e) {
      this.#log('warn', 'Wake Lock release failed.', e);
      this.#wakeLockSentinel = null;
    }
  };

  #visibilityChange = () => {
    if (document.visibilityState !== 'visible') return;
    if (this.#checkbox === null || this.#checkbox.checked) {
      if (this.#wakeLockSentinel === null) {
        this.#requestWakeLock('Re-requesting Wake Lock.');
      }
    }
  };

  #toggle = async (event) => {
    const target = event.target;
    if (target.checked) {
      this.#requestWakeLock();
      document.addEventListener('visibilitychange', this.#visibilityChange);
    } else {
      document.removeEventListener('visibilitychange', this.#visibilityChange);
      this.#releaseWakeLock();
    }
  };

  static get observedAttributes() {
    return ['verbose'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'verbose') {
      this.#verbose = this.hasAttribute('verbose');
    }
  }

  get verbose() {
    return this.#verbose;
  }

  set verbose(value) {
    if (Boolean(value) === true) {
      this.setAttribute('verbose', '');
    } else {
      this.removeAttribute('verbose');
    }
  }

  async connectedCallback() {
    this.#verbose = this.hasAttribute('verbose');

    if ('wakeLock' in navigator) {
      this.#checkbox = this.querySelector('input[type="checkbox"]');

      if (this.#checkbox) {
        this.#checkbox.addEventListener('change', this.#toggle);
      }

      if (this.#checkbox === null || this.#checkbox.checked) {
        await this.#requestWakeLock();
        document.addEventListener('visibilitychange', this.#visibilityChange);
      }
    } else {
      this.#log('warn', 'Wake Lock not available in this browser.');
    }
  }

  disconnectedCallback() {
    if (this.#checkbox) {
      this.#checkbox.removeEventListener('change', this.#toggle);
    }
    document.removeEventListener('visibilitychange', this.#visibilityChange);
    this.#releaseWakeLock();
  }
}

if (!customElements.get('wake-locker')) {
  customElements.define('wake-locker', WakeLocker);
}
