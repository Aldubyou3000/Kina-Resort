import { fetchWeatherSummary } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export async function HomePage(){
  const slides = [
    '/public/assets/images/pool-1.jpg',
    '/public/assets/images/pool-2.jpg',
    '/public/assets/images/pool-3.jpg',
  ];

  // Build hero HTML
  const heroHtml = `
    <section class="container">
      <div class="hero" aria-label="Resort highlights carousel">
        ${slides.map((src, i) => `<div class="hero-slide" style="opacity:${i===0?1:0};background-image:url('${src}')"></div>`).join('')}
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="eyebrow">Welcome to</div>
          <div class="h1">Kina Resort – Your Tropical Escape</div>
          <p class="lede">Relax by the infinity pool, stroll the beachfront, and sleep in modern, airy rooms.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn primary" href="#/rooms">Book Now</a>
            <a class="btn" href="#/packages">View Packages</a>
          </div>
        </div>
      </div>
    </section>`;

  // Overview tiles
  const tilesHtml = `
    <section class="container">
      <div class="section-head"><h2>Why Kina</h2><a class="btn" href="#/about">About</a></div>
      <div class="tiles">
        <article class="tile"><h3>Location</h3><p>Beachfront serenity in the Island Province, PH.</p></article>
        <article class="tile"><h3>Amenities</h3><p>Infinity pool, cottages, water sports, and more.</p></article>
        <article class="tile"><h3>Weather AI</h3><p>Plan your stay with real-time forecasts and tips.</p></article>
      </div>
    </section>`;

  // Weather widget
  let weatherHtml = '';
  try{
    const w = await fetchWeatherSummary();
    weatherHtml = `
      <section class="container">
        <div class="section-head"><h2>Weather at a Glance</h2><a class="btn" href="#/weather">See Details</a></div>
        <div class="weather" role="region" aria-label="Weather summary">
          <div class="current">
            <div class="temp">${w.current.tempC}°C</div>
            <div>
              <div style="font-weight:600">${w.current.icon} ${w.current.condition}</div>
              <div class="cond">${w.location}</div>
              <div class="cond">${w.suggestion}</div>
            </div>
          </div>
          <div class="future">
            ${w.nextDays.map(d => `<div class="chip" aria-label="${d.d} ${d.c}"><div style="font-weight:600">${d.d}</div><div>${d.t}°C</div><div style="color:var(--color-muted)">${d.c}</div></div>`).join('')}
          </div>
        </div>
      </section>`;
  }catch(e){
    showToast('Unable to load weather right now.', 'error');
    weatherHtml = '';
  }

  // CTA band
  const ctasHtml = `
    <section class="container">
      <div class="section-head"><h2>Ready to plan?</h2></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn primary" href="#/rooms">Start Reservation</a>
        <a class="btn" href="#/packages">Explore Packages</a>
      </div>
    </section>`;

  // Initialize simple hero autoplay after mount
  window.setTimeout(() => {
    const nodes = Array.from(document.querySelectorAll('.hero-slide'));
    let i = 0;
    window.setInterval(() => {
      nodes.forEach((n, idx) => n.style.opacity = idx === i ? 1 : 0);
      i = (i + 1) % nodes.length;
    }, 4000);
  }, 0);

  return heroHtml + tilesHtml + weatherHtml + ctasHtml;
}



