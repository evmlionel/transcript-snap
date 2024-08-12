// Main class for the YouTube Transcript Copier
class YouTubeTranscriptCopier {
  constructor() {
    this.button = null;
    this.settings = {
      includeTimestamps: false,
      darkMode: false,
    };
    this.init();
  }

  init() {
    this.createStyles();
    this.createButton();
    this.createSettingsPanel();
    this.observeThemeChanges();
  }

  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .yt-transcript-copier-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 10px 16px;
        background-color: var(--yt-spec-brand-button-background);
        color: var(--yt-spec-static-brand-white);
        border: none;
        border-radius: 18px;
        cursor: pointer;
        font-family: Roboto, Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .yt-transcript-copier-btn:hover {
        background-color: var(--yt-spec-brand-button-background-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      .yt-transcript-copier-settings {
        position: fixed;
        bottom: 70px;
        right: 20px;
        background-color: var(--yt-spec-brand-background-primary);
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9998;
        display: none;
      }
      .yt-transcript-copier-settings label {
        display: block;
        margin-bottom: 5px;
        color: var(--yt-spec-text-primary);
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
    `;
    document.head.appendChild(style);
  }

  createButton() {
    this.button = document.createElement('button');
    this.button.textContent = 'Copy Transcript';
    this.button.className = 'yt-transcript-copier-btn';
    this.button.addEventListener('click', () => this.handleButtonClick());
    document.body.appendChild(this.button);
  }

  createSettingsPanel() {
    const panel = document.createElement('div');
    panel.className = 'yt-transcript-copier-settings';
    panel.innerHTML = `
      <label>
        <input type="checkbox" id="includeTimestamps"> Include timestamps
      </label>
    `;
    document.body.appendChild(panel);

    const checkbox = panel.querySelector('#includeTimestamps');
    checkbox.addEventListener('change', (e) => {
      this.settings.includeTimestamps = e.target.checked;
    });

    this.button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
  }

  observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'dark') {
          this.settings.darkMode =
            document.documentElement.hasAttribute('dark');
          this.updateButtonStyle();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
  }

  updateButtonStyle() {
    if (this.settings.darkMode) {
      this.button.style.backgroundColor = '#3ea6ff';
      this.button.style.color = '#0f0f0f';
    } else {
      this.button.style.backgroundColor = '';
      this.button.style.color = '';
    }
  }

  handleButtonClick() {
    this.openTranscript();
    setTimeout(() => this.extractAndCopyTranscript(), 1000);
  }

  openTranscript() {
    const showTranscriptButton = document.querySelector(
      'button[aria-label="Show transcript"]'
    );
    if (showTranscriptButton) {
      showTranscriptButton.click();
    }
  }

  extractAndCopyTranscript() {
    const transcriptItems = document.querySelectorAll(
      'yt-formatted-string.ytd-transcript-segment-renderer'
    );
    if (transcriptItems.length === 0) {
      this.showNotification('No transcript found for this video.', 'error');
      return;
    }

    const transcriptText = Array.from(transcriptItems)
      .reduce((acc, item, index) => {
        if (this.settings.includeTimestamps || index % 2 === 1) {
          acc.push(item.textContent.trim());
        }
        return acc;
      }, [])
      .join(this.settings.includeTimestamps ? '\n' : ' ');

    navigator.clipboard
      .writeText(transcriptText)
      .then(() =>
        this.showNotification('Transcript copied to clipboard!', 'success')
      )
      .catch((err) =>
        this.showNotification(
          'Failed to copy transcript. Please try again.',
          'error'
        )
      );
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'yt-transcript-copier-notification';
    notification.style.backgroundColor =
      type === 'success' ? '#43a047' : '#d32f2f';
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
}

// Initialize the copier when the page is loaded
window.addEventListener('load', () => {
  new YouTubeTranscriptCopier();
});
