import "./App.css";
import { Component } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import AdminDashboard from "./components/AdminProductsPage";
import AdminOrdersDashboard from "./components/AdminOrdersPage";
import UserProductsPage from "./components/UserProductsPage";
import UserCartPage from "./components/UserCartPage";

class App extends Component {
  render() {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/product" element={<AdminDashboard />} />
          <Route path="/user/product" element={<UserProductsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersDashboard />} />
          <Route path="/user/product" element={<Register />} />
          <Route path="/user/cart" element={<UserCartPage />} />
        </Routes>
      </>
    );
  }
}

export default App;
