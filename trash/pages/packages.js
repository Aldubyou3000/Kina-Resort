export async function PackagesPage(){
  const data = [
    { id:'lux-rooms', title:'Luxury Rooms', img:'/public/assets/images/pool-3.jpg', price:'₱6,500+/night', desc:'Spacious rooms with ocean views, modern bath, and breakfast.' },
    { id:'infinity-pool', title:'Infinity Pool Access', img:'/public/assets/images/pool-1.jpg', price:'Included', desc:'Sweeping horizon pool perfect for sunny afternoons.' },
    { id:'beach-cottages', title:'Beachfront Cottages', img:'/public/assets/images/pool-2.jpg', price:'₱7,500+/night', desc:'Private veranda, direct beach access, ideal for couples.' },
    { id:'dining', title:'Gourmet Dining Options', img:'/public/assets/images/pool-1.jpg', price:'Varies', desc:'Seafood-forward menus and tropical cocktails.' },
    { id:'water-sports', title:'Water Sports', img:'/public/assets/images/pool-2.jpg', price:'₱800+/hour', desc:'Kayaks, paddleboards, and snorkeling gear.' },
    { id:'day-pass', title:'Day Pass', img:'/public/assets/images/pool-3.jpg', price:'₱1,200', desc:'Pool + facilities access for day visitors.' },
  ];

  const controls = `
    <div class="packages-controls">
      <input aria-label="Search" class="input" placeholder="Search (e.g., rooms, pool)" oninput="window.kinaFilterPackages?.(this.value)">
      <select aria-label="Type filter" onchange="window.kinaFilterPackages?.(this.value)">
        <option value="">All</option>
        <option value="rooms">Rooms</option>
        <option value="pool">Pool</option>
        <option value="cottages">Cottages</option>
        <option value="dining">Dining</option>
      </select>
    </div>`;

  function card(p){
    return `
    <article class="package-card" data-id="${p.id}">
      <div class="package-media" style="background-image:url('${p.img}')"></div>
      <div class="package-meta">
        <div class="package-title">${p.title}</div>
        <div class="package-price">${p.price}</div>
      </div>
      <div class="package-overlay">
        <h4 style="margin:0">${p.title}</h4>
        <p style="color:var(--color-muted)">${p.desc}</p>
        <small style="color:var(--color-muted)">Tip: Ideal on clear forecast days.</small>
        <div class="package-cta">
          <a class="btn primary" href="#/rooms">Book This</a>
          <a class="btn" href="#/rooms">Learn More</a>
        </div>
      </div>
    </article>`;
  }

  const grid = `<div class="packages-grid">${data.map(card).join('')}</div>`;

  // Simple client filter hook
  window.kinaFilterPackages = (q) => {
    const val = (q||'').toLowerCase();
    document.querySelectorAll('.package-card').forEach(node => {
      const id = node.getAttribute('data-id')||'';
      node.style.display = id.includes(val) ? '' : 'none';
    });
  };

  return `
    <section class="container">
      <div class="section-head"><h2>Packages</h2></div>
      ${controls}
      ${grid}
    </section>`;
}



