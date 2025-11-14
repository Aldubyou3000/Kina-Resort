export async function FacilitiesPage() {
  return `
    <div class="facilities-page">
      <div class="page-header">
        <h3>Facility Management</h3>
        <button class="btn-primary">Add New Facility</button>
      </div>

      <div class="facilities-grid">
        <div class="facility-card">
          <div class="facility-header">
            <h4>Standard Room</h4>
            <span class="status-badge active">Active</span>
          </div>
          <div class="facility-details">
            <p><strong>Price:</strong> ₱2,000/Day</p>
            <p><strong>Availability:</strong> 4 rooms</p>
          </div>
          <div class="facility-actions">
            <button class="btn-secondary">Edit</button>
            <button class="btn-danger">Deactivate</button>
          </div>
        </div>

        <div class="facility-card">
          <div class="facility-header">
            <h4>Open Cottage</h4>
            <span class="status-badge active">Active</span>
          </div>
          <div class="facility-details">
            <p><strong>Price:</strong> ₱300</p>
            <p><strong>Availability:</strong> 4 cottages</p>
          </div>
          <div class="facility-actions">
            <button class="btn-secondary">Edit</button>
            <button class="btn-danger">Deactivate</button>
          </div>
        </div>

        <div class="facility-card">
          <div class="facility-header">
            <h4>Standard Cottage</h4>
            <span class="status-badge active">Active</span>
          </div>
          <div class="facility-details">
            <p><strong>Price:</strong> ₱400</p>
            <p><strong>Availability:</strong> 4 cottages</p>
          </div>
          <div class="facility-actions">
            <button class="btn-secondary">Edit</button>
            <button class="btn-danger">Deactivate</button>
          </div>
        </div>

        <div class="facility-card">
          <div class="facility-header">
            <h4>Family Cottage</h4>
            <span class="status-badge active">Active</span>
          </div>
          <div class="facility-details">
            <p><strong>Price:</strong> ₱500</p>
            <p><strong>Availability:</strong> 4 cottages</p>
          </div>
          <div class="facility-actions">
            <button class="btn-secondary">Edit</button>
            <button class="btn-danger">Deactivate</button>
          </div>
        </div>

        <div class="facility-card">
          <div class="facility-header">
            <h4>Grand Function Hall</h4>
            <span class="status-badge active">Active</span>
          </div>
          <div class="facility-details">
            <p><strong>Price:</strong> ₱15,000</p>
            <p><strong>Availability:</strong> 1 hall</p>
          </div>
          <div class="facility-actions">
            <button class="btn-secondary">Edit</button>
            <button class="btn-danger">Deactivate</button>
          </div>
        </div>

        <div class="facility-card">
          <div class="facility-header">
            <h4>Intimate Function Hall</h4>
            <span class="status-badge active">Active</span>
          </div>
          <div class="facility-details">
            <p><strong>Price:</strong> ₱10,000</p>
            <p><strong>Availability:</strong> 1 hall</p>
          </div>
          <div class="facility-actions">
            <button class="btn-secondary">Edit</button>
            <button class="btn-danger">Deactivate</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

