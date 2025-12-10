// frontend/client/src/routes.js - UPDATED WITH NEW ROUTES
import { createBrowserRouter } from "react-router-dom";
import React from "react";
// important to render pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/general/HomePage";
import MyLessons from "./pages/planner/mylesson/PlannerPage";
import MainLayout from "./layout/MainLayout";
import AssessmentSubmissionsPage from "./pages/answerChecker/AssessmentSubmissionsPage";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import StudentProgressView from "./pages/analytics/StudentProgressView";
import ClassAnalyticsView from "./pages/analytics/ClassAnalyticsView";
import DisplaySyllabus from "./pages/admin/DisplaySyllabus";

// not so important
const AssessmentPage = React.lazy(() => import("./pages/assesstment/AssessmentPage"));
const ActivityViewerPage = React.lazy(() => import("./pages/assesstment/ActivityViewerPage"));
const RubricViewerPage = React.lazy(() => import("./pages/assesstment/RubricViewerPage"));

const UnauthorizedPage = React.lazy(() => import("./pages/general/UnauthorizedPage"));
const ProtectedRoute = React.lazy(() => import("./components/general/ProtectedRoute"));

const MaterialManagement = React.lazy(() => import("./pages/material/MaterialManagement"));
const ClassManagement = React.lazy(() => import("./pages/class/ClassManagement"));
const MultiStepPlanner = React.lazy(() => import("./pages/planner/MultiStepPlanner/MultiStepPlanner"));
const Community = React.lazy(() => import("./pages/community/Community"));
const DisplayLessonPage = React.lazy(() => import("./pages/planner/displaylesson/DisplayLessonPage"));
const ClassLessonsPage = React.lazy(() => import("./pages/class/ClassLessonsPage"));
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const TeacherAnalyticsPage = React.lazy(() => import("./pages/admin/TeacherAnalyticsPage"));
const AdminLessonReviewPage = React.lazy(() => import("./pages/admin/AdminLessonReviewPage"));

// NEW IMPORTS - Answer Checker Module
const SubmissionUploadPage = React.lazy(() => import("./pages/answerChecker/SubmissionUploadPage"));
const SubmissionListPage = React.lazy(() => import("./pages/answerChecker/SubmissionListPage"));
const SubmissionReviewPage = React.lazy(() => import("./pages/answerChecker/SubmissionReviewPage"));

// NEW IMPORTS - Offline Mode Module
const OfflineModePage = React.lazy(() => import("./pages/general/OfflineModePage"));
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
        { path: "submissions/:assessmentId", element: <AssessmentSubmissionsPage /> },
        { path: "submissions/:assessmentId/:submissionId", element: <SubmissionReviewPage /> },

        { path: "analytics", element: <AnalyticsDashboard /> },
        { path: "analytics/:id", element: <StudentProgressView /> },
        { path: "analytics/:id/:id", element: <ClassAnalyticsView /> },

        { path: "community", element: <Community /> },
        { path: "lessons/:id", element: <DisplayLessonPage /> },
        { path: "classes/:classId", element: <ClassLessonsPage /> },

        // Offline Mode
        { path: "offline-mode", element: <OfflineModePage /> },

        //admin
        { path: "admin", element: <AdminLayout /> },
        { path: "admin/syllabuses/:id", element: <DisplaySyllabus /> },
        { path: "admin/teacher-analytics/:id", element: <TeacherAnalyticsPage /> },
        { path: "admin/lessons/:id/review", element: <AdminLessonReviewPage /> },
      ],
    },
    { path: "/", element: <LoginPage /> },
    { path: "/login", element: <LoginPage /> },
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