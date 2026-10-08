/**
 * BHI Online Enrollment — form content & rules
 * ─────────────────────────────────────────────
 * Everything that is "paperwork wording" lives here, transcribed from the
 * paper enrollment packet, so BHI can change text without touching logic.
 *
 * FUNDING RULE: Hudson County (HCDFS) and EQISS students are funded. They must
 * never see fee amounts or payment wording. That rule is enforced server-side
 * (see getEnrollmentConfig / sanitizeApplicationForApplicant) — the frontend
 * simply never receives the data.
 */

const CATEGORIES = {
  HCDFS: { code: "HCDFS", label: "Hudson County (HCDFS)", funded: true },
  EQISS: { code: "EQISS", label: "EQISS", funded: true },
  PRIVATE: { code: "PRIVATE", label: "Private (self-paying)", funded: false },
};
const CATEGORY_CODES = Object.keys(CATEGORIES);
const isFunded = (category) => Boolean(CATEGORIES[category]?.funded);

const LOCATIONS = [
  { code: "SUMMIT", label: "591 Summit Ave, Suite 400, Jersey City, NJ 07306" },
  { code: "BERGEN", label: "910 Bergen Ave, 3rd Floor, Jersey City, NJ 07306" },
];
const LOCATION_CODES = LOCATIONS.map((l) => l.code);

// Stated in the private-student Enrollment Agreement (pg. 1).
const PRIVATE_ENROLLMENT_FEES = { application: 25, registration: 100 };

// ─── Program catalog (from the BHI program/fee sheet) ─────
// Course codes were not on the sheet we received — fill them in via
// Admin → BHI Programs once Mahek confirms them.
const PROGRAM_CATALOG = [
  { name: "Business Analyst", tuition: 3600, fees: 0, books: 150, tools: 150, other: 0, total: 3900, hours: 200, certification: "International Institute of Business Analysis (IIBA)" },
  { name: "Certified Clinical Medical Assistant", tuition: 3445, fees: 0, books: 100, tools: 300, other: 0, total: 3845, hours: 350, certification: "MEDCA" },
  { name: "Cisco Network Associate", tuition: 3500, fees: 0, books: 200, tools: 100, other: 0, total: 3800, hours: 240, certification: "CISCO" },
  { name: "Home Health Aide", tuition: 660, fees: 200, books: 40, tools: 65, other: 0, total: 965, hours: 76, certification: "CHHA" },
  { name: "Hospitality Management", tuition: 3600, fees: 100, books: 200, tools: 0, other: 0, total: 3900, hours: 560, certification: "ServSafe" },
  { name: "Office Management - Computer Support Basics", tuition: 3500, fees: 200, books: 300, tools: 0, other: 0, total: 4000, hours: 200, certification: "CompTIA A+" },
  { name: "Patient Care Technician", tuition: 3500, fees: 175, books: 275, tools: 0, other: 0, total: 3950, hours: 300, certification: "MEDCA" },
  { name: "Pharmacy Technician", tuition: 3500, fees: 100, books: 100, tools: 200, other: 0, total: 3900, hours: 300, certification: "MEDCA" },
  { name: "Resident Electrician", tuition: 3600, fees: 100, books: 150, tools: 150, other: 0, total: 4000, hours: 300, certification: "OSHA" },
  { name: "Solar Panel Installer", tuition: 3600, fees: 0, books: 100, tools: 200, other: 100, total: 4000, hours: 240, certification: "NABCEP" },
  { name: "Web Page, Digital/Multimedia and Information Resources Design", tuition: 3600, fees: 100, books: 150, tools: 150, other: 0, total: 4000, hours: 300, certification: "Google UI/UX Certification" },
  { name: "Child Development Associate", tuition: 3500, fees: 50, books: 100, tools: 0, other: 350, total: 4000, hours: 240, certification: "Child Development Associate National Credential" },
  { name: "Security Officer Training", tuition: 180, fees: 0, books: 0, tools: 0, other: 135, total: 315, hours: 24, certification: "SORA" },
  { name: "English as a Second Language", tuition: 3100, fees: 150, books: 250, tools: 250, other: 250, total: 4000, hours: 600, certification: "Completion", offeredAsSupport: true },
  { name: "GED", tuition: 3500, fees: 250, books: 0, tools: 0, other: 250, total: 4000, hours: 600, certification: "GED", offeredAsSupport: true },
];
// Support-only offerings mentioned in the meeting (not on the fee sheet).
const SUPPORT_ONLY_CATALOG = [{ name: "Digital Literacy", type: "support" }];

