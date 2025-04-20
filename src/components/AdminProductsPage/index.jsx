import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

const Base_URL = "http://localhost:5000";

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price_per_kg: "",
    rating: "",
    category: "fruits",
    image: "",
  });
  const navigate = useNavigate();

  // Configure axios instance with auth header
  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add authorization header to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let usertype = "user";

  // Verify admin status on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await api.get("http://localhost:5000/me");
        const userData = response.data;

        console.log("User data:", userData);

        if (userData.user.role === "admin") {
          setIsAdmin(true);
        } else {
          setAuthError("Admin access required");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        setAuthError(error.response?.data?.message || "Authentication failed");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setLoading(false);
      }
    };
    verifyAdmin();
  }, []);

  // Fetch all products
  useEffect(() => {
    if (!isAdmin) return;

    const fetchProducts = async () => {
      try {
        const response = await api.get(`${Base_URL}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        if (error.response?.status === 401) {
          setAuthError("Session expired. Please login again.");
          setTimeout(() => navigate("/login"), 2000);
        }
      }
    };
    fetchProducts();
  }, [isAdmin]);

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`${Base_URL}/products`, formData);
      setProducts([...products, response.data]);
      setFormData({
        name: "",
        price_per_kg: "",
        rating: "",
        category: "fruits",
        image: "",
      });
      alert("Product added successfully!");
    } catch (error) {
      alert(
        `Failed to add product: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((product) => product.id !== id));
      alert("Product deleted successfully!");
    } catch (error) {
      alert(
        `Failed to delete product: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="auth-message">
        <p>{authError}</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-title">
          <h1>Grocery Store Admin</h1>
          <span className="admin-badge">ADMIN</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="admin-content">
        <div className="admin-card">
          <h2>Add New Product</h2>
          <form onSubmit={handleAddProduct} className="product-form">
            {
              <>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Enter product name"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price per kg ($)</label>
                    <input
                      type="number"
                      name="price_per_kg"
                      value={formData.price_per_kg}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_per_kg: e.target.value,
                        })
                      }
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rating (1-5)</label>
                    <input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: e.target.value })
                      }
                      min="1"
                      max="5"
                      required
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      <option value="fruits">Fruits</option>
                      <option value="vegetables">Vegetables</option>
                      <option value="dairy">Dairy</option>
                      <option value="meat">Meat</option>
                      <option value="bakery">Bakery</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-add">
                  Add Product
                </button>
              </>
            }
          </form>
        </div>

        <div className="admin-card">
          <h2>Product Catalog</h2>
          {products.length === 0 ? (
            <div className="no-products">No products available</div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  {
                    <>
                      <div className="product-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="image-placeholder">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="product-details">
                        <h3>{product.name}</h3>
                        <div className="product-meta">
                          <span className="price">
                            ${product.price_per_kg}/kg
                          </span>
                          <span className="rating">★ {product.rating}</span>
                          <span className="category">{product.category}</span>
                        </div>
                      </div>
                    </>
                  }
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="btn-delete"
                    aria-label={`Delete ${product.name}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
