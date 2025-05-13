// src/routes.js
import { createBrowserRouter } from "react-router-dom";
import AssessmentForm from "./pages/assesstment/AssessmentForm";
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/general/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import CreateLesson from './pages/planner/CreateLessonPlan/CreateLesson';
import MyLessons from "./pages/general/mylesson/MyLessons";
import DisplayLesson from "./pages/planner/displaylesson/DisplayLesson";
import CalendarView from "./pages/general/mylesson/CalendarView";
import LandingPage from "./pages/general/LandingPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UnauthorizedPage from "./pages/general/UnauthorizedPage";
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
      { path: "home", element: <HomePage /> },
      { path: "lessons", element: <MyLessons /> },
      { path: "display", element: <DisplayLesson /> },
      { 
        path: "assessment/generator", 
        element: (
          <ProtectedRoute roles={["teacher", "admin"]}>
            <AssessmentForm />
          </ProtectedRoute>
        ) 
      },
      { path: "create", element: <CreateLesson /> },
      { path: "calendar", element: <CalendarView /> },
    ],
  },
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
]);

export default router;