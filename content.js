// Main class for the YouTube Transcript Copier
class YouTubeTranscriptCopier {
  constructor() {
    // Cache DOM elements
    this.cachedElements = new Map()
    this.observers = new Set() // Ensure this is initialized before calling init()
    this.settings = { includeTimestamps: false, darkMode: false } // Initialize settings
    this.init()
  }

  // Optimized DOM element getter
  getElement(selector) {
    if (!this.cachedElements.has(selector)) {
      this.cachedElements.set(selector, document.querySelector(selector))
    }
    return this.cachedElements.get(selector)
  }

  // Clear cache on navigation
  clearCache() {
    this.cachedElements.clear()
  }

  init() {
    this.createStyles()
    this.createButton()
    this.createSettingsPanel()
    this.observeThemeChanges()
    this.observeFullScreenChanges()
    this.observeNavigation()
  }

  createStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .yt-transcript-copier-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 60;
        padding: 8px 12px;
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-family: Roboto, Arial, sans-serif;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        opacity: 0.7;
      }
      .yt-transcript-copier-btn:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.8);
      }
      .ytp-fullscreen .yt-transcript-copier-btn {
        display: none; /* Hide in fullscreen mode */
      }
      .yt-transcript-copier-settings {
        position: absolute;
        top: 50px;
        right: 12px;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 2px;
        padding: 8px;
        z-index: 60;
        display: none;
      }
      .yt-transcript-copier-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        color: white;
        font-family: Roboto, Arial, sans-serif;
        z-index: 10000;
        transition: opacity 0.5s;
      }
    `
    document.head.appendChild(style)
  }

  createButton() {
    this.button = document.createElement('button')
    this.button.textContent = 'Copy Transcript'
    this.button.className = 'yt-transcript-copier-btn'
    this.button.addEventListener('click', this.handleButtonClick.bind(this))
    this.addButtonToPlayer()
  }

  addButtonToPlayer() {
    const playerContainer = document.querySelector('#movie_player')
    if (playerContainer) {
      // Remove existing button if present
      const existingButton = document.querySelector('.yt-transcript-copier-btn')
      if (existingButton) {
        existingButton.remove()
      }
      playerContainer.appendChild(this.button)
    } else {
      setTimeout(() => this.addButtonToPlayer(), 1000)
    }
  }

  createSettingsPanel() {
    const panel = document.createElement('div')
    panel.className = 'yt-transcript-copier-settings'
    panel.innerHTML = `
      <label>
        <input type="checkbox" id="includeTimestamps"> Include timestamps
      </label>
    `
    document.body.appendChild(panel)

    const checkbox = panel.querySelector('#includeTimestamps')
    checkbox.addEventListener('change', (e) => {
      this.settings.includeTimestamps = e.target.checked
    })

    this.button.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
    })
  }

  observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'dark') {
          this.settings.darkMode = document.documentElement.hasAttribute('dark')
          this.updateButtonStyle()
        }
      })
    })
    observer.observe(document.documentElement, { attributes: true })
  }

  observeFullScreenChanges() {
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.button.style.display = 'none'
      } else {
        this.button.style.display = 'block'
      }
    })
  }

  updateButtonStyle() {
    // Button style is now consistent across themes
  }

  handleButtonClick() {
    this.openTranscript()
    this.waitForTranscript()
  }

  openTranscript() {
    const showTranscriptButton = document.querySelector(
      'button[aria-label="Show transcript"]'
    )
    if (showTranscriptButton) {
      showTranscriptButton.click()
    }
  }

  waitForTranscript() {
    const selectors = [
      'yt-formatted-string.ytd-transcript-segment-renderer',
      '.ytd-transcript-segment-renderer',
      '[class*="transcript-segment"]', // Fallback
    ]

    const observer = new MutationObserver((mutations, obs) => {
      let transcriptItems
      for (const selector of selectors) {
        transcriptItems = document.querySelectorAll(selector)
        if (transcriptItems.length > 0) break
      }

      if (transcriptItems?.length > 0) {
        obs.disconnect()
        this.extractAndCopyTranscript()
      }
    })

    // Optimize observer config
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    })

    // Add progressive timeout with retries
    let attempts = 0
    const maxAttempts = 3
    const tryExtract = () => {
      if (attempts++ < maxAttempts) {
        this.extractAndCopyTranscript()
        setTimeout(tryExtract, 1000 * attempts)
      }
    }
    setTimeout(tryExtract, 3000)
  }

  extractAndCopyTranscript() {
    try {
      const transcriptItems = document.querySelectorAll(
        'yt-formatted-string.ytd-transcript-segment-renderer'
      )

      if (!transcriptItems.length) {
        throw new Error('No transcript items found')
      }

      const text = Array.from(transcriptItems)
        .map((item) => item.textContent.trim())
        .filter(Boolean)
        .join('\n')

      // Try modern clipboard API first
      navigator.clipboard.writeText(text).then(
        () => this.showSuccess(),
        () => {
          // Fallback to execCommand
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.opacity = '0'
          document.body.appendChild(textArea)
          textArea.select()

          try {
            const success = document.execCommand('copy')
            if (success) {
              this.showSuccess()
            } else {
              throw new Error('execCommand failed')
            }
          } catch (err) {
            console.error('Fallback clipboard method failed:', err)
            this.showError()
          } finally {
            document.body.removeChild(textArea)
          }
        }
      )
    } catch (error) {
      console.error('Transcript extraction failed:', error)
      this.showError()
    }
  }

  showNotification(message, type) {
    requestAnimationFrame(() => {
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className = 'yt-transcript-copier-notification'
      notification.style.backgroundColor =
        type === 'success' ? '#43a047' : '#d32f2f'
      document.body.appendChild(notification)

      setTimeout(() => {
        notification.style.opacity = '0'
        setTimeout(() => notification.remove(), 500)
      }, 3000)
    })
  }

  observeNavigation() {
    const observer = new MutationObserver(
      this.debounce(() => {
        if (window.location.pathname === '/watch') {
          this.clearCache()
          this.addButtonToPlayer()
        }
      }, 250)
    )

    this.addObserver(observer)
    observer.observe(document.querySelector('title'), {
      subtree: true,
      characterData: true,
      childList: true,
    })
  }

  debounce(func, wait) {
    let timeout
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  showSuccess() {
    this.button.textContent = '✓ Copied!'
    setTimeout(() => {
      this.button.textContent = 'Copy Transcript'
    }, 2000)
  }

  showError() {
    this.button.textContent = '⚠️ Failed'
    this.button.style.backgroundColor = '#ff4444'
    setTimeout(() => {
      this.button.textContent = 'Copy Transcript'
      this.button.style.backgroundColor = ''
    }, 2000)
  }

  // Cleanup method
  destroy() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
    this.button?.remove()
    this.clearCache()
  }

  addObserver(observer) {
    if (this.observers) {
      this.observers.add(observer)
    } else {
      console.error('Observers set is not initialized')
    }
  }
}

// Initialize the copier when the page is loaded
let instance = null

function initializeExtension() {
  if (instance) {
    instance.destroy()
  }

  if (document.querySelector('#movie_player')) {
    instance = new YouTubeTranscriptCopier()
  } else {
    setTimeout(initializeExtension, 1000)
  }
}

// Start checking as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension)
} else {
  initializeExtension()
}
