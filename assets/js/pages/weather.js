import { fetchWeatherSummary } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export async function WeatherPage(){
  try{
    const w = await fetchWeatherSummary();
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const next = (w.nextDays || []).slice(0,7);
    const map = Object.fromEntries(next.map(d => [d.d, d]));
    const seven = weekdays.map(lbl => map[lbl] || { d: lbl, t: '--', c: '—' });
    const list = seven.map(d => `<li class=\"tile\">${d.d}: ${d.t}°C · ${d.c}</li>`).join('');
    return `
      <section class="container">
        <div class="weather-hero" style="background: linear-gradient(135deg, var(--color-accent) 0%, #2c5aa0 100%); padding: 40px 0; margin: -20px -20px 40px -20px; border-radius: 0 0 20px 20px; position: relative; overflow: hidden;">
          <div class="container" style="max-width: 1000px; position: relative; z-index: 1;">
            <div class="section-head" style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; font-size: 36px; margin: 0;">Weather & Planning</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 18px;">Plan your perfect stay with real-time weather updates</p>
            </div>
          </div>
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('images/kina3.jpg') center/cover; opacity: 0.1; z-index: 0;"></div>
        </div>
        
        <div class="weather" role="region" aria-label="Current weather" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 30px;">
          <div class="current" style="display: flex; align-items: center; gap: 24px; margin-bottom: 24px;">
            <div class="temp" style="font-size: 48px; font-weight: 700; color: var(--color-accent);">${w.current.tempC}°C</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 20px; color: var(--color-text); margin-bottom: 8px;">${w.current.icon} ${w.current.condition}</div>
              <div class="cond" style="color: var(--color-muted); margin-bottom: 4px;">📍 ${w.location}</div>
              <div class="cond" style="color: var(--color-muted); font-style: italic;">💡 ${w.suggestion}</div>
            </div>
          </div>
          <div class="future" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">${seven.map(d => `
            <div class="chip" style="background: var(--color-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; transition: transform 0.2s ease;">
              <div style="font-weight: 600; color: var(--color-text); margin-bottom: 8px;">${d.d}</div>
              <div style="font-size: 18px; font-weight: 600; color: var(--color-accent); margin-bottom: 4px;">${d.t}°C</div>
              <div style="font-size: 12px; color: var(--color-muted);">${d.c}</div>
            </div>
          `).join('')}</div>
        </div>
        
        <div class="section-head" style="text-align: center; margin: 40px 0 20px;">
          <h2 style="font-size: 28px; margin: 0; color: var(--color-text);">7-Day Forecast</h2>
          <p style="color: var(--color-muted); margin: 8px 0 0;">Extended weather outlook for planning</p>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <ul style="list-style: none; padding: 0; display: grid; gap: 12px;">${list}</ul>
        </div>
        
        <style>
          .chip:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          }
          .weather-hero {
            position: relative;
            overflow: hidden;
          }
          .weather-hero .container {
            position: relative;
            z-index: 1;
          }
          @media (max-width: 768px) {
            .current {
              flex-direction: column;
              text-align: center;
              gap: 16px;
            }
            .future {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </section>`;
  }catch(e){
    showToast('Weather unavailable','error');
    return `<section class="container"><h2>Weather</h2><p>Try again later.</p></section>`;
  }
}


