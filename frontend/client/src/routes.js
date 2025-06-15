// src/routes.js - Updated with new assessment structure
import { createBrowserRouter } from "react-router-dom";
import AssessmentPage from "./pages/assesstment/AssessmentPage"; 
import ActivityGenerated from "./pages/assesstment/ActivityGenerated"; 
import RubricGenerated from "./pages/assesstment/RubricGenerated"; 
import MainLayout from "./layout/MainLayout";
import HomePage from "./pages/general/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UnauthorizedPage from "./pages/general/UnauthorizedPage";
import FileDownloadPage from "./pages/downloads/FileDownloadPage";
import ProtectedRoute from "./components/general/ProtectedRoute";
import MyLessons from "./pages/planner/mylesson/PlannerPage";
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

      // Updated assessment routes
      { path: "assessment", element: <AssessmentPage /> },
      { path: "assessment/activity/:id", element: <ActivityGenerated /> },
      { path: "assessment/rubric/:id", element: <RubricGenerated /> },

      { path: "downloads", element: <FileDownloadPage /> },
      { path: "lessons", element: <MyLessons /> },
      { path: "materials", element: <MaterialManagement /> },
      { path: "classes", element: <ClassManagement /> },
      { path: "planner", element: <MultiStepPlanner /> },
      {path:"community",element:<Community/>},
      { path: "lessons/:id", element: <DisplayLessonPage />},
      { path: "classes/:classId", element: <ClassLessonsPage />}
    ],
  },
  { path: "/", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
]);

export default router;
