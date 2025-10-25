// frontend/client/src/routes.js - UPDATED WITH NEW ROUTES
import { createBrowserRouter } from "react-router-dom";
import AssessmentPage from "./pages/assesstment/AssessmentPage";
import ActivityViewerPage from "./pages/assesstment/ActivityViewerPage";
import RubricViewerPage from "./pages/assesstment/RubricViewerPage";
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
import SubmissionUploadPage from "./pages/answerChecker/SubmissionUploadPage";
import SubmissionListPage from "./pages/answerChecker/SubmissionListPage";
import SubmissionReviewPage from "./pages/answerChecker/SubmissionReviewPage";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import StudentProgressView from "./pages/analytics/StudentProgressView";
import ClassAnalyticsView from "./pages/analytics/ClassAnalyticsView";

const router = createBrowserRouter(
  [
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "", element: <HomePage /> },
        { path: "lessons", element: <MyLessons /> },
        { path: "materials", element: <MaterialManagement /> },
        { path: "lessons/:id", element: <DisplayLessonPage /> },
        { path: "planner", element: <MultiStepPlanner /> },

        { path: "classes", element: <ClassManagement /> },
        { path: "classes/:classId", element: <ClassLessonsPage /> },

        { path: "assessment", element: <AssessmentPage /> },
        { path: "assessment/:id", element: <ActivityViewerPage /> },
        { path: "assessment/:id/:id", element: <RubricViewerPage /> },

        { path: "submissions", element: <SubmissionListPage /> },
        { path: "submissions/upload", element: <SubmissionUploadPage /> },
        { path: "submissions/:id/review", element: <SubmissionReviewPage /> },

        { path: "analytics", element: <AnalyticsDashboard /> },
        { path: "analytics/:id", element: <StudentProgressView /> },
        { path: "analytics/:id/:id", element: <ClassAnalyticsView /> },

        { path: "downloads", element: <FileDownloadPage /> },

        { path: "community", element: <Community /> },


      ],
    },
    { path: "/", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/unauthorized", element: <UnauthorizedPage /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

export default router;