import { createLuxuryCard, createPackagesGrid, samplePackages, allPackages } from '../components/luxuryCard.js';

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
    <section class="packages-section">
      <div class="container">
        <!-- Modern Search and Filter Controls -->
        <div class="search-filter-wrapper" style="background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%); position: relative; overflow: hidden; margin: -20px -20px 40px -20px; border-radius: 0 0 20px 20px; padding: 20px 0;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('images/kina1.jpg') center/cover; opacity: 0.1; z-index: 0;"></div>
          <div style="position: relative; z-index: 1;">
        <div class="search-filter-container">
          <div class="search-box">
            <div class="search-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input 
              type="text" 
              id="package-search" 
              placeholder="Search packages..." 
              class="search-input"
              onkeyup="filterPackages()"
            />
            <button class="clear-search" onclick="clearSearch()" style="display: none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="filter-tabs">
            <button class="filter-tab active" data-category="" onclick="setActiveFilter(this, '')">All</button>
            <button class="filter-tab" data-category="cottages" onclick="setActiveFilter(this, 'cottages')">Cottages</button>
            <button class="filter-tab" data-category="rooms" onclick="setActiveFilter(this, 'rooms')">Rooms</button>
            <button class="filter-tab" data-category="menu" onclick="setActiveFilter(this, 'menu')">Dining</button>
            <button class="filter-tab" data-category="activities" onclick="setActiveFilter(this, 'activities')">Activities</button>
          </div>
        </div>
          </div>
        </div>
        
        <!-- Cottages Section -->
        <div class="package-section" id="cottages-section">
          <h3 class="section-title">Cottages</h3>
          <div class="packages-grid" id="cottages-grid">
            <!-- Cottage cards will be inserted here -->
          </div>
        </div>
        
        <!-- Rooms Section -->
        <div class="package-section" id="rooms-section">
          <h3 class="section-title">Rooms & Suites</h3>
          <div class="packages-grid" id="rooms-grid">
            <!-- Room cards will be inserted here -->
          </div>
        </div>
        
        <!-- Menu Section -->
        <div class="package-section" id="menu-section">
          <h3 class="section-title">Dining Packages</h3>
          <div class="packages-grid" id="menu-grid">
            <!-- Menu cards will be inserted here -->
          </div>
        </div>
        
        <!-- Activities Section -->
        <div class="package-section" id="activities-section">
          <h3 class="section-title">Activities & Tours</h3>
          <div class="packages-grid" id="activities-grid">
            <!-- Activity cards will be inserted here -->
          </div>
        </div>
      </div>
      
      <style>
        .packages-hero {
          background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%);
          padding: 120px 0 40px 0;
          margin: 0 -20px 0 -20px;
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
        
        .packages-hero h2 {
          color: white;
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 24px 0;
          text-align: center;
        }
        
        .search-filter-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border: none;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .search-box {
          position: relative;
          margin-bottom: 16px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #64748b;
          pointer-events: none;
          z-index: 2;
        }
        
        .search-input {
          width: 100%;
          height: 40px;
          padding: 0 40px 0 36px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          font-size: 14px;
          background: #f9fafb;
          transition: all 0.2s ease;
          outline: none;
          font-weight: 400;
        }
        
        .search-input:focus {
          background: white;
          border-color: #38b6ff;
          box-shadow: 0 0 0 3px rgba(56, 182, 255, 0.1);
        }
        
        .search-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
        
        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
        }
        
        .clear-search:hover {
          color: #64748b;
          transform: translateY(-50%) scale(1.1);
        }
        
        .filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .filter-tab {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          white-space: nowrap;
        }
        
        .filter-tab:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .filter-tab.active {
          background: #38b6ff;
          border-color: #38b6ff;
          color: white;
          box-shadow: 0 2px 8px rgba(56, 182, 255, 0.2);
        }
        
        .filter-tab.active:hover {
          background: #2a9ce8;
          border-color: #2a9ce8;
        }
        
        @media (max-width: 768px) {
          .search-filter-container {
            padding: 16px;
            margin-bottom: 20px;
            margin-left: 16px;
            margin-right: 16px;
          }
          
          .search-box {
            max-width: 100%;
          }
          
          .search-input {
            height: 38px;
            font-size: 14px;
          }
          
          .filter-tabs {
            gap: 4px;
          }
          
          .filter-tab {
            padding: 6px 12px;
            font-size: 12px;
          }
        }
        
        .package-section {
          margin-bottom: 60px;
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .section-title {
          font-size: 36px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
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
          
          .package-section {
            padding: 20px;
            margin-bottom: 40px;
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

// Initialize luxury cards after page loads
export function initLuxuryPackages() {
  // Wait for DOM to be ready
  setTimeout(() => {
    // Initialize each section
    initializeSection('cottages', allPackages.cottages);
    initializeSection('rooms', allPackages.rooms);
    initializeSection('menu', allPackages.menu);
    initializeSection('activities', allPackages.activities);
  }, 100);
}

// Initialize a specific section
function initializeSection(sectionId, packages) {
  const grid = document.getElementById(`${sectionId}-grid`);
  if (grid) {
    // Clear existing content
    grid.innerHTML = '';
    
    // Create luxury cards for this section
    packages.forEach(packageData => {
      const card = createLuxuryCard(packageData);
      card.setAttribute('data-category', packageData.category);
      grid.appendChild(card);
    });
  }
}

// Modern search and filter functions
window.filterPackages = function() {
  const searchTerm = document.getElementById('package-search')?.value.toLowerCase() || '';
  const activeTab = document.querySelector('.filter-tab.active');
  const categoryFilter = activeTab?.getAttribute('data-category') || '';
  
  // Show/hide clear button
  const clearBtn = document.querySelector('.clear-search');
  if (clearBtn) {
    clearBtn.style.display = searchTerm ? 'block' : 'none';
  }
  
  // Get all package sections
  const sections = ['cottages', 'rooms', 'menu', 'activities'];
  
  sections.forEach(sectionId => {
    const section = document.getElementById(`${sectionId}-section`);
    const grid = document.getElementById(`${sectionId}-grid`);
    const cards = grid?.querySelectorAll('.luxury-card') || [];
    
    let visibleCards = 0;
    
    cards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const description = card.querySelector('.card-description')?.textContent.toLowerCase() || '';
      const category = card.getAttribute('data-category') || '';
      
      const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);
      const matchesCategory = !categoryFilter || category === categoryFilter;
      
      if (matchesSearch && matchesCategory) {
        card.style.display = '';
        visibleCards++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Show/hide section based on visible cards
    if (section) {
      section.style.display = visibleCards > 0 ? 'block' : 'none';
    }
  });
};

// Set active filter tab
window.setActiveFilter = function(button, category) {
  // Remove active class from all tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to clicked tab
  button.classList.add('active');
  
  // Trigger filter
  filterPackages();
};

// Clear search function
window.clearSearch = function() {
  const searchInput = document.getElementById('package-search');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
    filterPackages();
  }
};


