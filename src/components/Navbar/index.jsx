import React, { useState } from "react";
import "./index.css"; // Import the CSS file

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">AgroFix</div>
        <div className="hamburger" onClick={toggleMenu}>
          <div className={isOpen ? "bar change" : "bar"}></div>
          <div className={isOpen ? "bar change" : "bar"}></div>
          <div className={isOpen ? "bar change" : "bar"}></div>
        </div>
        <ul className={`nav-links ${isOpen ? "open" : ""}`}>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/products">Products</a>
          </li>
          <li>
            <a href="/orders">Orders</a>
          </li>
          <li>
            <a href="/cart">Cart</a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
