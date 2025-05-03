// src/routes.js
import { createBrowserRouter } from "react-router-dom";
import AssessmentForm from "./pages/assesstment/AssessmentForm";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/general/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import Register from "./pages/auth/RegisterPage";
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },

      // Assessment Generator Module
      { path: "/assessment/generator", element: <AssessmentForm/> },
  
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <Register /> },
]);

export default router;
