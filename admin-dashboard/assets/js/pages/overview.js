export async function OverviewPage() {
  return `
    <div class="dashboard-overview">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <h3>Total Bookings</h3>
            <p class="stat-value">0</p>
            <span class="stat-label">All time</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <h3>Pending</h3>
            <p class="stat-value">0</p>
            <span class="stat-label">Awaiting approval</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>Confirmed</h3>
            <p class="stat-value">0</p>
            <span class="stat-label">This month</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <h3>Revenue</h3>
            <p class="stat-value">₱0</p>
            <span class="stat-label">This month</span>
          </div>
        </div>
      </div>

      <div class="overview-sections">
        <section class="overview-section">
          <h3>Recent Bookings</h3>
          <div class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest Name</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="5" class="empty-state">No bookings yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="overview-section">
          <h3>Quick Actions</h3>
          <div class="action-buttons">
            <button class="btn-primary">Approve Pending</button>
            <button class="btn-secondary">View All Bookings</button>
            <button class="btn-secondary">Manage Facilities</button>
          </div>
        </section>
      </div>
    </div>
  `;
}

