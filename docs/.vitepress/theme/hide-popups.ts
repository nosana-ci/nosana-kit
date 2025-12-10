// Script to hide Twoslash popups on page load
// This runs after the page is rendered to ensure popups are hidden

export function hideTwoslashPopups() {
  if (typeof window === 'undefined') return;
  
  const hidePopups = () => {
    const popups = document.querySelectorAll('.v-popper__popper[data-theme="twoslash-query"]');
    popups.forEach((popup) => {
      const htmlPopup = popup as HTMLElement;
      // Only hide if not being hovered (no data-show attribute)
      if (!popup.hasAttribute('data-show') && !htmlPopup.classList.contains('v-popper__popper--shown')) {
        htmlPopup.style.setProperty('display', 'none', 'important');
        htmlPopup.style.setProperty('visibility', 'hidden', 'important');
        htmlPopup.style.setProperty('opacity', '0', 'important');
        htmlPopup.style.setProperty('pointer-events', 'none', 'important');
        // Move off-screen as backup
        htmlPopup.style.setProperty('position', 'absolute', 'important');
        htmlPopup.style.setProperty('left', '-9999px', 'important');
        htmlPopup.style.setProperty('top', '-9999px', 'important');
      }
    });
  };
  
  // Run immediately
  hidePopups();
  
  // Run after short delays to catch any that render later
  setTimeout(hidePopups, 0);
  setTimeout(hidePopups, 50);
  setTimeout(hidePopups, 100);
  setTimeout(hidePopups, 300);
  setTimeout(hidePopups, 500);
  
  // Also run on DOM mutations (for dynamically loaded content)
  if (document.body) {
    const observer = new MutationObserver(() => {
      hidePopups();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Clean up observer after 10 seconds (content should be loaded by then)
    setTimeout(() => observer.disconnect(), 10000);
  }
}
