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
    this.observeFullScreenChanges();
  }

  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .yt-transcript-copier-btn {
        position: absolute;
        bottom: 60px;
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
        display: none;
      }
      .yt-transcript-copier-settings {
        position: absolute;
        bottom: 100px;
        right: 12px;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 2px;
        padding: 8px;
        z-index: 60;
        display: none;
      }
      .yt-transcript-copier-settings label {
        display: block;
        margin-bottom: 5px;
        color: white;
        font-size: 13px;
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
    this.addButtonToPlayer();
  }

  addButtonToPlayer() {
    const playerContainer = document.querySelector('#movie_player');
    if (playerContainer) {
      playerContainer.appendChild(this.button);
    } else {
      setTimeout(() => this.addButtonToPlayer(), 1000); // Retry after 1 second if player not found
    }
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

  observeFullScreenChanges() {
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.button.style.display = 'none';
      } else {
        this.button.style.display = 'block';
      }
    });
  }

  updateButtonStyle() {
    // Button style is now consistent across themes
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
