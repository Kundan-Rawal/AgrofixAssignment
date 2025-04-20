import React, { useEffect, useState } from "react";
import "./index.css";

const API_BASE = "http://localhost:5000"; // replace with your actual base URL

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        // Step 1: Get logged-in user details
        const userRes = await fetch(`${API_BASE}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) throw new Error("Failed to authenticate user");
        const { user } = await userRes.json();

        // Step 2: Fetch cart data, now passing the user_id
        const cartRes = await fetch(`${API_BASE}/cart/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!cartRes.ok) throw new Error("Failed to fetch cart");

        const cartData = await cartRes.json();
        setCart(cartData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchCart();
    else {
      setError("User not logged in");
      setLoading(false);
    }
  }, [token]);

  const handleRemoveItem = async (itemId) => {
    try {
      // Step 1: Get logged-in user details
      const userRes = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userRes.ok) throw new Error("Failed to authenticate user");
      const { user } = await userRes.json();

      // Step 2: Remove item from cart using user_id and item_id
      const res = await fetch(`${API_BASE}/cart/${user.id}/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to remove item");

      // Refresh cart after removing item
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
        total_price: prev.items
          .filter((item) => item.id !== itemId)
          .reduce((sum, item) => sum + item.total_price, 0),
      }));
    } catch (err) {
      console.error(err);
      setError("Could not remove item");
    }
  };

  if (loading) return <div className="cart-loading">Loading...</div>;
  if (error) return <div className="cart-error">Error: {error}</div>;

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Cart</h1>
      {cart?.items?.length === 0 ? (
        <p className="cart-empty">Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-items">
            {cart.items.map((item) => (
              <li key={item.id} className="cart-item">
                <div>
                  <strong>{item.product_name}</strong> x {item.quantity}
                </div>
                <div className="cart-price">₹{item.total_price}</div>
                <button
                  className="cart-remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-total">Total: ₹{cart.total_price}</div>
        </>
      )}
    </div>
  );
};

export default CartPage;
