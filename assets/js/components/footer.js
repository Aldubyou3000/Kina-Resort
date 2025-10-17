export function renderFooter(){
  const el = document.getElementById('site-footer');
  if(!el) return;
  el.innerHTML = `
    <div class="container">
      <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:20px;align-items:start">
        <div>
          <h3 style="margin-top:0">Kina Resort</h3>
          <p style="color:var(--color-muted)">Barangay Coastline, Island Province, Philippines<br>Open daily · 8:00–22:00</p>
          <p><a href="mailto:book@kinaresort.ph">book@kinaresort.ph</a> · <a href="tel:+639001112222">+63 900 111 2222</a></p>
        </div>
        <div>
          <h4>Legal</h4>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px">
            <li><a href="#/about">About</a></li>
            <li><a href="#/legal/privacy">Privacy</a></li>
            <li><a href="#/legal/terms">Terms</a></li>
          </ul>
        </div>
      </div>
      <p style="margin-top:16px;color:var(--color-muted)">© ${new Date().getFullYear()} Kina Resort. All rights reserved.</p>
    </div>
  `;
}


