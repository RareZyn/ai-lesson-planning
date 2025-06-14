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
import MyLessons from "./pages/planner/mylesson/MyLessons";
import MaterialManagement from "./pages/material/MaterialManagement";
import ClassManagement from "./pages/class/ClassManagement";
import MultiStepPlanner from "./pages/planner/MultiStepPlanner/MultiStepPlanner";
import Community from "./pages/community/Community";
import DisplayLessonPage from "./pages/planner/displaylesson/DisplayLessonPage";
import ClassLessonsPage from "./pages/class/ClassLessonsPage";
const router = createBrowserRouter([
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "", element: <HomePage /> },

      { path: "assessment", element: <AssessmentForm /> },
      { path: "downloads", element: <FileDownloadPage /> },
      { path: "lessons", element: <MyLessons /> },
      { path: "materials", element: <MaterialManagement /> },
      { path: "classes", element: <ClassManagement /> },
      { path: "planner", element: <MultiStepPlanner /> },
      { path: "lesson/:id", element: <DisplayLessonPage />},
      { path: "classes/:classId", element: <ClassLessonsPage />},
      {path:"community",element:<Community/>}
    ],
  },
  { path: "/", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
]);

export default router;
