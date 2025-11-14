// frontend/client/src/routes.js - UPDATED WITH NEW ROUTES
import { createBrowserRouter } from "react-router-dom";
import React from "react";
// important to render pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/general/HomePage";
import MyLessons from "./pages/planner/mylesson/PlannerPage";
import MainLayout from "./layout/MainLayout";

// not so important
const AssessmentPage = React.lazy(() => import("./pages/assesstment/AssessmentPage"));
const ActivityViewerPage = React.lazy(() => import("./pages/assesstment/ActivityViewerPage"));
const RubricViewerPage = React.lazy(() => import("./pages/assesstment/RubricViewerPage"));

const UnauthorizedPage = React.lazy(() => import("./pages/general/UnauthorizedPage"));
const FileDownloadPage = React.lazy(() => import("./pages/downloads/FileDownloadPage"));
const ProtectedRoute = React.lazy(() => import("./components/general/ProtectedRoute"));
// const MyLessons = React.lazy(() => import("./pages/planner/mylesson/PlannerPage"));
const MaterialManagement = React.lazy(() => import("./pages/material/MaterialManagement"));
const ClassManagement = React.lazy(() => import("./pages/class/ClassManagement"));
const MultiStepPlanner = React.lazy(() => import("./pages/planner/MultiStepPlanner/MultiStepPlanner"));
const Community = React.lazy(() => import("./pages/community/Community"));
const DisplayLessonPage = React.lazy(() => import("./pages/planner/displaylesson/DisplayLessonPage"));
const ClassLessonsPage = React.lazy(() => import("./pages/class/ClassLessonsPage"));
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));

// NEW IMPORTS - Answer Checker Module
const SubmissionUploadPage = React.lazy(() => import("./pages/answerChecker/SubmissionUploadPage"));
const SubmissionListPage = React.lazy(() => import("./pages/answerChecker/SubmissionListPage"));
const SubmissionReviewPage = React.lazy(() => import("./pages/answerChecker/SubmissionReviewPage"));

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

        //admin
        { path: "admin", element: <AdminLayout /> },
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
