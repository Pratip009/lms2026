/**
 * Seeds the BHI program catalog from the program/fee sheet.
 *
 *   npm run seed:bhi-programs            # insert missing programs only (safe to re-run)
 *   npm run seed:bhi-programs -- --update  # also overwrite cost/hours/certification on existing ones
 *
 * Programs are matched by name. Course codes are left blank — set them in
 * Admin → BHI Programs.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const BhiProgram = require("../models/bhi/BhiProgram");
const { PROGRAM_CATALOG, SUPPORT_ONLY_CATALOG } = require("../config/bhiEnrollmentForms");

const update = process.argv.includes("--update");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  let inserted = 0, updated = 0;

  for (const p of PROGRAM_CATALOG) {
    const cost = { tuition: p.tuition, fees: p.fees, books: p.books, tools: p.tools, other: p.other };
    const sum = Object.values(cost).reduce((a, b) => a + b, 0);
    if (sum !== p.total) console.warn(`⚠  ${p.name}: line items add to ${sum} but sheet total is ${p.total}`);

    const details = { cost, hours: p.hours, certification: p.certification, offeredAsSupport: Boolean(p.offeredAsSupport) };
    const res = await BhiProgram.updateOne(
      { name: p.name },
      {
        $setOnInsert: { name: p.name, type: "primary", ...(update ? {} : details) },
        ...(update ? { $set: details } : {}),
      },
      { upsert: true }
    );
    if (res.upsertedCount) inserted++;
    else if (update && res.modifiedCount) updated++;
  }

  for (const p of SUPPORT_ONLY_CATALOG) {
    const res = await BhiProgram.updateOne({ name: p.name }, { $setOnInsert: { name: p.name, type: p.type } }, { upsert: true });
    if (res.upsertedCount) inserted++;
  }

  console.log(`✅ BHI programs: ${inserted} inserted, ${updated} updated.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
