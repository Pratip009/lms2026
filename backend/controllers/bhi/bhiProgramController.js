const asyncHandler = require("express-async-handler");
const BhiProgram = require("../../models/bhi/BhiProgram");

// GET /api/bhi/programs?type=primary|support
const getPrograms = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.type) filter.type = req.query.type;
  const programs = await BhiProgram.find(filter).sort({ name: 1 });
  res.json({ success: true, programs });
});

// POST /api/bhi/programs (admin only)
const createProgram = asyncHandler(async (req, res) => {
  const { name, type, description } = req.body;
  if (!name || !type) {
    res.status(400);
    throw new Error("Program name and type are required.");
  }
  const program = await BhiProgram.create({ name, type, description });
  res.status(201).json({ success: true, program });
});

// PATCH /api/bhi/programs/:id (admin only)
const updateProgram = asyncHandler(async (req, res) => {
  const program = await BhiProgram.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!program) {
    res.status(404);
    throw new Error("Program not found.");
  }
  res.json({ success: true, program });
});

// DELETE /api/bhi/programs/:id — soft delete only (never hard-delete, cross-cutting #1)
const deactivateProgram = asyncHandler(async (req, res) => {
  const program = await BhiProgram.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!program) {
    res.status(404);
    throw new Error("Program not found.");
  }
  res.json({ success: true, program });
});

module.exports = { getPrograms, createProgram, updateProgram, deactivateProgram };