// ─── Document uploads ─────────────────────────────────────
// `audience`: "all" | "funded" | "private". `required` is enforced on submit.
const APPLICANT_DOCUMENTS = [
  { kind: "resume", label: "Resume", audience: "all", required: true, hint: "PDF or Word document." },
  { kind: "photo_id", label: "State-issued picture ID, passport, or green card", audience: "all", required: true, hint: "Photo or scan of the front." },
  { kind: "ss_card", label: "Social Security card", audience: "all", required: true, hint: "Photo or scan." },
  { kind: "referral_form", label: "Inter-Agency Referral / Status Change Form", audience: "funded", required: false, hint: "From your caseworker. If you don't have it yet, BHI can collect it later." },
];

// Ongoing "right side of the folder" items — uploaded by staff after enrollment.
const STAFF_DOCUMENTS = [
  { kind: "progress_report", label: "Progress report (min. 1 per month)" },
  { kind: "attendance_sheet", label: "Client attendance sheet" },
  { kind: "absence_note", label: "Student absence / note" },
  { kind: "certification", label: "Completion / certification" },
  { kind: "transcript", label: "Transcript" },
  { kind: "updated_resume", label: "Updated resume" },
  { kind: "employment_verification", label: "Employment verification" },
  { kind: "retention_verification", label: "Employment retention verification" },
  { kind: "other", label: "Other" },
];
const ALL_DOCUMENT_KINDS = [...APPLICANT_DOCUMENTS, ...STAFF_DOCUMENTS].map((d) => d.kind);

// ─── Agreement texts ──────────────────────────────────────
// Bump `version` whenever wording changes — signed copies record the version.
const SCHOOL = "Bright Horizon Institute";

const ENROLLMENT_AGREEMENT_COMMON_SECTIONS = [
  {
    heading: "Requirements for graduation",
    funded:
      "In order to graduate the student must successfully complete all on-campus courses with a minimum grade average of 75% for each section, successfully complete the clinical externship, complete all affiliated institutional exit interviews and maintain an overall attendance of 80%.",
    private:
      "In order to graduate the student must successfully complete all on-campus courses with a minimum grade average of 75% for each section, successfully complete the clinical externship, be current with all financial obligations to the school, complete all affiliated institutional exit interviews and maintain an overall attendance of 80%.",
  },
  {
    heading: "Closures & delay notices",
    both: [
      "Occasionally, BHI experiences some nasty weather that makes it unsafe for students to travel to and from school. In these situations, we may cancel school or run on a two-hour delay. If one of these situations occurs, our phone messenger system will provide updated information and we will notify the students through email and phone.",
      "In the event of an unannounced school closure, students enrolled at the time of the closure must contact the Department of Labor and Workforce Development's Training Evaluation Unit within ninety (90) calendar days of the closure. Failure to do so within ninety (90) days may exclude the student from any available form of assistance. The contact number to call is (609) 292-4287 or email at trainingevaluationunit@dol.nj.gov.",
    ],
  },
  {
    heading: "Employment services",
    both: [
      "The school provides employment assistance to all graduated Bright Horizon students. Finding employment is a joint effort between school and student. The student must agree to cooperate with the job placement/career services coordinator to maximize success for helping to find employment in the allied health or related field. The school cannot and does not promise or guarantee placement upon graduation. Employment is only attained by the applicant that truly seeks it.",
    ],
    funded:
      "The student agrees to comply with school rules and regulations during his/her program of study, and the school has the right to terminate the student's enrollment in the event of the student's failure to comply with the rules and regulations. A student's enrollment may also be terminated for failure to maintain a satisfactory grade point average or failure to meet school attendance requirements.",
    private:
      "The student agrees to comply with school rules and regulations during his/her program of study, and the school has the right to terminate the student's enrollment in the event of the student's failure to comply with the rules and regulations. A student's enrollment may also be terminated for failure to maintain a satisfactory grade point average, failure to meet school attendance requirements and/or failure to be current in all financial obligations to the school.",
  },
];

const ENROLLMENT_AGREEMENT_CLOSING =
  "By signing below, I the undersigned enroll in the above program of training, acknowledge having received, read and understood a copy of this Enrollment Agreement and the School Catalog and agree to comply with the terms of each. I further acknowledge that no oral representations regarding the percentage of graduates, employed or starting salaries have been made to me by any representative or employee of the school. This enrollment agreement may be cancelled within two days of signing. Any questions regarding terms of this Enrollment Agreement should be addressed to the appropriate school representative.";

