import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

const mockRooms = [
  { id:'r1', title:'Deluxe King', price:6500, img:'assets/images/pool-1.jpg', amenities:['King bed','Sea view','Breakfast'] },
  { id:'r2', title:'Twin Garden', price:5200, img:'assets/images/pool-2.jpg', amenities:['Twin beds','Garden view','Wi‑Fi'] },
  { id:'r3', title:'Suite Oceanfront', price:9800, img:'assets/images/pool-3.jpg', amenities:['Suite','Oceanfront','Balcony'] },
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
    openModal(`
      <h3 style=\"margin-top:0\">Book ${room.title}</h3>
      <p style=\"color:var(--color-muted)\">₱${room.price.toLocaleString()} / night</p>
      <form onsubmit=\"event.preventDefault();document.querySelector('.modal').remove();location.hash='#/checkout'\">
        <div class=\"form-row\">
          <div><label>Check-in</label><input class=\"input\" type=\"date\" required></div>
          <div><label>Check-out</label><input class=\"input\" type=\"date\" required></div>
          <div><label>Guests</label><input class=\"input\" type=\"number\" min=\"1\" value=\"2\" required></div>
        </div>
        <div style=\"margin-top:12px;display:flex;gap:8px\"><button class=\"btn primary\" type=\"submit\">Proceed to Checkout</button><button class=\"btn\" type=\"button\" onclick=\"document.querySelector('.modal').remove()\">Cancel</button></div>
      </form>
    `);
  };

  const search = `
    <div class=\"search-hero\" style=\"background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%); padding: 40px 0; margin: -20px -20px 40px -20px; border-radius: 0 0 20px 20px;\">
      <div class=\"container\" style=\"max-width: 800px;\">
        <div class=\"section-head\" style=\"text-align: center; margin-bottom: 30px;\">
          <h2 style=\"color: white; font-size: 36px; margin: 0;\">Find Your Perfect Stay</h2>
          <p style=\"color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 18px;\">Discover our luxurious accommodations</p>
        </div>
        <form class=\"form\" onsubmit=\"kinaSearchRooms(event)\" style=\"background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);\">
          <div class=\"form-row\">
            <div><label>Check-in</label><input class=\"input\" type=\"date\" name=\"checkin\" required></div>
            <div><label>Check-out</label><input class=\"input\" type=\"date\" name=\"checkout\" required></div>
            <div><label>Guests</label><input class=\"input\" type=\"number\" name=\"guests\" min=\"1\" value=\"2\" required></div>
            <div style=\"align-self:end\"><button class=\"btn primary\" type=\"submit\">Search Rooms</button></div>
          </div>
        </form>
      </div>
    </div>`;

  const cards = mockRooms.map(r => `
    <article class=\"room-card\" style=\"background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative;\">
      <div style=\"aspect-ratio:16/10;background:url('${r.img}') center/cover; position: relative; overflow: hidden;\">
        <div style=\"position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 20px; font-weight: 600; color: var(--color-text);\">₱${r.price.toLocaleString()}/night</div>
      </div>
      <div style=\"padding: 20px;\">
        <h3 style=\"margin: 0 0 12px; font-size: 24px; color: var(--color-text); position: relative;\">${r.title}</h3>
        <div style=\"color: var(--color-muted); margin-bottom: 16px; line-height: 1.5;\">${r.amenities.join(' • ')}</div>
        <div style=\"display: flex; align-items: center; justify-content: space-between; margin-top: 16px;\">
          <div style=\"display: flex; gap: 8px; flex-wrap: wrap;\">
            ${r.amenities.map(amenity => `<span style=\"background: var(--color-bg); color: var(--color-text); padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;\">${amenity}</span>`).join('')}
          </div>
          <button class=\"btn primary\" onclick=\"kinaBookRoom('${r.id}')\" style=\"font-weight: 600;\">Book Now</button>
        </div>
      </div>
    </article>`).join('');

  return `
    <section class=\"container\">
      ${search}
      <div class=\"section-head\" style=\"text-align: center; margin: 40px 0 30px;\">
        <h2 style=\"font-size: 36px; margin: 0; color: var(--color-text);\">Available Rooms</h2>
        <p style=\"color: var(--color-muted); margin: 8px 0 0; font-size: 18px;\">Choose from our selection of premium accommodations</p>
      </div>
      <div class=\"rooms-grid\" style=\"display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; margin-top: 30px;\">
        ${cards}
      </div>
      <style>
        .room-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .search-hero {
          position: relative;
          overflow: hidden;
        }
        .search-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('images/kina1.jpg') center/cover;
          opacity: 0.1;
          z-index: 0;
        }
        .search-hero .container {
          position: relative;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .rooms-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </section>`;
}


