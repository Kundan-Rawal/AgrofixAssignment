import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

const AdminOrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const navigate = useNavigate();

  // Configure axios instance
  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: { "Content-Type": "application/json" },
  });

  // Add auth interceptor
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Verify admin status
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const response = await api.get("/me");
        if (response.data.user.role === "admin") {
          setIsAdmin(true);
        } else {
          setAuthError("Admin access required");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        setAuthError(error.response?.data?.message || "Authentication failed");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setLoading(false);
      }
    };
    verifyAdmin();
  }, []);

  // Fetch orders when admin is verified
  useEffect(() => {
    if (!isAdmin) return;

    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        const groupedOrders = response.data.reduce((acc, item) => {
          const existingOrder = acc.find((o) => o.order_id === item.order_id);
          if (existingOrder) {
            existingOrder.items.push({
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              total_price: item.total_price,
            });
          } else {
            acc.push({
              order_id: item.order_id,
              buyer_name: item.buyer_name,
              mobile_number: item.mobile_number,
              delivery_address: item.delivery_address,
              status: item.status,
              created_at: item.created_at,
              items: [
                {
                  product_id: item.product_id,
                  product_name: item.product_name,
                  quantity: item.quantity,
                  total_price: item.total_price,
                },
              ],
            });
          }
          return acc;
        }, []);
        setOrders(groupedOrders);
        setFilteredOrders(groupedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (error.response?.status === 401) {
          setAuthError("Session expired. Please login again.");
          setTimeout(() => navigate("/login"), 2000);
        }
      }
    };
    fetchOrders();
  }, [isAdmin]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(
        orders.map((order) =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );
      setFilteredOrders(
        filteredOrders.map((order) =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating order:", error);
      alert(
        `Failed to update order: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Handle search
  useEffect(() => {
    const results = orders.filter(
      (order) =>
        order.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_id.toString().includes(searchTerm) ||
        order.mobile_number.includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(results);
  }, [searchTerm, orders]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate order total
  const calculateTotal = (items) => {
    return items
      .reduce((sum, item) => sum + parseFloat(item.total_price), 0)
      .toFixed(2);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (authError) {
    return <div className="auth-error">{authError}</div>;
  }

  return (
    <div className="admin-orders-container">
      <header className="admin-header">
        <h1>Orders Management</h1>
        <button
          className="btn-logout"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout
        </button>
      </header>

      <main className="orders-content">
        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="sort-options">
            <span>Sort by:</span>
            <button
              onClick={() => requestSort("order_id")}
              className={sortConfig.key === "order_id" ? "active" : ""}
            >
              Order ID{" "}
              {sortConfig.key === "order_id" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => requestSort("buyer_name")}
              className={sortConfig.key === "buyer_name" ? "active" : ""}
            >
              Customer{" "}
              {sortConfig.key === "buyer_name" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => requestSort("created_at")}
              className={sortConfig.key === "created_at" ? "active" : ""}
            >
              Date{" "}
              {sortConfig.key === "created_at" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => requestSort("status")}
              className={sortConfig.key === "status" ? "active" : ""}
            >
              Status{" "}
              {sortConfig.key === "status" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>

        <div className="orders-list">
          {sortedOrders.length === 0 ? (
            <p className="no-orders">No orders found</p>
          ) : (
            <div className="orders-grid">
              {sortedOrders.map((order) => (
                <div key={order.order_id} className="order-card">
                  <div className="order-header">
                    <div className="order-meta">
                      <h3>Order #{order.order_id}</h3>
                      <span className={`status-badge ${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-dates">
                      <p>Placed: {formatDate(order.created_at)}</p>
                    </div>
                  </div>

                  <div className="customer-info">
                    <p>
                      <strong>{order.buyer_name}</strong>
                    </p>
                    <p>{order.mobile_number}</p>
                    <p>{order.delivery_address}</p>
                  </div>

                  <div className="order-items">
                    <h4>Items ({order.items.length}):</h4>
                    <ul>
                      {order.items.map((item) => (
                        <li key={`${order.order_id}-${item.product_id}`}>
                          {item.product_name} (x{item.quantity}) - $
                          {item.total_price}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>Total: ${calculateTotal(order.items)}</strong>
                    </div>
                    <div className="order-actions">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.order_id, e.target.value)
                        }
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminOrdersDashboard;
