require('dotenv').config(); // Load environment variables (for MongoDB URI and ENCRYPTION_SECRET)
const mongoose = require('mongoose');
const User = require('../model/User'); // Adjust path if your User model is elsewhere
const School = require('../model/School'); // Adjust path if your School model is elsewhere

// --- Configuration for the First Admin ---
const FIRST_SCHOOL_DETAILS = {
  name: "SMK Testing 1",
  address: "Jalan Testing",
  contactEmail: "nijammohd12@gmail.com",
  phone: "012-3456789",
  // Add other school-specific details as per your SchoolSchema
};

const FIRST_ADMIN_DETAILS = {
  name: "Nijam Test school admin",
  email: "nijammohd12@gmail.com",
  password: "Nijam_1324", // THIS WILL BE HASHED. REMEMBER IT FOR LOGIN!
  role: "school_admin",
  // No schoolId here initially, we'll assign it after creating the school
  firebaseUid: "O2Oah2EAMxbl7JZ35XXQgaK8ZCq1", // If you pre-create in Firebase, add it here
};
// --- End Configuration ---

const addFirstSchoolAdmin = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB...");

    // 2. Check if the school already exists to prevent duplicates
    let school = await School.findOne({ name: FIRST_SCHOOL_DETAILS.name });
    if (school) {
      console.log(`School '${FIRST_SCHOOL_DETAILS.name}' already exists with ID: ${school._id}. Skipping creation.`);
    } else {
      // Create the first school
      school = await School.create(FIRST_SCHOOL_DETAILS);
      console.log(`Created new School: ${school.name} (ID: ${school._id})`);
    }

    // 3. Check if the admin user already exists
    let adminUser = await User.findOne({ email: FIRST_ADMIN_DETAILS.email });
    if (adminUser) {
      console.log(`Admin user '${FIRST_ADMIN_DETAILS.email}' already exists with ID: ${adminUser._id}. Skipping creation.`);
    } else {
      // Create the first school admin user
      adminUser = await User.create({
        ...FIRST_ADMIN_DETAILS,
        schoolId: school._id, // Link the admin to the newly created school
        isEmailVerified: true, // Assuming initial admin is verified
      });
      // The pre-save hook in your User model will automatically hash the password

      console.log(`Created new School Admin: ${adminUser.name} (ID: ${adminUser._id})`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`Associated School ID: ${adminUser.schoolId}`);
      console.log(`IMPORTANT: The password for ${adminUser.email} was set to: "${FIRST_ADMIN_DETAILS.password}" and has been hashed. Use this password for initial login.`);
    }
  } catch (error) {
    console.error("Error adding first school admin:", error);
    process.exit(1); // Exit with an error code
  } finally {
    // 4. Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

addFirstSchoolAdmin();