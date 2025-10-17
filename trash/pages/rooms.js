import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

const mockRooms = [
  { id:'r1', title:'Deluxe King', price:6500, img:'/public/assets/images/room-king.jpg', amenities:['King bed','Sea view','Breakfast'] },
  { id:'r2', title:'Twin Garden', price:5200, img:'/public/assets/images/room-twin.jpg', amenities:['Twin beds','Garden view','Wi‑Fi'] },
  { id:'r3', title:'Suite Oceanfront', price:9800, img:'/public/assets/images/room-suite.jpg', amenities:['Suite','Oceanfront','Balcony'] },
];

export async function RoomsPage(){
  window.kinaSearchRooms = (e) => {
    e?.preventDefault?.();
    const checkIn = document.querySelector('input[name="checkin"]').value;
    const checkOut = document.querySelector('input[name="checkout"]').value;
    if(checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)){
      showToast('Checkout must be after check-in','error');
      return;
    }
    showToast('Availability updated', 'success');
  };

  window.kinaBookRoom = (id) => {
    const room = mockRooms.find(r => r.id===id);
    if(!room) return;
    const modal = openModal(`
      <h3 style="margin-top:0">Book ${room.title}</h3>
      <p style="color:var(--color-muted)">₱${room.price.toLocaleString()} / night</p>
      <form onsubmit="event.preventDefault();document.querySelector('.modal').remove();location.hash='#/bookings';showToast('Reservation submitted','success')">
        <div class="form-row">
          <div><label>Check-in</label><input class="input" type="date" required></div>
          <div><label>Check-out</label><input class="input" type="date" required></div>
          <div><label>Guests</label><input class="input" type="number" min="1" value="2" required></div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn primary" type="button" onclick="document.querySelector('.modal').remove();location.hash='#/checkout'">Proceed to Checkout</button>
          <button class="btn" type="button" onclick="document.querySelector('.modal').remove()">Cancel</button>
        </div>
      </form>
    `);
  };

  const search = `
    <form class="form" onsubmit="kinaSearchRooms(event)">
      <div class="form-row">
        <div><label>Check-in</label><input class="input" type="date" name="checkin" required></div>
        <div><label>Check-out</label><input class="input" type="date" name="checkout" required></div>
        <div><label>Guests</label><input class="input" type="number" name="guests" min="1" value="2" required></div>
        <div style="align-self:end"><button class="btn primary" type="submit">Search</button></div>
      </div>
    </form>`;

  const cards = mockRooms.map(r => `
    <article class="tile" style="padding:0;overflow:hidden">
      <div style="aspect-ratio:16/9;background:url('${r.img}') center/cover"></div>
      <div style="padding:14px">
        <h3 style="margin:6px 0 8px">${r.title}</h3>
        <div style="color:var(--color-muted);margin-bottom:8px">${r.amenities.join(' · ')}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="package-price">₱${r.price.toLocaleString()}/night</div>
          <button class="btn" onclick="kinaBookRoom('${r.id}')">Book</button>
        </div>
      </div>
    </article>`).join('');

  return `
    <section class="container">
      <div class="section-head"><h2>Rooms & Availability</h2></div>
      ${search}
      <div class="tiles" style="grid-template-columns:repeat(3,1fr)">${cards}</div>
    </section>`;
}



