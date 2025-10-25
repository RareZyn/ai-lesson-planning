// src/routes.js
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/general/ProtectedRoute";
import MainLayout from "./layout/MainLayout";

// General Pages
import LandingPage from "./pages/general/LandingPage";
import HomePage from "./pages/general/HomePage";
import UnauthorizedPage from "./pages/general/UnauthorizedPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Planner Pages
import PlannerPage from "./pages/planner/mylesson/PlannerPage";
import MultiStepPlanner from "./pages/planner/MultiStepPlanner/MultiStepPlanner";
import DisplayLessonPage from "./pages/planner/displaylesson/DisplayLessonPage";

// Class Pages
import ClassManagement from "./pages/class/ClassManagement";
import ClassLessonsPage from "./pages/class/ClassLessonsPage";

// Assessment Pages
import AssessmentPage from "./pages/assesstment/AssessmentPage";
import ActivityViewerPage from "./pages/assesstment/ActivityViewerPage";
import RubricViewerPage from "./pages/assesstment/RubricViewerPage";

// Answer Checker Pages
import AssessmentSubmissionsPage from "./pages/answerChecker/AssessmentSubmissionsPage";
import SubmissionListPage from "./pages/answerChecker/SubmissionListPage";
import SubmissionUploadPage from "./pages/answerChecker/SubmissionUploadPage";
import SubmissionReviewPage from "./pages/answerChecker/SubmissionReviewPage";

// Analytics Pages
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";

// Community Pages
import Community from "./pages/community/Community";

// Material Pages
import MaterialManagement from "./pages/material/MaterialManagement";

// Downloads Pages
import FileDownloadPage from "./pages/downloads/FileDownloadPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Lessons Routes
      {
        path: "lessons",
        element: <PlannerPage />,
      },
      {
        path: "lessons/create",
        element: <MultiStepPlanner />,
      },
      {
        path: "lessons/:lessonId",
        element: <DisplayLessonPage />,
      },
      // Classes Routes
      {
        path: "classes",
        element: <ClassManagement />,
      },
      {
        path: "classes/:classId/lessons",
        element: <ClassLessonsPage />,
      },
      // Assessment Routes
      {
        path: "assessment/:assessmentId",
        element: <AssessmentPage />,
      },
      {
        path: "assessment/:assessmentId/activity",
        element: <ActivityViewerPage />,
      },
      {
        path: "assessment/:assessmentId/rubric",
        element: <RubricViewerPage />,
      },
      // Answer Checker Routes
      {
        path: "submissions",
        element: <AssessmentSubmissionsPage />,
      },
      {
        path: "submissions/:assessmentId",
        element: <SubmissionListPage />,
      },
      {
        path: "submissions/:assessmentId/upload",
        element: <SubmissionUploadPage />,
      },
      {
        path: "submissions/:submissionId/review",
        element: <SubmissionReviewPage />,
      },
      // Analytics Routes
      {
        path: "analytics",
        element: <AnalyticsDashboard />,
      },
      // Community Routes
      {
        path: "community",
        element: <Community />,
      },
      // Material Routes
      {
        path: "materials",
        element: <MaterialManagement />,
      },
      // Downloads Routes
      {
        path: "downloads",
        element: <FileDownloadPage />,
      },
    ],
  },
]);

export default router;
