import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

const UserProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // Configure axios instance
  const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add auth interceptor
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Verify user authentication
  useEffect(() => {
    const verifyUser = async () => {
      try {
        await api.get("/me");
        fetchCartItems(); // Fetch cart items after verifying user
      } catch (error) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    verifyUser();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Fetch user's cart items
  const fetchCartItems = async () => {
    try {
      const response = await api.get("/cart/items");
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  // Handle search
  useEffect(() => {
    const results = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Add to cart
  const addToCart = async (productId) => {
    try {
      await api.post("/cart", {
        product_id: productId,
        quantity: 1, // Default quantity
      });
      await fetchCartItems(); // Refresh cart items after adding
      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.response?.data?.message || "Failed to add to cart");
    }
  };

  // Check if item is in cart
  const isInCart = (productId) => {
    return cartItems.some((item) => item.product_id === productId);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-products-container">
      <header className="user-header">
        <h1>Our Products</h1>
        <div className="header-actions">
          <button className="btn-cart" onClick={() => navigate("/user/cart")}>
            Cart ({cartItems.length})
          </button>
          <button
            className="btn-logout"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="sort-options">
          <span>Sort by:</span>
          <button
            onClick={() => requestSort("name")}
            className={sortConfig.key === "name" ? "active" : ""}
          >
            Name{" "}
            {sortConfig.key === "name" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => requestSort("price_per_kg")}
            className={sortConfig.key === "price_per_kg" ? "active" : ""}
          >
            Price{" "}
            {sortConfig.key === "price_per_kg" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => requestSort("rating")}
            className={sortConfig.key === "rating" ? "active" : ""}
          >
            Rating{" "}
            {sortConfig.key === "rating" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      <div className="products-grid">
        {sortedProducts.length === 0 ? (
          <div className="no-products">
            {searchTerm
              ? "No products match your search"
              : "No products available"}
          </div>
        ) : (
          sortedProducts.map((product) => (
            <div key={product.id} className="product-card">
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
                  <span className="price">${product.price_per_kg}/kg</span>
                  <span className="rating">★ {product.rating}</span>
                  <span className="category">{product.category}</span>
                </div>
                <button
                  onClick={() => addToCart(product.id)}
                  className={`btn-add ${isInCart(product.id) ? "in-cart" : ""}`}
                  disabled={isInCart(product.id)}
                >
                  {isInCart(product.id) ? "Added to Cart" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserProductsPage;
