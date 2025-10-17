import { showToast } from '../components/toast.js';

let mockBookings = [
  { id:'b1', room:'Deluxe King', checkIn:'2025-11-20', checkOut:'2025-11-23', status:'Confirmed' },
  { id:'b2', room:'Twin Garden', checkIn:'2025-12-05', checkOut:'2025-12-07', status:'Pending' },
];

export async function BookingsPage(){
  window.kinaCancelBooking = (id) => {
    mockBookings = mockBookings.map(b => b.id===id ? { ...b, status:'Cancelled' } : b);
    showToast('Booking cancelled', 'success');
    location.hash = '#/bookings';
    location.hash = '#/bookings';
  };

  const rows = mockBookings.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.room}</td>
      <td>${b.checkIn}</td>
      <td>${b.checkOut}</td>
      <td><span class="chip badge">${b.status}</span></td>
      <td>
        <button class="btn" onclick="kinaCancelBooking('${b.id}')">Cancel</button>
      </td>
    </tr>
  `).join('');

  return `
    <section class="container">
      <div class="section-head"><h2>My Bookings</h2></div>
      <div style="margin-bottom:10px">
        <button class="btn" onclick="location.hash='#/rooms'">New Reservation</button>
      </div>
      <table class="table" aria-label="Bookings table">
        <thead><tr><th>ID</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}





