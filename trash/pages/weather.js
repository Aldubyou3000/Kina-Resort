import { fetchWeatherSummary } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export async function WeatherPage(){
  try{
    const w = await fetchWeatherSummary();
    const list = w.nextDays.map(d => `<li class="tile">${d.d}: ${d.t}°C · ${d.c}</li>`).join('');
    return `
      <section class="container">
        <div class="section-head"><h2>Weather & Planning</h2></div>
        <div class="weather" role="region" aria-label="Current weather">
          <div class="current">
            <div class="temp">${w.current.tempC}°C</div>
            <div>
              <div style="font-weight:600">${w.current.icon} ${w.current.condition}</div>
              <div class="cond">${w.location}</div>
              <div class="cond">Suggestion: ${w.suggestion}</div>
            </div>
          </div>
          <div class="future">${w.nextDays.map(d => `<div class="chip">${d.d}<br>${d.t}°C</div>`).join('')}</div>
        </div>
        <section style="margin-top:16px">
          <h3>7-Day Outlook</h3>
          <ul style="list-style:none;padding:0;display:grid;gap:8px">${list}</ul>
        </section>
      </section>`;
  }catch(e){
    showToast('Weather unavailable','error');
    return `<section class="container"><h2>Weather</h2><p>Try again later.</p></section>`;
  }
}





