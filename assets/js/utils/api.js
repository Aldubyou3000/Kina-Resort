const USE_MOCK = true;

function delay(ms){ return new Promise(res => setTimeout(res, ms)); }

export async function fetchWeatherSummary(){
  if(USE_MOCK){
    await delay(300);
    return {
      location: 'Kina Resort',
      current: { tempC: 31, condition: 'Sunny', icon: '☀️' },
      nextDays: [
        { d: 'Mon', t: 30, c: 'Sunny' },
        { d: 'Tue', t: 29, c: 'Cloudy' },
        { d: 'Wed', t: 31, c: 'Sunny' },
        { d: 'Thu', t: 31, c: 'Sunny' },
        { d: 'Fri', t: 29, c: 'Partly Cloudy' },
        { d: 'Sat', t: 30, c: 'Sunny' },
        { d: 'Sun', t: 28, c: 'Showers' },
      ],
      suggestion: 'Best time to visit: sunny Fri–Mon afternoons.'
    };
  }
  const r = await fetch('api/weather/summary');
  if(!r.ok) throw new Error('Weather fetch failed');
  return r.json();
}


