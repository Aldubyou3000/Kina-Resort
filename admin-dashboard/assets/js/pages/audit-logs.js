export async function AuditLogsPage() {
  return `
    <div class="audit-logs-page">
      <div class="page-header">
        <div class="page-actions">
          <input
            type="text"
            placeholder="Search logs..."
            class="search-input"
          />
          <select class="filter-select">
            <option value="all">All Actions</option>
            <option value="booking">Booking</option>
            <option value="user">User</option>
            <option value="facility">Facility</option>
            <option value="system">System</option>
          </select>
          <input
            type="date"
            class="date-input"
            placeholder="Filter by date"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="empty-state">No audit logs found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="btn-secondary" disabled>Previous</button>
        <span class="page-info">Page 1 of 1</span>
        <button class="btn-secondary" disabled>Next</button>
      </div>
    </div>
  `;
}

