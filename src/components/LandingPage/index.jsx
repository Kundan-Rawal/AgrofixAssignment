import "./index.css";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[90vh]">
      <h1 className="text-8xl text-teal-700 font-extrabold">AgroFix</h1>
      <h3 className="text-3xl font-medium mt-5 ml-48">
        A-Z Grocery Shoping Solution ...
      </h3>
      <div className="logincontainer">
        <Link to="/login" className="loginbutton1">
          <button className="cursor-pointer">Login As Admin</button>
        </Link>
        <Link to="/login" className="loginbutton1">
          <button className="cursor-pointer">Login As Customer</button>
        </Link>
        <p className="donthaveaccline">
          Didnt have an Account ?{" "}
          <Link to="/register">
            <span className="spandonthaveaccline">Create New</span>
          </Link>
        </p>
      </div>
    </div>
  );
};
export default LandingPage;
