import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding THE ULTIMATE Global Industry Templates...");

  const industries = [
    {
      name: "IT / Software",
      departments: ["Software Development", "DevOps & Cloud", "Quality Assurance (QA)", "UI/UX Design", "Product Management", "HR & Talent Acquisition", "Finance & Payroll", "Cyber Security", "AI/ML Research"],
      designations: [
        { title: "Intern", level: 1 },
        { title: "Junior Developer", level: 2 },
        { title: "Software Engineer", level: 3 },
        { title: "Senior Software Engineer", level: 4 },
        { title: "Tech Lead", level: 5 },
        { title: "Engineering Manager", level: 6 },
        { title: "Director of Engineering", level: 8 },
        { title: "CTO / VP Engineering", level: 10 }
      ]
    },
    {
      name: "Healthcare / Medical",
      departments: ["Emergency (ER)", "Outpatient (OPD)", "Radiology", "Pharmacy", "Administration", "Nursing", "Surgery", "Pathology", "ICU"],
      designations: [
        { title: "Medical Intern", level: 1 },
        { title: "Registered Nurse", level: 3 },
        { title: "General Physician", level: 5 },
        { title: "Specialist Consultant", level: 7 },
        { title: "Surgeon", level: 8 },
        { title: "Medical Director", level: 10 }
      ]
    },
    {
      name: "Finance / Banking",
      departments: ["Retail Banking", "Investment Banking", "Compliance", "Risk Management", "Audit", "Wealth Management", "Treasury", "Loans & Credit"],
      designations: [
        { title: "Trainee Accountant", level: 1 },
        { title: "Relationship Manager", level: 3 },
        { title: "Credit Analyst", level: 4 },
        { title: "Compliance Officer", level: 5 },
        { title: "Assistant Branch Manager", level: 6 },
        { title: "Branch Manager", level: 8 },
        { title: "Vice President (Finance)", level: 10 }
      ]
    },
    {
      name: "Telecommunications",
      departments: ["Network Operations", "NOC", "RF Planning", "Billing", "Value Added Services (VAS)", "Infrastructure", "Transmission"],
      designations: [
        { title: "Field Technician", level: 2 },
        { title: "Network Engineer", level: 3 },
        { title: "RF Planning Lead", level: 5 },
        { title: "NOC Manager", level: 7 },
        { title: "Infrastructure Head", level: 9 },
        { title: "CTO", level: 10 }
      ]
    },
    {
      name: "Manufacturing / Automotive",
      departments: ["R&D", "Assembly Line", "Paint Shop", "Quality Control", "Maintenance", "Inventory", "Health & Safety", "Procurement"],
      designations: [
        { title: "Assembly Worker", level: 1 },
        { title: "QC Inspector", level: 3 },
        { title: "Production Supervisor", level: 4 },
        { title: "Mechanical Engineer", level: 5 },
        { title: "Plant Manager", level: 8 },
        { title: "VP Operations", level: 10 }
      ]
    },
    {
      name: "Aviation / Aerospace",
      departments: ["Flight Operations", "Ground Handling", "MRO (Maintenance)", "Safety & Security", "Crew Management", "Cargo Ops"],
      designations: [
        { title: "Ground Staff", level: 2 },
        { title: "Maintenance Engineer", level: 5 },
        { title: "First Officer", level: 7 },
        { title: "Captain / Pilot", level: 9 },
        { title: "Chief Safety Officer", level: 10 }
      ]
    },
    {
      name: "Oil & Gas / Energy",
      departments: ["Exploration", "Drilling", "HSE (Health/Safety)", "Refinery", "Supply Chain", "Geology", "Project Management"],
      designations: [
        { title: "Rig Worker", level: 1 },
        { title: "Safety Officer", level: 3 },
        { title: "Petroleum Engineer", level: 5 },
        { title: "Geologist", level: 6 },
        { title: "Rig Manager", level: 8 },
        { title: "VP Exploration", level: 10 }
      ]
    },
    {
      name: "Media & Entertainment",
      departments: ["Production", "Editorial", "Post-Production", "VFX & Animation", "Casting", "Marketing & PR", "Distribution"],
      designations: [
        { title: "Production Assistant", level: 1 },
        { title: "Content Writer", level: 3 },
        { title: "Editor", level: 5 },
        { title: "Creative Director", level: 8 },
        { title: "Executive Producer", level: 10 }
      ]
    },
    {
      name: "Education / EdTech",
      departments: ["Academic Faculty", "Admissions", "Student Support", "Examination Cell", "Administration", "Curriculum Design", "IT & Support"],
      designations: [
        { title: "Teaching Assistant", level: 1 },
        { title: "Assistant Professor", level: 4 },
        { title: "HOD (Head of Dept)", level: 6 },
        { title: "Registrar", level: 8 },
        { title: "Dean / Principal", level: 10 }
      ]
    },
    {
      name: "Retail / E-commerce",
      departments: ["Sales & Operations", "Inventory", "Supply Chain", "Customer Success", "Cataloging", "Digital Marketing", "Logistics"],
      designations: [
        { title: "Sales Associate", level: 1 },
        { title: "Logistics Coordinator", level: 3 },
        { title: "Store Manager", level: 4 },
        { title: "Category Manager", level: 6 },
        { title: "Area Manager", level: 8 },
        { title: "VP Retail", level: 10 }
      ]
    },
    {
      name: "Hospitality / Tourism",
      departments: ["Front Office", "Housekeeping", "Food & Beverage", "Kitchen", "Maintenance", "Sales", "Guest Relations"],
      designations: [
        { title: "Receptionist", level: 1 },
        { title: "Chef de Partie", level: 4 },
        { title: "Floor Manager", level: 5 },
        { title: "Executive Chef", level: 8 },
        { title: "General Manager", level: 10 }
      ]
    },
    {
      name: "Real Estate / Construction",
      departments: ["Architecture", "Civil Engineering", "Site Management", "Project Management", "Legal", "Sales & Marketing", "Procurement"],
      designations: [
        { title: "Draftsman", level: 1 },
        { title: "Site Engineer", level: 4 },
        { title: "Project Architect", level: 6 },
        { title: "Sales Director", level: 8 },
        { title: "Project VP", level: 10 }
      ]
    },
    {
      name: "Logistics / Supply Chain",
      departments: ["Fleet Management", "Warehouse", "Customs & Compliance", "Last Mile Delivery", "Inventory Control", "Procurement"],
      designations: [
        { title: "Dispatcher", level: 2 },
        { title: "Warehouse Supervisor", level: 4 },
        { title: "Fleet Manager", level: 6 },
        { title: "Logistics Head", level: 9 },
        { title: "VP Supply Chain", level: 10 }
      ]
    },
    {
      name: "Agriculture / Food Tech",
      departments: ["Farming Operations", "R&D", "Food Processing", "Quality Assurance", "Supply Chain", "Export / Import"],
      designations: [
        { title: "Farm Supervisor", level: 2 },
        { title: "Agronomist", level: 5 },
        { title: "Food Technologist", level: 6 },
        { title: "Production Head", level: 8 },
        { title: "VP Agriculture", level: 10 }
      ]
    },
    {
      name: "Legal / Consulting",
      departments: ["Corporate Law", "Litigation", "Intellectual Property (IP)", "Taxation", "Compliance", "Business Consulting"],
      designations: [
        { title: "Paralegal", level: 1 },
        { title: "Legal Associate", level: 4 },
        { title: "Senior Associate", level: 6 },
        { title: "Partner", level: 8 },
        { title: "Managing Partner", level: 10 }
      ]
    },
    {
      name: "Government / NGO",
      departments: ["Program Management", "Fundraising", "Public Relations", "Finance & Compliance", "Volunteer Management", "Field Operations"],
      designations: [
        { title: "Field Officer", level: 1 },
        { title: "Program Coordinator", level: 4 },
        { title: "Development Manager", level: 6 },
        { title: "Country Director", level: 10 }
      ]
    }
  ];

  for (const ind of industries) {
    await prisma.industryType.upsert({
      where: { name: ind.name },
      update: {},
      create: {
        name: ind.name,
        departments: {
          create: ind.departments.map(d => ({ name: d }))
        },
        designations: {
          create: ind.designations.map(d => ({ title: d.title, level: d.level }))
        }
      }
    });
    console.log(`✅ Seeded Industry: ${ind.name}`);
  }

  console.log("\n🌍 THE ULTIMATE GLOBAL HRMS STARTER KIT IS READY!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
