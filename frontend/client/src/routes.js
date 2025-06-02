// src/routes.js
import { createBrowserRouter } from "react-router-dom";
import AssessmentForm from "./pages/assesstment/AssessmentForm";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/general/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UnauthorizedPage from "./pages/general/UnauthorizedPage";
import FileDownloadPage from "./pages/downloads/FileDownloadPage";
import ProtectedRoute from "./components/general/ProtectedRoute";

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
      { path: "assessment", element: <AssessmentForm /> },
      { path: "downloads", element: <FileDownloadPage /> },
    ],
  },
  { path: "/", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
]);

export default router;
