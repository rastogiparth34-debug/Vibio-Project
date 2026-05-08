document.addEventListener('DOMContentLoaded', () => {
  // 1. Read theme from localStorage and apply
  const savedTheme = localStorage.getItem('vibio_theme') || 'theme-dark';
  applyTheme(savedTheme);

  // Global Back Button
  const backBtnHtml = `
    <button id="global-back-btn" onclick="window.history.back()" style="background: var(--card-bg, rgba(18,22,32,0.5)); border: 1px solid var(--border-color, rgba(79, 70, 229, 0.5)); color: var(--text-main, #fff); padding: 6px 14px; border-radius: 20px; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 5px; margin-right: 15px; transition: all 0.2s; backdrop-filter: blur(10px);">
        ← Back
    </button>
  `;

  const isLandingPage = window.location.pathname.endsWith('vibio.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
  
  if (!isLandingPage) {
      const header = document.querySelector('.header');
      if (header) {
          // Prevent duplicating back buttons if one already exists (like in createPlaylist.html)
          if (!document.querySelector('.back-btn') && !document.querySelector('#global-back-btn')) {
              header.insertAdjacentHTML('afterbegin', backBtnHtml);
          }
      } else {
          if (!document.querySelector('.back-btn') && !document.querySelector('#global-back-btn')) {
              const fallbackBackBtn = document.createElement('div');
              fallbackBackBtn.innerHTML = backBtnHtml;
              fallbackBackBtn.style.position = 'fixed';
              fallbackBackBtn.style.top = '15px';
              fallbackBackBtn.style.left = '15px';
              fallbackBackBtn.style.zIndex = '10000';
              document.body.appendChild(fallbackBackBtn);
          }
      }
  }

  // 2. Create the theme switcher UI
  const themeSelectorHtml = `
    <div class="theme-selector-container" style="display: flex; align-items: center; margin: 0 15px;">
      <select id="themeSelect" class="theme-select" style="background: var(--input-bg, #1e212b); color: var(--text-main, #edeef2); border: 1px solid rgba(79, 70, 229, 0.5); padding: 5px 10px; border-radius: 20px; outline: none; cursor: pointer;">
        <option value="theme-dark">🌙 Dark Theme</option>
        <option value="theme-light">☀️ Light Theme</option>
        <option value="theme-neon">⚡ Neon Theme</option>
      </select>
    </div>
  `;

  // 3. Inject it into the navbar.
  // We'll look for .nav-links or .auth-buttons or .options or just somewhere in the header.
  let targetContainer = document.querySelector('.nav-links');
  if (!targetContainer) {
    targetContainer = document.querySelector('.auth-buttons');
  }
  if (!targetContainer) {
    // For login/signup pages where there might not be a standard nav
    targetContainer = document.querySelector('.brand') || document.querySelector('h1');
  }

  if (targetContainer) {
    // If it's a flex container, we can insert it nicely.
    targetContainer.insertAdjacentHTML('afterend', themeSelectorHtml);
  } else {
    // Fallback: just put it absolute top right
    const fallbackDiv = document.createElement('div');
    fallbackDiv.innerHTML = themeSelectorHtml;
    fallbackDiv.style.position = 'absolute';
    fallbackDiv.style.top = '10px';
    fallbackDiv.style.right = '10px';
    fallbackDiv.style.zIndex = '1000';
    document.body.appendChild(fallbackDiv);
  }

  // Set the correct value in dropdown
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = savedTheme;
    
    // Add event listener
    themeSelect.addEventListener('change', (e) => {
      const selectedTheme = e.target.value;
      applyTheme(selectedTheme);
      localStorage.setItem('vibio_theme', selectedTheme);
    });
  }

  function applyTheme(themeName) {
    // Remove existing theme classes
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-neon');
    
    // Add new theme class
    if (themeName !== 'theme-dark') {
      document.body.classList.add(themeName);
    }
  }
});
