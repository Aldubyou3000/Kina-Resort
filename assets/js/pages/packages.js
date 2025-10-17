export async function PackagesPage(){
  const data = [
    { id:'lux-rooms', title:'Luxury Rooms', img:'assets/images/pool-3.jpg', price:'₱6,500+/night', desc:'Spacious rooms with ocean views, modern bath, and breakfast.' },
    { id:'infinity-pool', title:'Infinity Pool Access', img:'assets/images/pool-1.jpg', price:'Included', desc:'Sweeping horizon pool perfect for sunny afternoons.' },
    { id:'beach-cottages', title:'Beachfront Cottages', img:'assets/images/pool-2.jpg', price:'₱7,500+/night', desc:'Private veranda, direct beach access, ideal for couples.' },
    { id:'dining', title:'Gourmet Dining Options', img:'assets/images/pool-1.jpg', price:'Varies', desc:'Seafood-forward menus and tropical cocktails.' },
    { id:'water-sports', title:'Water Sports', img:'assets/images/pool-2.jpg', price:'₱800+/hour', desc:'Kayaks, paddleboards, and snorkeling gear.' },
    { id:'day-pass', title:'Day Pass', img:'assets/images/pool-3.jpg', price:'₱1,200', desc:'Pool + facilities access for day visitors.' },
  ];

  const controls = `
    <div class="packages-hero" style="background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%); padding: 40px 0; margin: -20px -20px 40px -20px; border-radius: 0 0 20px 20px; position: relative; overflow: hidden;">
      <div class="container" style="max-width: 1000px; position: relative; z-index: 1;">
        <div class="section-head" style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; font-size: 36px; margin: 0;">Discover Our Packages</h2>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 18px;">Experience luxury with our curated offerings</p>
        </div>
        <div class="packages-controls" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
          <input aria-label="Search" class="input" placeholder="Search packages..." oninput="window.kinaFilterPackages?.(this.value)" style="flex: 1; min-width: 200px;">
          <select aria-label="Type filter" onchange="window.kinaFilterPackages?.(this.value)" style="min-width: 150px;">
            <option value="">All Categories</option>
            <option value="rooms">Rooms</option>
            <option value="pool">Pool</option>
            <option value="cottages">Cottages</option>
            <option value="dining">Dining</option>
          </select>
        </div>
      </div>
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('images/kina2.jpg') center/cover; opacity: 0.1; z-index: 0;"></div>
    </div>`;

  function card(p){
    return `
    <article class="package-card" data-id="${p.id}" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; min-height: 320px;">
      <div class="package-media" style="background-image:url('${p.img}'); position: absolute; inset: 0; background-size: cover; background-position: center; transition: filter 0.4s ease, transform 0.4s ease;"></div>
      <div class="package-meta" style="position: absolute; left: 16px; bottom: 16px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
        <div class="package-title" style="font-size: 20px; font-weight: 600; margin: 0 0 4px; color: var(--color-text);">${p.title}</div>
        <div class="package-price" style="color: var(--color-accent); font-weight: 600; font-size: 16px;">${p.price}</div>
      </div>
      <div class="package-overlay" style="position: absolute; top: 0; right: -100%; bottom: 0; width: 100%; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); transition: right 0.4s ease; display: flex; flex-direction: column; gap: 12px; padding: 20px; border-left: 1px solid rgba(255,255,255,0.2);">
        <h4 style="margin: 0; font-size: 22px; color: var(--color-text); font-weight: 600;">${p.title}</h4>
        <p style="color: var(--color-muted); margin: 0; line-height: 1.5; flex: 1;">${p.desc}</p>
        <small style="color: var(--color-muted); font-style: italic;">💡 Perfect for clear weather days</small>
        <div class="package-cta" style="display: flex; gap: 8px; margin-top: auto;">
          <a class="btn primary" href="#/rooms" style="flex: 1; text-align: center; font-weight: 600;">Book Now</a>
          <a class="btn" href="#/rooms" style="flex: 1; text-align: center;">Learn More</a>
        </div>
      </div>
    </article>`;
  }

  const grid = `<div class="packages-grid">${data.map(card).join('')}</div>`;

  window.kinaFilterPackages = (q) => {
    const val = (q||'').toLowerCase();
    document.querySelectorAll('.package-card').forEach(node => {
      const id = node.getAttribute('data-id')||'';
      node.style.display = id.includes(val) ? '' : 'none';
    });
  };

  return `
    <section class="container">
      ${controls}
      <div class="section-head" style="text-align: center; margin: 40px 0 30px;">
        <h2 style="font-size: 36px; margin: 0; color: var(--color-text);">Our Packages</h2>
        <p style="color: var(--color-muted); margin: 8px 0 0; font-size: 18px;">Choose from our curated selection of premium experiences</p>
      </div>
      ${grid}
      <style>
        .package-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .package-card:hover .package-media {
          filter: blur(2px) brightness(0.9);
          transform: scale(1.05);
        }
        .package-card:hover .package-overlay {
          right: 0;
        }
        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-top: 30px;
        }
        @media (max-width: 768px) {
          .packages-grid {
            grid-template-columns: 1fr;
          }
          .package-overlay {
            position: static;
            right: auto;
            width: auto;
            background: white;
            backdrop-filter: none;
            border-left: 0;
            padding: 16px;
            transition: none;
          }
          .package-card:hover .package-media {
            filter: none;
            transform: none;
          }
          .package-card:hover .package-overlay {
            right: auto;
          }
        }
      </style>
    </section>`;
}


