import { fetchWeatherSummary } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export async function HomePage(){
  const tpl = document.getElementById('tpl-home');
  const frag = tpl.content.cloneNode(true);

  // Initialize hero slides
  const slides = frag.querySelectorAll('.hero-slide');
  slides.forEach((s, i) => {
    const src = s.getAttribute('data-src') || '';
    s.style.backgroundImage = `url('${src}')`;
    s.style.opacity = i === 0 ? '1' : '0';
  });
  window.setTimeout(() => {
    const liveSlides = Array.from(document.querySelectorAll('.hero-slide'));
    if(liveSlides.length){
      let i = 0;
      window.setInterval(() => {
        liveSlides.forEach((n, idx) => n.style.opacity = idx === i ? 1 : 0);
        i = (i + 1) % liveSlides.length;
      }, 4000);
    }
  }, 0);

  // Populate weather
  try{
    const w = await fetchWeatherSummary();
    const root = frag.querySelector('[data-weather-section]');
    if(root){
      root.querySelector('[data-w-temp]').textContent = `${w.current.tempC}°C`;
      root.querySelector('[data-w-cond]').textContent = `${w.current.icon} ${w.current.condition}`;
      root.querySelector('[data-w-loc]').textContent = w.location;
      root.querySelector('[data-w-sugg]').textContent = w.suggestion;
      const future = root.querySelector('[data-w-future]');
      future.innerHTML = w.nextDays.map(d => `
        <div class="chip" aria-label="${d.d} ${d.c}">
          <div style="font-weight:600">${d.d}</div>
          <div>${d.t}°C</div>
          <div style="color:var(--color-muted)">${d.c}</div>
        </div>
      `).join('');
    }
  }catch(e){
    showToast('Unable to load weather right now.', 'error');
  }

  // Lazy load feature images and reveal on scroll
  const features = Array.from(frag.querySelectorAll('.feature'));
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      const el = entry.target;
      if(entry.isIntersecting){
        el.classList.add('is-visible');
        const media = el.querySelector('.feature-media');
        const src = el.getAttribute('data-src');
        if(media && src){ media.style.backgroundImage = `url('${src}')`; }
        obs.unobserve(el);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  features.forEach(el => io.observe(el));

  // Initialize portrait tiles in "Why" section with background images
  const whyTiles = Array.from(frag.querySelectorAll('#section-why .tile.portrait'));
  whyTiles.forEach(tile => {
    const media = tile.querySelector('.p-media');
    const src = media?.getAttribute('data-src');
    if(src){ media.style.backgroundImage = `url('${src}')`; }
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(frag);
  return wrapper;
}


