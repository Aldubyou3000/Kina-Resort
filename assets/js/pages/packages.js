export async function PackagesPage(){
  const data = [
    { id:'lux-rooms', title:'Luxury Rooms', img:'images/kina1.jpg', price:'₱6,500+/night', desc:'Spacious rooms with ocean views, modern bath, and breakfast.' },
    { id:'infinity-pool', title:'Infinity Pool Access', img:'images/kina2.jpg', price:'Included', desc:'Sweeping horizon pool perfect for sunny afternoons.' },
    { id:'beach-cottages', title:'Beachfront Cottages', img:'images/kina3.jpg', price:'₱7,500+/night', desc:'Private veranda, direct beach access, ideal for couples.' },
    { id:'dining', title:'Gourmet Dining Options', img:'images/kina1.jpg', price:'Varies', desc:'Seafood-forward menus and tropical cocktails.' },
    { id:'water-sports', title:'Water Sports', img:'images/kina2.jpg', price:'₱800+/hour', desc:'Kayaks, paddleboards, and snorkeling gear.' },
    { id:'day-pass', title:'Day Pass', img:'images/kina3.jpg', price:'₱1,200', desc:'Pool + facilities access for day visitors.' },
  ];

  function card(p){
    return `
    <article class="package-card" data-id="${p.id}">
      <div class="package-media" style="background-image:url('${p.img}')"></div>
      <div class="package-meta">
        <div class="package-title">${p.title}</div>
        <div class="package-price">${p.price}</div>
      </div>
      <div class="package-overlay">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <small>💡 Perfect for clear weather days</small>
        <div class="package-cta">
          <a class="btn primary" href="#/rooms">Book Now</a>
          <a class="btn" href="#/rooms">Learn More</a>
        </div>
      </div>
    </article>`;
  }

  window.kinaFilterPackages = (q) => {
    const val = (q||'').toLowerCase();
    document.querySelectorAll('.package-card').forEach(node => {
      const id = node.getAttribute('data-id')||'';
      node.style.display = id.includes(val) ? '' : 'none';
    });
  };

  return `
    <section class="container">
      <div class="packages-hero">
        <div class="container">
          <div class="section-head">
            <h2>Discover Our Packages</h2>
            <p>Experience luxury with our curated offerings</p>
          </div>
          <div class="packages-controls">
            <input aria-label="Search" class="input" placeholder="Search packages..." oninput="window.kinaFilterPackages?.(this.value)">
            <select aria-label="Type filter" onchange="window.kinaFilterPackages?.(this.value)">
              <option value="">All Categories</option>
              <option value="rooms">Rooms</option>
              <option value="pool">Pool</option>
              <option value="cottages">Cottages</option>
              <option value="dining">Dining</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="packages-grid">
        ${data.map(card).join('')}
      </div>
      
      <div class="section-head">
        <h2>Our Packages</h2>
        <p>Choose from our curated selection of premium experiences</p>
      </div>
      
      <style>
        .packages-hero {
          background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%);
          padding: 40px 0;
          margin: -20px -20px 40px -20px;
          border-radius: 0 0 20px 20px;
          position: relative;
          overflow: hidden;
        }
        
        .packages-hero .container {
          max-width: 1000px;
          position: relative;
          z-index: 1;
        }
        
        .packages-hero::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('images/kina2.jpg') center/cover;
          opacity: 0.1;
          z-index: 0;
        }
        
        .packages-hero .section-head h2 {
          color: white;
          font-size: 36px;
          margin: 0;
        }
        
        .packages-hero .section-head p {
          color: rgba(255,255,255,0.9);
          margin: 8px 0 0;
          font-size: 18px;
        }
        
        .packages-controls {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .packages-controls .input {
          flex: 1;
          min-width: 200px;
        }
        
        .packages-controls select {
          min-width: 150px;
        }
        
        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin: 30px 0;
        }
        
        .package-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          min-height: 320px;
        }
        
        .package-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .package-media {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: filter 0.4s ease, transform 0.4s ease;
        }
        
        .package-card:hover .package-media {
          filter: blur(2px) brightness(0.9);
          transform: scale(1.05);
        }
        
        .package-meta {
          position: absolute;
          left: 16px;
          bottom: 16px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .package-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--color-text);
        }
        
        .package-price {
          color: var(--color-accent);
          font-weight: 600;
          font-size: 16px;
        }
        
        .package-overlay {
          position: absolute;
          top: 0;
          right: -100%;
          bottom: 0;
          width: 100%;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          transition: right 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          border-left: 1px solid rgba(255,255,255,0.2);
        }
        
        .package-card:hover .package-overlay {
          right: 0;
        }
        
        .package-overlay h4 {
          margin: 0;
          font-size: 22px;
          color: var(--color-text);
          font-weight: 600;
        }
        
        .package-overlay p {
          color: var(--color-muted);
          margin: 0;
          line-height: 1.5;
          flex: 1;
        }
        
        .package-overlay small {
          color: var(--color-muted);
          font-style: italic;
        }
        
        .package-cta {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        
        .package-cta .btn {
          flex: 1;
          text-align: center;
        }
        
        .package-cta .btn.primary {
          font-weight: 600;
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


