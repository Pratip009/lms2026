import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./redux/slices/authSlice";

import Navbar from "./components/layout/Navbar";
import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useAttendance from "./hooks/useAttendance";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";
import PaymentSuccess from "./pages/PaymentSuccess";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import MyCourses from "./pages/student/MyCourses";
import VideoPlayer from "./pages/student/VideoPlayer";
import ExamPage from "./pages/student/ExamPage";
import AttendancePage from "./pages/student/AttendancePage";
import Profile from "./pages/student/Profile"; // ✅ new

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

// ✅ Separate component so useAttendance runs AFTER fetchMe populates user
function AttendanceTracker() {
  useAttendance();
  return null;
}

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [dispatch, token]);

  return (
    <BrowserRouter>
      <Navbar />
      <AttendanceTracker /> {/* ✅ inside BrowserRouter, after auth is resolved */}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

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
          <Route path="/profile" element={<Profile />} /> {/* ✅ new */}
        </Route>

        {/* Admin routes — wrapped in sidebar layout */}
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
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;