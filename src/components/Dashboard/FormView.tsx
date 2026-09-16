import './FormView.css';

export function FormView() {
  return (
    <div className="form-container dashboard-fade-in">
      <div className="form-header">
        <h1 className="form-title">New Purchase Order</h1>
        <p className="form-subtitle">Complete the sections below to create an order</p>
      </div>

      <div className="form-card">
        <div className="form-card-header">
          <h2>Order Details</h2>
        </div>
        
        <div className="form-card-body">
          <div className="form-section">
            <h3 className="form-section-title">CUSTOMER INFORMATION</h3>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Customer</label>
                <input type="text" className="form-input" defaultValue="Acme Corporation" />
              </div>
              <div className="input-group">
                <label className="input-label">Order Date</label>
                <input type="text" className="form-input" defaultValue="Jun 21, 2026" />
              </div>
              <div className="input-group">
                <label className="input-label">Priority</label>
                <input type="text" className="form-input" defaultValue="Standard" />
              </div>
              <div className="input-group active">
                <label className="input-label">Shipping</label>
                <input type="text" className="form-input" defaultValue="Express (2-day)" />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">LINE ITEMS</h3>
              <button className="btn-text">+ ADD ITEM</button>
            </div>
            
            <div className="line-items-list">
              <div className="line-item-row">
                <div className="item-name">Widget Pro X500</div>
                <div className="item-qty">10</div>
                <div className="item-price">$240</div>
                <div className="item-total">$2,400</div>
              </div>
              <div className="line-item-row">
                <div className="item-name">Safety Module Kit</div>
                <div className="item-qty">5</div>
                <div className="item-price">$480</div>
                <div className="item-total">$2,400</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-footer-card">
        <div className="form-total">
          Total: $4,800.00
        </div>
        <div className="form-actions">
          <button className="btn-outline">CANCEL</button>
          <button className="btn-primary">CREATE ORDER</button>
        </div>
      </div>
    </div>
  );
}
