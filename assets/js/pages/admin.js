import { getAuthState } from '../utils/state.js';

export async function AdminPage(){
  const { role } = getAuthState();
  if(role !== 'admin' && role !== 'staff'){
    return `<section class="container"><h2>Access Denied</h2><p>You need staff or admin access.</p></section>`;
  }

  const widgets = `
    <div class="tiles" style="grid-template-columns:1fr 1fr 1fr">
      <article class="tile"><h3>Occupancy</h3><p>78% this week</p></article>
      <article class="tile"><h3>Revenue</h3><p>₱1.2M MTD</p></article>
      <article class="tile"><h3>Upcoming</h3><p>42 arrivals next 7 days</p></article>
    </div>`;

  const table = `
    <table class="table" aria-label="Current reservations">
      <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>#1012</td><td>J. Cruz</td><td>Deluxe King</td><td>11/20–11/23</td><td>Confirmed</td></tr>
        <tr><td>#1013</td><td>M. Santos</td><td>Twin Garden</td><td>12/02–12/04</td><td>Pending</td></tr>
      </tbody>
    </table>`;

  return `
    <section class="container">
      <div class="section-head"><h2>Admin Dashboard</h2></div>
      ${widgets}
      <section style="margin-top:20px">
        <h3>Reservations</h3>
        ${table}
      </section>
    </section>`;
}


