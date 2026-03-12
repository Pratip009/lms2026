require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Exam = require("../models/Exam");

const connectDB = require("../config/db");

const seed = async () => {
  await connectDB();

  console.log("🌱 Seeding database...");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Exam.deleteMany({}),
  ]);
  console.log("🗑  Cleared existing data");

  // ─── Users ─────────────────────────────────────────────
  const admin = await User.create({
    name: "Admin User",
    email: "admin@lms.com",
    password: "Admin@1234",
    role: "admin",
    isActive: true,
  });

  const students = await User.insertMany([
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: await bcrypt.hash("Student@1234", 12),
      role: "student",
      isActive: true,
    },
    {
      name: "Bob Smith",
      email: "bob@example.com",
      password: await bcrypt.hash("Student@1234", 12),
      role: "student",
      isActive: true,
    },
  ]);

  console.log(`✅ Created ${1 + students.length} users`);

  // ─── Courses ───────────────────────────────────────────
  const course = await Course.create({
    title: "Complete Node.js Developer Course",
    slug: "complete-nodejs-developer-" + Date.now(),
    description:
      "Master Node.js, Express, MongoDB, and more. Build real-world production applications from scratch with this comprehensive course covering backend development, REST APIs, authentication, and deployment.",
    shortDescription: "Master Node.js and build production-ready applications.",
    price: 49.99,
    currency: "USD",
    category: "Web Development",
    level: "intermediate",
    language: "English",
    tags: ["nodejs", "javascript", "backend", "express", "mongodb"],
    instructor: admin._id,
    isPublished: true,
    totalLessons: 3,
    requirements: ["Basic JavaScript knowledge", "Familiarity with HTML/CSS"],
    whatYouWillLearn: [
      "Build REST APIs with Express.js",
      "Work with MongoDB and Mongoose",
      "Implement JWT authentication",
      "Deploy Node.js apps to production",
    ],
  });

  // ─── Lessons ───────────────────────────────────────────
  const lessons = await Lesson.insertMany([
    {
      title: "Introduction to Node.js",
      description:
        "Learn the fundamentals of Node.js, its event-driven architecture, and why it is perfect for scalable server-side applications.",
      course: course._id,
      order: 1,
      video: { vdoCipherId: "REPLACE_WITH_VDOCIPHER_ID_1", duration: 1800 },
      isFreePreview: true,
      isPublished: true,
    },
    {
      title: "Building REST APIs with Express",
      description:
        "Deep dive into Express.js framework. Learn routing, middleware, error handling, and building full REST APIs.",
      course: course._id,
      order: 2,
      video: { vdoCipherId: "REPLACE_WITH_VDOCIPHER_ID_2", duration: 2400 },
      isFreePreview: false,
      isPublished: true,
    },
    {
      title: "MongoDB and Mongoose ORM",
      description:
        "Connect your Express app to MongoDB. Learn Mongoose schemas, models, queries, aggregations, and best practices.",
      course: course._id,
      order: 3,
      video: { vdoCipherId: "REPLACE_WITH_VDOCIPHER_ID_3", duration: 2700 },
      isFreePreview: false,
      isPublished: true,
    },
  ]);

  // ─── Exams ─────────────────────────────────────────────
  await Exam.insertMany([
    {
      title: "Lesson 1 Quiz: Node.js Fundamentals",
      lesson: lessons[0]._id,
      course: course._id,
      passingScore: 70,
      shuffleQuestions: true,
      questions: [
        {
          questionText: "What is Node.js primarily used for?",
          options: [
            { label: "A", text: "Server-side JavaScript execution" },
            { label: "B", text: "Styling web pages" },
            { label: "C", text: "Database management" },
            { label: "D", text: "Mobile app development" },
          ],
          correctAnswer: "A",
          explanation: "Node.js is a runtime that executes JavaScript on the server.",
          points: 1,
        },
        {
          questionText: "Which module handles file system operations in Node.js?",
          options: [
            { label: "A", text: "http" },
            { label: "B", text: "fs" },
            { label: "C", text: "path" },
            { label: "D", text: "os" },
          ],
          correctAnswer: "B",
          explanation: "The 'fs' (file system) module provides file I/O operations.",
          points: 1,
        },
        {
          questionText: "Node.js uses which programming paradigm at its core?",
          options: [
            { label: "A", text: "Multi-threaded blocking I/O" },
            { label: "B", text: "Single-threaded event-driven non-blocking I/O" },
            { label: "C", text: "Synchronous multi-process" },
            { label: "D", text: "Object-oriented only" },
          ],
          correctAnswer: "B",
          explanation: "Node.js uses a single-threaded event loop with non-blocking I/O operations.",
          points: 2,
        },
        {
          questionText: "What does npm stand for?",
          options: [
            { label: "A", text: "Node Package Manager" },
            { label: "B", text: "New Project Manager" },
            { label: "C", text: "Node Project Modules" },
            { label: "D", text: "Node Programming Method" },
          ],
          correctAnswer: "A",
          explanation: "npm stands for Node Package Manager.",
          points: 1,
        },
      ],
    },
    {
      title: "Lesson 2 Quiz: Express.js REST APIs",
      lesson: lessons[1]._id,
      course: course._id,
      passingScore: 70,
      shuffleQuestions: true,
      questions: [
        {
          questionText: "Which HTTP method is used to create a new resource?",
          options: [
            { label: "A", text: "GET" },
            { label: "B", text: "POST" },
            { label: "C", text: "DELETE" },
            { label: "D", text: "OPTIONS" },
          ],
          correctAnswer: "B",
          explanation: "POST is used to submit data to create a new resource.",
          points: 1,
        },
        {
          questionText: "What is middleware in Express.js?",
          options: [
            { label: "A", text: "A database connector" },
            { label: "B", text: "Functions that execute during the request-response cycle" },
            { label: "C", text: "A CSS preprocessor" },
            { label: "D", text: "A template engine" },
          ],
          correctAnswer: "B",
          explanation: "Middleware functions have access to req, res, and next in the cycle.",
          points: 2,
        },
        {
          questionText: "How do you define a route parameter in Express?",
          options: [
            { label: "A", text: "app.get('/users/<id>')" },
            { label: "B", text: "app.get('/users/{id}')" },
            { label: "C", text: "app.get('/users/:id')" },
            { label: "D", text: "app.get('/users/[id]')" },
          ],
          correctAnswer: "C",
          explanation: "Route parameters are defined using a colon prefix: :paramName",
          points: 1,
        },
        {
          questionText: "What does res.json() do in Express?",
          options: [
            { label: "A", text: "Parses incoming JSON requests" },
            { label: "B", text: "Sends a JSON response and sets Content-Type header" },
            { label: "C", text: "Stores data in JSON format" },
            { label: "D", text: "Validates JSON schema" },
          ],
          correctAnswer: "B",
          explanation: "res.json() serializes the object and sets Content-Type to application/json.",
          points: 1,
        },
      ],
    },
  ]);

  console.log(`✅ Created ${lessons.length} lessons with exams`);
  console.log("\n🎉 Seeding complete!\n");
  console.log("─────────────────────────────────");
  console.log("  Admin:   admin@lms.com / Admin@1234");
  console.log("  Student: alice@example.com / Student@1234");
  console.log("─────────────────────────────────\n");

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
