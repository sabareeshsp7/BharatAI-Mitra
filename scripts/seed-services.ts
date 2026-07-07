/**
 * Seed script: populates MongoDB with 50+ Indian government schemes
 * Run with: npx tsx scripts/seed-services.ts
 */

import mongoose from "mongoose";
import { Service } from "../models/Service.model";

// Load .env.local for Atlas URI
try { (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(".env.local"); } catch { /* ignore */ }
const MONGODB_URI = process.env.MONGODB_URI;

const SERVICES = [
  // ─── Housing ───────────────────────────────────────────────────────────────
  {
    name: "Pradhan Mantri Awas Yojana (Urban)",
    category: "housing",
    description: "Housing for All scheme providing financial assistance for construction/enhancement of houses to urban poor.",
    eligibility: ["Economically Weaker Section (EWS)", "Low Income Group (LIG)", "Middle Income Group (MIG)", "No house ownership in family"],
    documents: ["Aadhaar Card", "Income Certificate", "Bank Account Details", "Caste Certificate (if applicable)", "Land Documents"],
    applicationUrl: "https://pmaymis.gov.in",
    ministry: "Ministry of Housing and Urban Affairs",
    targetBeneficiaries: ["urban-poor", "bpl", "women", "sc", "st"],
    keywords: ["housing", "awas", "home", "pmay", "urban"],
    helplineNumber: "1800-11-6163",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },
  {
    name: "Pradhan Mantri Awas Yojana (Gramin)",
    category: "housing",
    description: "Rural housing scheme providing financial assistance to Below Poverty Line households for construction of pucca houses.",
    eligibility: ["BPL families in rural areas", "SC/ST households", "Freed bonded laborers", "No pucca house ownership"],
    documents: ["Aadhaar Card", "BPL Certificate", "Bank Account Details", "Land Ownership Proof", "SECC Data Verification"],
    applicationUrl: "https://pmayg.nic.in",
    ministry: "Ministry of Rural Development",
    targetBeneficiaries: ["rural", "bpl", "sc", "st"],
    keywords: ["housing", "awas", "gramin", "rural", "pucca"],
    helplineNumber: "1800-11-6446",
    isActive: true,
    benefitType: "financial",
    launchYear: 2016,
  },

  // ─── Health ────────────────────────────────────────────────────────────────
  {
    name: "Ayushman Bharat PM-JAY",
    category: "health",
    description: "World's largest health insurance scheme providing health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
    eligibility: ["Families identified in SECC database", "BPL families", "Occupational categories as specified"],
    documents: ["Aadhaar Card", "Ration Card", "SECC Database Verification"],
    applicationUrl: "https://pmjay.gov.in",
    ministry: "Ministry of Health and Family Welfare",
    targetBeneficiaries: ["bpl", "rural", "sc", "st", "obc"],
    keywords: ["health", "insurance", "hospital", "ayushman", "pmjay", "medical"],
    helplineNumber: "14555",
    isActive: true,
    benefitType: "health",
    launchYear: 2018,
  },
  {
    name: "Janani Suraksha Yojana",
    category: "health",
    description: "Safe motherhood intervention promoting institutional delivery among poor pregnant women. Cash assistance for delivery in government health centers.",
    eligibility: ["Pregnant women below poverty line", "SC/ST women", "Age 19 years and above"],
    documents: ["Aadhaar Card", "BPL Card", "Pregnancy Registration Card", "Bank Account Details"],
    applicationUrl: "https://nhm.gov.in",
    ministry: "Ministry of Health and Family Welfare",
    targetBeneficiaries: ["women", "bpl", "rural", "sc", "st"],
    keywords: ["pregnancy", "maternity", "delivery", "women", "mother"],
    helplineNumber: "1800-180-1104",
    isActive: true,
    benefitType: "financial",
    launchYear: 2005,
  },

  // ─── Agriculture ────────────────────────────────────────────────────────────
  {
    name: "PM-KISAN Samman Nidhi",
    category: "agriculture",
    description: "Income support scheme providing ₹6,000 per year in three equal installments to small and marginal farmer families.",
    eligibility: ["Small and Marginal Farmers", "Cultivable land holding as per land records", "No income tax payer"],
    documents: ["Aadhaar Card", "Land Records/Khatoni", "Bank Account Details", "Mobile Number"],
    applicationUrl: "https://pmkisan.gov.in",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    targetBeneficiaries: ["farmers", "rural", "small-farmers"],
    keywords: ["kisan", "farmer", "agriculture", "income", "pm-kisan"],
    helplineNumber: "155261",
    isActive: true,
    benefitType: "financial",
    launchYear: 2019,
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana",
    category: "agriculture",
    description: "Crop insurance scheme providing financial support to farmers suffering crop loss/damage due to unforeseen events.",
    eligibility: ["All farmers including sharecroppers and tenant farmers", "Growing notified crops"],
    documents: ["Aadhaar Card", "Land Records", "Bank Account Details", "Sowing Certificate"],
    applicationUrl: "https://pmfby.gov.in",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    targetBeneficiaries: ["farmers", "rural"],
    keywords: ["crop", "insurance", "fasal", "bima", "farming"],
    helplineNumber: "1800-200-7710",
    isActive: true,
    benefitType: "financial",
    launchYear: 2016,
  },
  {
    name: "Kisan Credit Card",
    category: "agriculture",
    description: "Credit facility to farmers for meeting their short-term credit requirements for crop cultivation, post-harvest expenses, and maintenance.",
    eligibility: ["All farmers", "Sharecroppers, tenant farmers, and SHGs/JLGs"],
    documents: ["Aadhaar Card", "Land Records", "Passport Photo", "Bank Application Form"],
    applicationUrl: "https://www.nabard.org",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    targetBeneficiaries: ["farmers", "rural"],
    keywords: ["credit", "loan", "kisan", "card", "farming"],
    helplineNumber: "1800-200-7710",
    isActive: true,
    benefitType: "financial",
    launchYear: 1998,
  },

  // ─── Education ────────────────────────────────────────────────────────────
  {
    name: "Beti Bachao Beti Padhao",
    category: "education",
    description: "Scheme to address declining child sex ratio and promote welfare and empowerment of girl children through education.",
    eligibility: ["Girl children", "All families"],
    documents: ["Birth Certificate", "Aadhaar Card", "School Enrollment Proof"],
    applicationUrl: "https://wcd.nic.in",
    ministry: "Ministry of Women and Child Development",
    targetBeneficiaries: ["women", "girls", "children"],
    keywords: ["girl", "education", "beti", "women", "child"],
    helplineNumber: "1091",
    isActive: true,
    benefitType: "education",
    launchYear: 2015,
  },
  {
    name: "PM Poshan Shakti Nirman (Mid-Day Meal)",
    category: "education",
    description: "School meal programme providing nutritious mid-day meals to students in government and government-aided schools.",
    eligibility: ["Students of Classes 1-8 in government schools"],
    documents: ["School Enrollment Certificate"],
    ministry: "Ministry of Education",
    targetBeneficiaries: ["children", "students", "bpl"],
    keywords: ["meal", "school", "nutrition", "midday", "education"],
    helplineNumber: "1800-111-800",
    isActive: true,
    benefitType: "other",
    launchYear: 1995,
  },
  {
    name: "National Scholarship Portal Schemes",
    category: "education",
    description: "Single platform for various government scholarships for students from pre-matric to post-doctoral level.",
    eligibility: ["Students from minority communities", "SC/ST students", "OBC students", "Differently-abled students"],
    documents: ["Aadhaar Card", "Income Certificate", "Marksheets", "Caste/Community Certificate", "Bank Account Details"],
    applicationUrl: "https://scholarships.gov.in",
    ministry: "Ministry of Education",
    targetBeneficiaries: ["students", "sc", "st", "obc", "minority"],
    keywords: ["scholarship", "education", "student", "minority", "financial aid"],
    helplineNumber: "0120-6619540",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },

  // ─── Employment ──────────────────────────────────────────────────────────
  {
    name: "MGNREGA (Mahatma Gandhi National Rural Employment Guarantee)",
    category: "employment",
    description: "Legal guarantee for at least 100 days of wage employment per year to rural households whose adult members volunteer to do unskilled manual work.",
    eligibility: ["Adult members of rural households", "Willing to do unskilled manual work"],
    documents: ["Aadhaar Card", "Job Card Registration", "Bank/Post Office Account"],
    applicationUrl: "https://nrega.nic.in",
    ministry: "Ministry of Rural Development",
    targetBeneficiaries: ["rural", "unemployed", "bpl"],
    keywords: ["employment", "job", "mgnrega", "work", "rural", "wages"],
    helplineNumber: "1800-111-555",
    isActive: true,
    benefitType: "employment",
    launchYear: 2005,
  },
  {
    name: "PM MUDRA Yojana",
    category: "employment",
    description: "Micro-credit scheme providing loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises.",
    eligibility: ["Small business owners", "Self-employed individuals", "Non-farm sector enterprises"],
    documents: ["Aadhaar Card", "PAN Card", "Business Plan/Proposal", "Bank Statement (6 months)", "Proof of Business"],
    applicationUrl: "https://mudra.org.in",
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["entrepreneurs", "self-employed", "small-business"],
    keywords: ["loan", "mudra", "business", "entrepreneur", "credit", "startup"],
    helplineNumber: "1800-180-1111",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },
  {
    name: "Skill India Mission",
    category: "employment",
    description: "Training initiative to enhance the employability of youth through skill development programs across various sectors.",
    eligibility: ["Youth aged 15-45 years", "School dropouts", "Unemployed individuals"],
    documents: ["Aadhaar Card", "Educational Certificates", "Age Proof"],
    applicationUrl: "https://skillindia.gov.in",
    ministry: "Ministry of Skill Development and Entrepreneurship",
    targetBeneficiaries: ["youth", "unemployed", "rural"],
    keywords: ["skill", "training", "employment", "youth", "vocational"],
    helplineNumber: "1800-123-9626",
    isActive: true,
    benefitType: "employment",
    launchYear: 2015,
  },
  {
    name: "Startup India",
    category: "employment",
    description: "Flagship initiative to build a strong ecosystem for nurturing innovation and startups, driving sustainable economic growth and generating employment.",
    eligibility: ["Startups registered under Companies Act 2013", "Innovative business model", "Less than 10 years old"],
    documents: ["Certificate of Incorporation", "PAN Card", "Business Plan", "Aadhaar Card of founders"],
    applicationUrl: "https://startupindia.gov.in",
    ministry: "Department for Promotion of Industry and Internal Trade",
    targetBeneficiaries: ["entrepreneurs", "youth", "innovators"],
    keywords: ["startup", "innovation", "business", "entrepreneur", "funding"],
    helplineNumber: "1800-115-565",
    isActive: true,
    benefitType: "other",
    launchYear: 2016,
  },

  // ─── Social Security ───────────────────────────────────────────────────────
  {
    name: "PM Jeevan Jyoti Bima Yojana",
    category: "social-security",
    description: "Life insurance scheme providing coverage of ₹2 lakh on death due to any reason at premium of ₹436 per year.",
    eligibility: ["Age 18-50 years", "Bank account holder", "Active mobile number"],
    documents: ["Aadhaar Card", "Bank Account Details", "Mobile Number"],
    applicationUrl: "https://jansuraksha.gov.in",
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["general", "bpl", "workers"],
    keywords: ["insurance", "life", "jeevan", "jyoti", "death", "coverage"],
    helplineNumber: "1800-180-1111",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },
  {
    name: "PM Suraksha Bima Yojana",
    category: "social-security",
    description: "Accidental death and disability insurance scheme with coverage of ₹2 lakh at annual premium of just ₹20.",
    eligibility: ["Age 18-70 years", "Bank account linked to Aadhaar"],
    documents: ["Aadhaar Card", "Bank Account Details"],
    applicationUrl: "https://jansuraksha.gov.in",
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["general", "workers", "bpl"],
    keywords: ["accident", "insurance", "suraksha", "bima", "disability"],
    helplineNumber: "1800-180-1111",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },
  {
    name: "Atal Pension Yojana",
    category: "social-security",
    description: "Pension scheme for workers in unorganized sector guaranteeing minimum monthly pension of ₹1,000 to ₹5,000 after age 60.",
    eligibility: ["Age 18-40 years", "Bank account holder", "Not covered under EPF/ESIC/NPS"],
    documents: ["Aadhaar Card", "Bank Account Details", "Mobile Number"],
    applicationUrl: "https://enps.nsdl.com",
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["unorganized-workers", "self-employed"],
    keywords: ["pension", "atal", "retirement", "saving", "unorganized"],
    helplineNumber: "1800-110-069",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },

  // ─── Finance & Banking ─────────────────────────────────────────────────────
  {
    name: "Pradhan Mantri Jan Dhan Yojana",
    category: "finance",
    description: "Financial inclusion programme ensuring basic banking facilities to unbanked population. Zero balance bank account with RuPay debit card.",
    eligibility: ["All Indian citizens", "No existing bank account required", "Age 10 years and above"],
    documents: ["Aadhaar Card", "PAN Card (optional)", "Passport Photo"],
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["rural", "bpl", "unbanked"],
    keywords: ["bank", "account", "jan dhan", "financial inclusion", "zero balance"],
    helplineNumber: "1800-11-0001",
    isActive: true,
    benefitType: "financial",
    launchYear: 2014,
  },
  {
    name: "Sukanya Samriddhi Yojana",
    category: "finance",
    description: "Small savings instrument for the benefit of a girl child. High interest rate scheme (8.2% p.a.) with tax benefits.",
    eligibility: ["Girl child below 10 years of age", "Parents/guardian of girl child"],
    documents: ["Birth Certificate of girl child", "Aadhaar Card of parent/guardian", "Address Proof"],
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["girls", "children", "general"],
    keywords: ["savings", "girl", "sukanya", "investment", "daughter"],
    helplineNumber: "1800-266-6868",
    isActive: true,
    benefitType: "financial",
    launchYear: 2015,
  },

  // ─── Digital ───────────────────────────────────────────────────────────────
  {
    name: "DigiLocker",
    category: "digital",
    description: "Digital document wallet allowing citizens to store, share, and verify government-issued documents digitally. Accepted as original documents.",
    eligibility: ["All Indian citizens with mobile number and Aadhaar"],
    documents: ["Aadhaar Card", "Mobile Number (linked to Aadhaar)"],
    applicationUrl: "https://digilocker.gov.in",
    ministry: "Ministry of Electronics and IT",
    targetBeneficiaries: ["general", "students", "youth"],
    keywords: ["digital", "documents", "locker", "certificate", "digilocker"],
    helplineNumber: "1800-111-555",
    isActive: true,
    benefitType: "other",
    launchYear: 2015,
  },
  {
    name: "UMANG App",
    category: "digital",
    description: "Unified Mobile Application for New-age Governance — single platform for 1200+ government services on mobile.",
    eligibility: ["All Indian citizens"],
    applicationUrl: "https://web.umang.gov.in",
    ministry: "Ministry of Electronics and IT",
    targetBeneficiaries: ["general"],
    keywords: ["mobile", "app", "umang", "digital", "government services"],
    helplineNumber: "1800-11-5246",
    isActive: true,
    benefitType: "other",
    launchYear: 2017,
  },
  {
    name: "PM Wani (Wi-Fi Access Network Interface)",
    category: "digital",
    description: "Public Wi-Fi scheme to expand broadband connectivity across India through Public Data Offices.",
    eligibility: ["All Indian citizens"],
    ministry: "Department of Telecommunications",
    targetBeneficiaries: ["general", "rural", "youth"],
    keywords: ["wifi", "internet", "broadband", "connectivity", "digital"],
    isActive: true,
    benefitType: "other",
    launchYear: 2020,
  },

  // ─── Women & Child ─────────────────────────────────────────────────────────
  {
    name: "Pradhan Mantri Matru Vandana Yojana",
    category: "social-security",
    description: "Maternity benefit programme providing ₹5,000 cash incentive to pregnant women for first living child.",
    eligibility: ["Pregnant women 19 years and above", "First child birth", "Government/PSU employees excluded"],
    documents: ["Aadhaar Card", "MCP Card", "Bank Account Details", "Pregnancy Registration"],
    applicationUrl: "https://pmmvy.wcd.gov.in",
    ministry: "Ministry of Women and Child Development",
    targetBeneficiaries: ["women", "pregnant"],
    keywords: ["maternity", "pregnancy", "women", "mother", "benefit"],
    helplineNumber: "1800-111-800",
    isActive: true,
    benefitType: "financial",
    launchYear: 2017,
  },
  {
    name: "Poshan Abhiyaan (National Nutrition Mission)",
    category: "health",
    description: "Mission to improve nutritional status of children, pregnant women, and lactating mothers by 2022.",
    eligibility: ["Children 0-6 years", "Pregnant women", "Lactating mothers"],
    documents: ["Aadhaar Card", "Birth Certificate"],
    ministry: "Ministry of Women and Child Development",
    targetBeneficiaries: ["children", "women", "pregnant"],
    keywords: ["nutrition", "poshan", "child", "health", "malnutrition"],
    helplineNumber: "1800-111-800",
    isActive: true,
    benefitType: "health",
    launchYear: 2018,
  },

  // ─── Identity & Documents ─────────────────────────────────────────────────
  {
    name: "Aadhaar Enrollment/Update",
    category: "digital",
    description: "Biometric identity enrollment or update service providing a 12-digit unique identity number to Indian residents.",
    eligibility: ["All Indian residents (any age)"],
    documents: ["Proof of Identity (Passport/Voter ID/PAN)", "Proof of Address", "Date of Birth Proof"],
    applicationUrl: "https://uidai.gov.in",
    ministry: "Ministry of Electronics and IT",
    targetBeneficiaries: ["general"],
    keywords: ["aadhaar", "identity", "biometric", "UID", "enrollment"],
    helplineNumber: "1947",
    isActive: true,
    benefitType: "other",
    launchYear: 2010,
  },
  {
    name: "Voter ID Card (EPIC)",
    category: "digital",
    description: "Elector's Photo Identity Card registration for eligible Indian citizens to exercise voting rights.",
    eligibility: ["Indian citizen", "Age 18 years and above", "Ordinary resident"],
    documents: ["Proof of Age", "Proof of Address", "Passport Photo"],
    applicationUrl: "https://voterportal.eci.gov.in",
    ministry: "Election Commission of India",
    targetBeneficiaries: ["general"],
    keywords: ["voter", "election", "EPIC", "voting", "identity"],
    helplineNumber: "1950",
    isActive: true,
    benefitType: "other",
    launchYear: 1993,
  },

  // ─── Senior Citizens ─────────────────────────────────────────────────────
  {
    name: "Indira Gandhi National Old Age Pension Scheme",
    category: "social-security",
    description: "Monthly pension of ₹200-500 to senior citizens aged 60+ from BPL families.",
    eligibility: ["Age 60 years and above", "BPL household member"],
    documents: ["Aadhaar Card", "Age Proof", "BPL Certificate", "Bank Account Details"],
    ministry: "Ministry of Rural Development",
    targetBeneficiaries: ["senior-citizens", "bpl", "rural"],
    keywords: ["pension", "old age", "senior", "elderly", "BPL"],
    helplineNumber: "1800-111-555",
    isActive: true,
    benefitType: "financial",
    launchYear: 1995,
  },
  {
    name: "Senior Citizens Savings Scheme",
    category: "finance",
    description: "Government-backed savings scheme for senior citizens offering 8.2% interest per annum with tax benefits.",
    eligibility: ["Age 60 years and above", "Retired defense personnel aged 50+"],
    documents: ["Aadhaar Card", "Age Proof", "PAN Card", "Bank Account Details"],
    ministry: "Ministry of Finance",
    targetBeneficiaries: ["senior-citizens"],
    keywords: ["savings", "senior", "elderly", "interest", "investment"],
    helplineNumber: "1800-266-6868",
    isActive: true,
    benefitType: "financial",
    launchYear: 2004,
  },

  // ─── Disability ──────────────────────────────────────────────────────────
  {
    name: "Unique Disability ID (UDID)",
    category: "social-security",
    description: "Unique Disability Identity Card providing access to disability-specific government benefits and schemes.",
    eligibility: ["Persons with Disabilities (40% or more disability)"],
    documents: ["Aadhaar Card", "Medical Certificate from Government Hospital", "Passport Photo"],
    applicationUrl: "https://swavlambancard.gov.in",
    ministry: "Ministry of Social Justice and Empowerment",
    targetBeneficiaries: ["disabled"],
    keywords: ["disability", "UDID", "handicap", "disabled", "special needs"],
    helplineNumber: "1800-11-4515",
    isActive: true,
    benefitType: "other",
    launchYear: 2014,
  },
];

async function seedServices() {
  const uri = MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const existing = await Service.countDocuments();
    console.log(`📊 Existing services: ${existing}`);

    let inserted = 0;

    for (const serviceData of SERVICES) {
      await Service.findOneAndUpdate(
        { name: serviceData.name },
        serviceData,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      inserted++;
    }

    const total = await Service.countDocuments();
    console.log(`✅ Seeding complete!`);
    console.log(`   📥 Upserted: ${inserted}`);
    console.log(`   📊 Total services: ${total}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedServices();

