class WakeLocker extends HTMLElement {
  #wakeLock = null;
  #checkbox = null;
  #handleChange = null;

  constructor() {
    super();
    if ('wakeLock' in navigator) {
      this.#checkbox = this.querySelector('input[type="checkbox"]');
    } else {
      console.info('Wake Lock not available at this moment.');
    }
  }

  connectedCallback() {
    if (!this.#checkbox) return;

    this.#handleChange = async () => {
      if (this.#wakeLock) {
        try {
          await this.#wakeLock.release();
        } catch(e) {
          console.warn('Wake Lock release failed.', e);
        }
      } else {
        try {
          console.info('Wake Lock requested.');
          this.#wakeLock = await navigator.wakeLock.request('screen');
          console.info('Wake Lock request granted.');
          this.#wakeLock.addEventListener('release', () => {
            console.info('Wake Lock released.');
            this.#checkbox.checked = false;
            this.#wakeLock = null;
          });
        } catch(e) {
          // The Wake Lock request can fail because of for example low battery.
          console.warn('Wake Lock request failed.', e);
          this.#checkbox.disabled = true;
        }
      }
    }

    this.#checkbox.addEventListener('change', this.#handleChange);
  }

  disconnectedCallback() {
    if (this.#checkbox) {
      this.#checkbox.removeEventListener('change', this.#handleChange);
      this.#handleChange = null;
    }
  }
}

if (!customElements.get('wake-locker')) {
  customElements.define('wake-locker', WakeLocker);
}
