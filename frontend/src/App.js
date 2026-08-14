import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./redux/slices/authSlice";

import Navbar from "./components/layout/Navbar";
import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useAttendance from "./hooks/useAttendance";
import CinematicLoader from "./components/common/Cinematicloader";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";
import PaymentSuccess from "./pages/PaymentSuccess";
import Verifyotp from "./pages/Verifyotp";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import MyCourses from "./pages/student/MyCourses";
import VideoPlayer from "./pages/student/VideoPlayer";
import ExamPage from "./pages/student/ExamPage";
import AttendancePage from "./pages/student/AttendancePage";
import Profile from "./pages/student/Profile";
import MyCertificatesPage from "./pages/MyCertificatesPage";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import AdminCourseForm from "./pages/admin/CourseForm";
import AdminLessons from "./pages/admin/Lessons";
import AdminExamForm from "./pages/admin/ExamForm";
import AdminStudents from "./pages/admin/Students";
import AdminStudentDetail from "./pages/admin/StudentDetail";
import AdminOrders from "./pages/admin/Orders";
import AdminAttendance from "./pages/admin/Attendance";
import FloatingUI from "./components/common/Floatingui";

// BHI Attendance & Student Tracking module — admin pages
import AdminBhiDashboard from "./pages/admin/bhi/Dashboard";
import AdminBhiStudents from "./pages/admin/bhi/Students";
import AdminBhiStudentProfile from "./pages/admin/bhi/StudentProfile";
import AdminBhiClasses from "./pages/admin/bhi/Classes";
import AdminBhiPrograms from "./pages/admin/bhi/Programs";
import AdminBhiCalendar from "./pages/admin/bhi/Calendar";
import AdminBhiReports from "./pages/admin/bhi/Reports";

// BHI Attendance & Student Tracking module — teacher pages
import TeacherLayout from "./components/layout/TeacherLayout";
import TeacherBhiMyClasses from "./pages/teacher/bhi/MyClasses";
import TeacherBhiMarkAttendance from "./pages/teacher/bhi/MarkAttendance";
import TeacherBhiLessonHistory from "./pages/teacher/bhi/LessonHistory";
import TeacherBhiAlerts from "./pages/teacher/bhi/Alerts";

// Separate component so useAttendance runs AFTER fetchMe populates user
function AttendanceTracker() {
  useAttendance();
  return null;
}

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [dispatch, token]);

  // Show loader only on first visit per session
  useEffect(() => {
    const seen = sessionStorage.getItem("bhi-loaded");
    if (seen) setShowLoader(false);
  }, []);

  const handleLoaderDone = () => {
    sessionStorage.setItem("bhi-loaded", "1");
    setShowLoader(false);
  };

  return (
    <>
      {showLoader && <CinematicLoader onDone={handleLoaderDone} />}

      <BrowserRouter>
        <Navbar />
        <AttendanceTracker />
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <>
                <FloatingUI />
                <Home />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/verify-otp" element={<Verifyotp />} />

          {/* Student */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route
              path="/learn/:courseId/lesson/:lessonId"
              element={<VideoPlayer />}
            />
            <Route
              path="/learn/:courseId/lesson/:lessonId/exam"
              element={<ExamPage />}
            />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/certificates" element={<MyCertificatesPage />} />
          </Route>

          {/* Admin — wrapped in sidebar layout */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/courses/new" element={<AdminCourseForm />} />
              <Route
                path="/admin/courses/:id/edit"
                element={<AdminCourseForm />}
              />
              <Route
                path="/admin/courses/:courseId/lessons"
                element={<AdminLessons />}
              />
              <Route
                path="/admin/courses/:courseId/lessons/:lessonId/exam"
                element={<AdminExamForm />}
              />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route
                path="/admin/students/:id"
                element={<AdminStudentDetail />}
              />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />

              {/* BHI Attendance & Student Tracking module */}
              <Route path="/admin/bhi" element={<AdminBhiDashboard />} />
              <Route path="/admin/bhi/students" element={<AdminBhiStudents />} />
              <Route path="/admin/bhi/students/:id" element={<AdminBhiStudentProfile />} />
              <Route path="/admin/bhi/classes" element={<AdminBhiClasses />} />
              <Route path="/admin/bhi/programs" element={<AdminBhiPrograms />} />
              <Route path="/admin/bhi/calendar" element={<AdminBhiCalendar />} />
              <Route path="/admin/bhi/reports" element={<AdminBhiReports />} />
            </Route>
          </Route>

          {/* BHI teacher section — admin can access too (ProtectedRoute bypass) */}
          <Route element={<ProtectedRoute role="teacher" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher/bhi" element={<TeacherBhiMyClasses />} />
              <Route path="/teacher/bhi/classes/:classId/attendance" element={<TeacherBhiMarkAttendance />} />
              <Route path="/teacher/bhi/classes/:classId/lessons" element={<TeacherBhiLessonHistory />} />
              <Route path="/teacher/bhi/alerts" element={<TeacherBhiAlerts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
