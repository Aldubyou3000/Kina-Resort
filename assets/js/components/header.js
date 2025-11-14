export function renderHeader(){
  // Update bookings tab visibility based on auth state
  if (window.kinaAuth) {
    if (window.kinaAuth.isLoggedIn() && window.kinaAuth.getCurrentUser()) {
      // Show bookings tab if logged in
      const bookingsLink = document.querySelector('a[href="#/bookings"]');
      if (bookingsLink) {
        const bookingsListItem = bookingsLink.closest('li[role="none"]');
        if (bookingsListItem) {
          bookingsListItem.hidden = false;
        }
      }
    } else {
      // Hide bookings tab if not logged in
      const bookingsLink = document.querySelector('a[href="#/bookings"]');
      if (bookingsLink) {
        const bookingsListItem = bookingsLink.closest('li[role="none"]');
        if (bookingsListItem) {
          bookingsListItem.hidden = true;
        }
      }
    }
  } else {
    // If auth hasn't initialized yet, hide bookings tab by default
    const bookingsLink = document.querySelector('a[href="#/bookings"]');
    if (bookingsLink) {
      const bookingsListItem = bookingsLink.closest('li[role="none"]');
      if (bookingsListItem) {
        bookingsListItem.hidden = true;
      }
    }
  }
}


