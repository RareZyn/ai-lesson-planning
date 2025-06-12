// src/utils/aiSimulation.js

// This file simulates a call to a real AI model.
// It now returns a structured object instead of raw HTML.

export const generateAiLessonPlan = (formData) => {
  console.log('Generating structured plan with data:', formData);

  // The AI "thinks" for 1.5 seconds to simulate a network request
  return new Promise(resolve => {
    setTimeout(() => {
      let planObject = {};
      
      // The AI selects a template based on the lesson number
      if (formData.lessonNumber === '51') {
        planObject = {
          preLesson: `Activity: "Safety Word Web"\n1. Write "Feeling Safe at School" in the center of the whiteboard.\n2. Ask students to think-pair-share words or ideas that come to mind (e.g., friendly students, good lighting, no bullying).\n3. Create a word web on the board with student responses.`,
          lessonDelivery: `Activity 1: Problem Identification (Group Discussion)\nIn groups of 4, discuss and list 2-3 potential safety issues in our school on Mahjong paper.\n\nActivity 2: Solution Proposal (Visual Aid Creation)\nFor each problem, brainstorm and draw a simple solution on the poster. This targets the Main Skill.\n\nActivity 3: Gallery Walk & Evaluation\nGroups paste their posters. Students walk around, view the posters, and choose one solution from another group they feel is most effective, then justify their choice.`,
          postLesson: `Activity: "Class Priority Vote"\n1. Conduct a quick show-of-hands poll for the top 3 solutions.\n2. Wrap-up by asking: "What is one thing we, as students, can start doing tomorrow to make our school safer?"`
        };
      } else {
        // Fallback for other lesson numbers
        planObject = {
          preLesson: `A pre-lesson activity for Lesson ${formData.lessonNumber} would be generated here.`,
          lessonDelivery: `The main lesson activities for "${formData.specificTopic}" would be generated here, focusing on the appropriate Learning Standards.`,
          postLesson: `A post-lesson or closure activity would be generated here.`
        };
      }

      resolve(planObject);
    }, 1500);
  });
};