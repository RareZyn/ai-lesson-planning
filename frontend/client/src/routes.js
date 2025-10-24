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

// NEW IMPORTS - Answer Checker Module
import SubmissionUploadPage from "./pages/answerChecker/SubmissionUploadPage";
import SubmissionListPage from "./pages/answerChecker/SubmissionListPage";
import SubmissionReviewPage from "./pages/answerChecker/SubmissionReviewPage";

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

        // Assessment routes
        { path: "assessment", element: <AssessmentPage /> },
        { path: "assessment/:id", element: <ActivityViewerPage /> },
        { path: "assessment/:id/:id", element: <RubricViewerPage /> },

        // NEW - Answer Checker / Submission routes
        { path: "submissions", element: <SubmissionListPage /> },
        { path: "submissions/upload", element: <SubmissionUploadPage /> },
        { path: "submissions/:id/review", element: <SubmissionReviewPage /> },

        // Answer Checker alias routes (alternative paths)
        { path: "answer-checker", element: <SubmissionListPage /> },
        { path: "answer-checker/upload", element: <SubmissionUploadPage /> },
        { path: "answer-checker/review/:id", element: <SubmissionReviewPage /> },

        // Existing routes
        { path: "downloads", element: <FileDownloadPage /> },
        { path: "lessons", element: <MyLessons /> },
        { path: "materials", element: <MaterialManagement /> },
        { path: "classes", element: <ClassManagement /> },
        { path: "planner", element: <MultiStepPlanner /> },
        { path: "community", element: <Community /> },
        { path: "lessons/:id", element: <DisplayLessonPage /> },
        { path: "classes/:classId", element: <ClassLessonsPage /> },
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
