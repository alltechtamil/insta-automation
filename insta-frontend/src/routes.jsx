import React from "react";
import LoginPage from "./pages/auth/LoginPage";
import DashBoardLayout from "./pages/dashboard/DashBoardLayout";

const routes = [
  {
    path: "/",
    element: <LoginPage />,
    protected: false
  },
  {
    path: "/dashboard/*", // Use a wildcard to handle nested dashboard routes
    element: <DashBoardLayout />,
    protected: true,
  },
];

export default routes;