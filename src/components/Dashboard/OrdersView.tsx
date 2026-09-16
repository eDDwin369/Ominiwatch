import './OrdersView.css';

interface Order {
  id: string;
  customer: string;
  status: 'Delivered' | 'Processing' | 'Pending' | 'Shipped';
  amount: string;
  date: string;
}

const mockOrders: Order[] = [
  { id: 'ORD-1042', customer: 'Acme Corporation', status: 'Delivered', amount: '$12,400', date: 'Jun 18' },
  { id: 'ORD-1041', customer: 'Globex Ltd', status: 'Processing', amount: '$8,750', date: 'Jun 17' },
  { id: 'ORD-1040', customer: 'Initech', status: 'Pending', amount: '$5,200', date: 'Jun 16' },
  { id: 'ORD-1039', customer: 'Umbrella Co', status: 'Shipped', amount: '$22,100', date: 'Jun 15' },
  { id: 'ORD-1038', customer: 'Waystar Royco', status: 'Delivered', amount: '$9,800', date: 'Jun 14' },
];

export function OrdersView() {
  return (
    <div className="orders-container fade-in">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">Orders</h1>
          <p className="orders-subtitle">1,284 orders · June 2026</p>
        </div>
        <button className="btn-primary">+ NEW ORDER</button>
      </div>

      <div className="orders-card">
        <div className="orders-card-header">
          <h2>All Orders</h2>
        </div>
        
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>STATUS</th>
                <th>AMOUNT</th>
                <th>DATE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id}</td>
                  <td className="order-customer">{order.customer}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="order-amount">{order.amount}</td>
                  <td className="order-date">{order.date}</td>
                  <td className="order-action">
                    <button className="btn-view">VIEW</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
