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

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: (() => {
          const token = localStorage.getItem("token");
          if (!token) return <Login />;
          try {
            const user = JSON.parse(atob(token.split(".")[1]));
            return user?.role === "admin" ? <Dashboard /> : <UserHub />;
          } catch (e) {
            return <Login />;
          }
        })(),
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
    ],
  },
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
