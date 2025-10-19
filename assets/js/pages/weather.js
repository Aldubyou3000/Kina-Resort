import { fetchWeatherSummary } from '../utils/api.js';
import { showToast } from '../components/toast.js';

export async function WeatherPage(){
  try{
    const w = await fetchWeatherSummary();
    const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const next = (w.nextDays || []).slice(0,7);
    const map = Object.fromEntries(next.map(d => [d.d, d]));
    const seven = weekdays.map(lbl => map[lbl] || { d: lbl, t: '--', c: '—' });
    const list = seven.map(d => `<li class="forecast-item">${d.d}: ${d.t}°C · ${d.c}</li>`).join('');
    
    return `
      <section class="container">
        <div class="weather" role="region" aria-label="Current weather">
          <div class="current">
            <div class="temp">${w.current.tempC}°C</div>
            <div class="weather-info">
              <div class="condition">${w.current.icon} ${w.current.condition}</div>
              <div class="location">📍 ${w.location}</div>
              <div class="suggestion">💡 ${w.suggestion}</div>
            </div>
          </div>
          <div class="future">
            ${seven.map(d => `
              <div class="chip">
                <div class="day">${d.d}</div>
                <div class="temp">${d.t}°C</div>
                <div class="condition">${d.c}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="section-head">
          <h2>7-Day Forecast</h2>
          <p>Extended weather outlook for planning</p>
        </div>
        
        <div class="forecast-container">
          <ul class="forecast-list">${list}</ul>
        </div>
        
        <style>
          .weather {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            margin-bottom: 30px;
          }
          
          .current {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 24px;
          }
          
          .temp {
            font-size: 48px;
            font-weight: 700;
            color: var(--color-accent);
          }
          
          .weather-info {
            flex: 1;
          }
          
          .condition {
            font-weight: 600;
            font-size: 20px;
            color: var(--color-text);
            margin-bottom: 8px;
          }
          
          .location {
            color: var(--color-muted);
            margin-bottom: 4px;
          }
          
          .suggestion {
            color: var(--color-muted);
            font-style: italic;
          }
          
          .future {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
          }
          
          .chip {
            background: var(--color-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            transition: transform 0.2s ease;
          }
          
          .chip:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          }
          
          .chip .day {
            font-weight: 600;
            color: var(--color-text);
            margin-bottom: 8px;
          }
          
          .chip .temp {
            font-size: 18px;
            font-weight: 600;
            color: var(--color-accent);
            margin-bottom: 4px;
          }
          
          .chip .condition {
            font-size: 12px;
            color: var(--color-muted);
          }
          
          .forecast-container {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          }
          
          .forecast-list {
            list-style: none;
            padding: 0;
            display: grid;
            gap: 12px;
          }
          
          .forecast-item {
            padding: 12px;
            background: var(--color-bg);
            border-radius: 8px;
            border: 1px solid var(--border);
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
    return `
      <section class="container">
        <div class="section-head">
          <h2>Weather</h2>
          <p>Try again later.</p>
        </div>
      </section>`;
  }
}


