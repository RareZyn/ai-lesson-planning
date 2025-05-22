// src/routes.js
import { createBrowserRouter } from "react-router-dom";
import AssessmentForm from "./pages/assesstment/AssessmentForm";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/general/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import ClassDiagram from "./pages/auth/ClassDiagram";
import RegisterPage from "./pages/auth/RegisterPage";
import UnauthorizedPage from "./pages/general/UnauthorizedPage";
import LandingPage from "./pages/general/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "assessment/generator", element: <AssessmentForm /> }, 
      { path: "class", element: <ClassDiagram /> }, 
    ],
  },
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> }, 
]);

export default router;
