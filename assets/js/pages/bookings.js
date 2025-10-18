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
      <div class="section-head">
        <h2>My Bookings</h2>
      </div>
      <div class="bookings-controls">
        <button class="btn primary" onclick="location.hash='#/rooms'">New Reservation</button>
      </div>
      <table class="table" aria-label="Bookings table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      
      <style>
        .bookings-controls {
          margin-bottom: 20px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .table th {
          background: var(--color-accent);
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
        }
        
        .table td {
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        
        .table tr:hover {
          background: var(--color-bg);
        }
        
        .chip.badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .chip.badge:contains("Confirmed") {
          background: #d4edda;
          color: #155724;
        }
        
        .chip.badge:contains("Pending") {
          background: #fff3cd;
          color: #856404;
        }
        
        .chip.badge:contains("Cancelled") {
          background: #f8d7da;
          color: #721c24;
        }
        
        @media (max-width: 768px) {
          .table {
            font-size: 14px;
          }
          
          .table th,
          .table td {
            padding: 12px 8px;
          }
        }
      </style>
    </section>`;
}


