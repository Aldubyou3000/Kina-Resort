// Luxury Resort Card Component
export function createLuxuryCard(cardData) {
  const {
    image,
    title,
    price,
    description,
    onBook
  } = cardData;

  const card = document.createElement('div');
  card.className = 'luxury-card';
  
  card.innerHTML = `
    <div class="relative h-full w-full overflow-hidden">
      <!-- Background Image -->
      <img 
        src="${image}" 
        alt="${title}"
        class="w-full h-full object-cover"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      />
      <!-- Fallback background -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600" style="display: none;"></div>
      
      <!-- Content Container -->
      <div class="content-container">
        <!-- Always Visible Content -->
        <div class="always-visible">
          <h3 class="card-title">${title}</h3>
          <p class="card-price">${price}</p>
        </div>
        
        <!-- Hover-Only Content -->
        <div class="hover-content">
          <p class="card-description">${description}</p>
          <button 
            class="book-button"
            onclick="handleBookNow('${title}')"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

// Handle Book Now button click
window.handleBookNow = function(packageName) {
  // Navigate to rooms page (room booking system)
  window.location.hash = '#/rooms';
  
  // Show toast notification
  if (window.showToast) {
    window.showToast(`Redirecting to room booking for ${packageName}...`, 'success');
  }
  
  // Call custom onBook function if provided
  if (window.onPackageBook) {
    window.onPackageBook(packageName);
  }
};

// Create packages grid
export function createPackagesGrid(packages) {
  const grid = document.createElement('div');
  grid.className = 'packages-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
  
  packages.forEach(packageData => {
    const card = createLuxuryCard(packageData);
    grid.appendChild(card);
  });
  
  return grid;
}

// All packages data organized by category
export const allPackages = {
  cottages: [
    {
      image: 'images/kina1.jpg',
      title: 'Beachfront Cottage',
      price: '₱8,500/night',
      description: 'Private cottage with direct beach access, outdoor seating area, and basic amenities.',
      category: 'cottages'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Garden Cottage',
      price: '₱6,500/night',
      description: 'Cozy cottage surrounded by tropical gardens, perfect for peaceful relaxation.',
      category: 'cottages'
    },
    {
      image: 'images/kina3.jpg',
      title: 'Family Cottage',
      price: '₱9,500/night',
      description: 'Spacious cottage with 2 bedrooms, kitchenette, and living area for families.',
      category: 'cottages'
    }
  ],
  rooms: [
    {
      image: 'images/kina1.jpg',
      title: 'Standard Room',
      price: '₱4,500/night',
      description: 'Comfortable room with air conditioning, private bathroom, and garden view.',
      category: 'rooms'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Ocean View Room',
      price: '₱6,500/night',
      description: 'Room with balcony overlooking the ocean, perfect for sunset views.',
      category: 'rooms'
    },
    {
      image: 'images/kina3.jpg',
      title: 'Deluxe Suite',
      price: '₱8,500/night',
      description: 'Spacious suite with separate living area, mini-fridge, and premium amenities.',
      category: 'rooms'
    }
  ],
  menu: [
    {
      image: 'images/kina1.jpg',
      title: 'Breakfast Package',
      price: '₱800/person',
      description: 'Continental breakfast with local fruits, coffee, and tropical juices.',
      category: 'menu'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Lunch Special',
      price: '₱1,200/person',
      description: 'Fresh seafood lunch with local specialties and tropical drinks.',
      category: 'menu'
    },
    {
      image: 'images/kina3.jpg',
      title: 'Dinner Experience',
      price: '₱1,800/person',
      description: '3-course dinner featuring local cuisine and fresh catch of the day.',
      category: 'menu'
    },
    {
      image: 'images/resort1.JPG',
      title: 'All-Day Dining',
      price: '₱2,500/person',
      description: 'Breakfast, lunch, and dinner with unlimited non-alcoholic beverages.',
      category: 'menu'
    }
  ],
  activities: [
    {
      image: 'images/kina1.jpg',
      title: 'Water Sports Package',
      price: '₱1,500/person',
      description: 'Snorkeling gear, kayak rental, and paddleboard access for the day.',
      category: 'activities'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Island Tour',
      price: '₱2,000/person',
      description: 'Half-day boat tour to nearby islands with lunch and snorkeling.',
      category: 'activities'
    },
    {
      image: 'images/kina3.jpg',
      title: 'Spa Treatment',
      price: '₱1,800/person',
      description: '60-minute massage with tropical oils and relaxation treatment.',
      category: 'activities'
    },
    {
      image: 'images/resort1.JPG',
      title: 'Cultural Tour',
      price: '₱1,200/person',
      description: 'Guided tour of local villages, markets, and cultural sites.',
      category: 'activities'
    },
    {
      image: 'images/kina1.jpg',
      title: 'Fishing Trip',
      price: '₱2,500/person',
      description: '4-hour fishing excursion with equipment and guide included.',
      category: 'activities'
    },
    {
      image: 'images/kina2.jpg',
      title: 'Sunset Cruise',
      price: '₱1,500/person',
      description: 'Evening boat ride with drinks and snacks to watch the sunset.',
      category: 'activities'
    }
  ]
};

// Combined packages for search/filter
export const samplePackages = [
  ...allPackages.cottages,
  ...allPackages.rooms,
  ...allPackages.menu,
  ...allPackages.activities
];
