// backend/scripts/initializeSubmissionStats.js
/**
 * Script to initialize submission statistics for all existing assessments
 * Run this once after deploying the optimization changes
 *
 * Usage: node scripts/initializeSubmissionStats.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('../model/Assessment');

const initializeStats = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    console.log('\nFetching all assessments...');
    const assessments = await Assessment.find({});
    console.log(`✓ Found ${assessments.length} assessments`);

    console.log('\nInitializing submission statistics...\n');

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const assessment of assessments) {
      try {
        process.stdout.write(`Processing: ${assessment.title} ... `);
        await Assessment.updateSubmissionStats(assessment._id);
        console.log('✓');
        successful++;
      } catch (error) {
        console.log('✗');
        failed++;
        errors.push({
          assessmentId: assessment._id,
          title: assessment.title,
          error: error.message,
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total assessments: ${assessments.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.title} (${err.assessmentId})`);
        console.log(`   Error: ${err.error}`);
      });
    }

    console.log('\n✓ Initialization complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the script
initializeStats();