const buildEnrollmentAgreement = (category) => {
  const variant = isFunded(category) ? "funded" : "private";
  const paragraphs = [];

  paragraphs.push({
    type: "intro",
    text:
      variant === "private"
        ? `I, {studentName}, hereby seek enrollment for training leading to certification in {programName} at ${SCHOOL}. I agree to comply with the school policy in its entirety and do understand that Tuition is my direct responsibility. It is the responsibility of the student to obtain approval from the sponsoring agency before starting the program otherwise the student will be held responsible for the payment.`
        : `I, {studentName}, hereby seek enrollment for training leading to certification in {programName} at ${SCHOOL}. I agree to comply with the school policy.`,
  });

  if (variant === "private") {
    paragraphs.push({
      type: "fees",
      text: `I understand that an application fee of $${PRIVATE_ENROLLMENT_FEES.application}.00 and a registration fee of $${PRIVATE_ENROLLMENT_FEES.registration}.00 are payable at the time of enrollment. Program costs are itemized below.`,
    });
  }
  paragraphs.push({ type: "text", text: "Start dates for all programs will be held on the first week of every month." });

  for (const s of ENROLLMENT_AGREEMENT_COMMON_SECTIONS) {
    const body = [...(s.both || [])];
    if (s[variant]) body.unshift(s[variant]);
    paragraphs.push({ type: "section", heading: s.heading, body });
  }
  paragraphs.push({ type: "text", text: ENROLLMENT_AGREEMENT_CLOSING });
  return paragraphs;
};

const REFUND_POLICY = {
  intro:
    "A full refund will be made to any student, or any local, state, federal agency that paid tuition on behalf of the student. No refunds will be made to the student for registration fees, books, equipment, or tools purchased from the school and issued to the student.",
  standard: [
    ["During the first week", "10% of the tuition"],
    ["During the second or third week", "20% of the tuition"],
    ["After the third week but prior to completion of 25 percent of the course", "45% of the tuition"],
    ["After 25 percent but not more than 50 percent of the course has been attended", "70% of the tuition"],
    ["After completion of more than 50% of the course", "100% of the tuition"],
  ],
  partTimeIntro:
    "For part time attendance in courses over 300 hours in length, calculation of the amount the school may retain in addition to the application and registration fee plus:",
  partTime: [
    ["During the first 25 hours of scheduled attendance", "10% of the tuition"],
    ["During hours 26 through 75 of scheduled attendance", "20% of the tuition"],
    ["After the third week but prior to the completion of 25% of the course", "45% of the tuition"],
    ["After 25% but not more than 50 percent of the course", "70% of the tuition"],
    ["After completion of more than 50% of the course", "100% of the tuition"],
  ],
};

const GRIEVANCE_POLICY = [
  "In the event any student has a grievance related to the school, its employees, or fellow students, including all academic or personal issues, as well as any claims related to discrimination or including harassment:",
  "The student must submit a request in writing for an appointment for an interview with the School Director(s) which should include the following information:",
  "Student's full name, social security number, and current address.",
  "State the concern including dates, times, and instructors, staff, or other students involved.",
  "Indicate three dates available for a meeting with the school Director and/or an appeal panel.",
  "Student's signature and date signed.",
  "Once the Director has received such a request, he/she will arrange an appointment within five (5) business days of the receipt of the written request and will notify the student and the accused of such.",
];

const JOB_PLACEMENT_RELEASE =
  `I, {studentName}, hereby authorize my employer to release any and all information relating to my employment with them to ${SCHOOL}. I further release and hold harmless the parties involved (current employer and ${SCHOOL}) from any and all liability that may potentially result from the release and/or use of such information. I understand that any information released by my employer will be held in strictest confidence, that it will be viewed only by the prospective parties needed, and that neither I nor anyone else not so involved will have the right to see the information.`;

const BACKGROUND_AUTHORIZATION =
  `I hereby authorize ${SCHOOL} to make an independent investigation of my background and criminal or police records. I release ${SCHOOL}, and any person or entity which provides information pursuant to this authorization, from any and all liabilities, claims or law suits in regards to the information obtained from any and all of the above sources. The information contained in this application is correct to the best of my knowledge. I understand that any omission of material fact on this application may be grounds for rejection of this application.`;

// ⚠ PLACEHOLDER WORDING — the paper Photo Release and Books/Laptop forms were
// listed on the checklist but not in the scanned packet. Replace with BHI's text.
const PHOTO_RELEASE =
  `I grant ${SCHOOL} permission to use photographs and video of me taken during school activities in BHI publications, website, and social media. I understand I will not be compensated and that I may revoke this permission in writing at any time for future uses.`;

const MATERIALS_ACKNOWLEDGEMENT =
  `I understand that books, a laptop, and/or other materials may be issued to me as part of my program. If I receive a laptop and fail to complete 60 days of my course, I will return the laptop to ${SCHOOL}. I will sign a separate receipt for each item at the time it is issued.`;

const ORIENTATION_ACK =
  "There is a mandatory orientation scheduled before the first day of class and I agree to make myself available.";

