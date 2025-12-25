// Migration script to add invite codes to existing schools
// Run this once after deploying the new School model

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Import models
const School = require('../model/School');

// Helper function to generate invite code
const generateInviteCode = () => {
    return crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 character code
};

async function addInviteCodesToSchools() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all schools without invite codes
        const schools = await School.find({
            $or: [
                { inviteCode: { $exists: false } },
                { inviteCode: null },
                { inviteCode: '' }
            ]
        });

        console.log(`Found ${schools.length} schools without invite codes`);

        if (schools.length === 0) {
            console.log('✅ All schools already have invite codes');
            process.exit(0);
        }

        let updated = 0;
        let failed = 0;

        for (const school of schools) {
            try {
                let inviteCode = generateInviteCode();

                // Ensure uniqueness
                let exists = await School.findOne({ inviteCode });
                while (exists) {
                    inviteCode = generateInviteCode();
                    exists = await School.findOne({ inviteCode });
                }

                school.inviteCode = inviteCode;
                await school.save();

                console.log(`✅ Updated "${school.name}" with invite code: ${inviteCode}`);
                updated++;
            } catch (error) {
                console.error(`❌ Failed to update "${school.name}":`, error.message);
                failed++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`✅ Successfully updated: ${updated} schools`);
        if (failed > 0) {
            console.log(`❌ Failed: ${failed} schools`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
addInviteCodesToSchools();
