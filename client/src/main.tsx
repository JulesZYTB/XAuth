import "./index.css";
import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Apps from "./pages/Apps";
import Licenses from "./pages/Licenses";
import Register from "./pages/Register";
import UserHub from "./pages/UserHub";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Docs from "./pages/Docs";

import { Navigate } from "react-router";


/**
 * Authentication Guards
 */

// ProtectedRoute: Only allows access if a token is present
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  
  // Optional: check expiration here
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// PublicRoute: Redirects to dashboard if already logged in (prevents accessing login/register while auth)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

// Logic for the dashboard pivot (Admin vs User)
const DashboardPivot = () => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(atob(token.split(".")[1]));
    return user?.role === "admin" ? <Dashboard /> : <UserHub />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <PublicRoute><Login /></PublicRoute>,
  },
  {
    path: "/register",
    element: <PublicRoute><Register /></PublicRoute>,
  },
  {
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPivot />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/apps",
        element: <Apps />,
      },
      {
        path: "/apps/:appId/licenses",
        element: <Licenses />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/logs",
        element: <Logs />,
      },
      {
        path: "/docs",
        element: <Docs />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);

const rootElement = document.getElementById("root");
if (rootElement == null) {
  throw new Error(`Your HTML Document should contain a <div id="root"></div>`);
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