const MEDICAL_ATTESTATION =
  "I confirm the emergency contact and medical information I provided is accurate and authorize BHI staff to share it with emergency responders if needed.";

const WORKFORCE_CERTIFICATION = "I certify that the above information is true and correct to the best of my knowledge.";

/**
 * Agreements the applicant signs, filtered by category. Each is recorded with
 * the drawn signature, typed name, timestamp, IP and wording version.
 */
const AGREEMENTS = [
  { key: "enrollment_agreement", title: "Enrollment Agreement", audience: "all", version: "2026-10" },
  { key: "refund_policy", title: "Refund Policy", audience: "private", version: "2026-10" },
  { key: "grievance_policy", title: "Grievance Policy & Procedures", audience: "all", version: "2026-10" },
  { key: "orientation", title: "Mandatory Orientation", audience: "all", version: "2026-10", body: ORIENTATION_ACK },
  { key: "job_placement_release", title: "Job Placement Information Release Authorization", audience: "all", version: "2026-10", body: JOB_PLACEMENT_RELEASE },
  { key: "background_authorization", title: "Background Check Authorization", audience: "all", version: "2026-10", body: BACKGROUND_AUTHORIZATION },
  { key: "medical_attestation", title: "Emergency Medical Statement", audience: "all", version: "2026-10", body: MEDICAL_ATTESTATION },
  { key: "workforce_certification", title: "Workforce Registration Certification", audience: "all", version: "2026-10", body: WORKFORCE_CERTIFICATION },
  { key: "materials_acknowledgement", title: "Acknowledgement of Books / Laptop / Materials", audience: "all", version: "2026-10-draft", body: MATERIALS_ACKNOWLEDGEMENT },
  { key: "photo_release", title: "Photo Release", audience: "all", version: "2026-10-draft", body: PHOTO_RELEASE, optional: true },
];

const appliesTo = (audience, category) =>
  audience === "all" || (audience === "funded" ? isFunded(category) : !isFunded(category));

const agreementsFor = (category) =>
  AGREEMENTS.filter((a) => appliesTo(a.audience, category)).map((a) => {
    const out = { ...a };
    if (a.key === "enrollment_agreement") out.paragraphs = buildEnrollmentAgreement(category);
    if (a.key === "refund_policy") out.refundPolicy = REFUND_POLICY;
    if (a.key === "grievance_policy") out.paragraphs = GRIEVANCE_POLICY;
    return out;
  });

const applicantDocumentsFor = (category) =>
  APPLICANT_DOCUMENTS.filter((d) => appliesTo(d.audience, category));

// Fixed option lists (from the Student Data & Workforce NJ registration forms)
const OPTIONS = {
  gender: ["Male", "Female", "Non-binary", "Prefer not to say"],
  race: ["White", "Black or African American", "Asian", "Alaskan/American Indian", "Hawaiian/Pacific Islander", "I choose not to respond"],
  benefitStatus: ["SNAP", "GA", "TANF"],
  schoolStatus: [
    "In-School, H.S. or less",
    "In-School, Alternative School",
    "In-School, Post H.S.",
    "Not attending school; did not finish high school",
    "Not attending school; H.S. graduate",
  ],
  employmentStatus: ["Employed", "Employed but received notice of termination", "Not employed"],
  degree: ["Associate", "Bachelor's", "Masters", "Certificate of Completion"],
  travelDistance: ["5 miles", "10 miles", "25 miles", "50 miles", "100 miles"],
  driversLicense: ["None", "Car", "Motorcycle", "CDL-A", "CDL-B", "CDL-C"],
  contactMethods: ["US Mail", "Primary phone", "Alternate phone", "Email"],
  shift: ["Any", "1st", "2nd", "3rd", "Split", "Rotating"],
  medicalConditions: [
    ["vision", "Vision problem"],
    ["hearing", "Hearing problem"],
    ["dizziness", "Dizziness / fainting"],
    ["learningDisorder", "Learning disorder"],
    ["bloodPressure", "High/low blood pressure"],
    ["diabetes", "Diabetes"],
    ["epilepsy", "Epilepsy / seizures"],
    ["asthma", "Asthma"],
  ],
};

module.exports = {
  CATEGORIES,
  CATEGORY_CODES,
  isFunded,
  LOCATIONS,
  LOCATION_CODES,
  PRIVATE_ENROLLMENT_FEES,
  PROGRAM_CATALOG,
  SUPPORT_ONLY_CATALOG,
  APPLICANT_DOCUMENTS,
  STAFF_DOCUMENTS,
  ALL_DOCUMENT_KINDS,
  AGREEMENTS,
  agreementsFor,
  applicantDocumentsFor,
  OPTIONS,
};
