const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const receiveArray = async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Reply only with an array in valid JSON format, no explanation.",
        },
        { role: "user", content: "What is the best programming language?" },
      ],
    });

    const rawMessage = response.choices[0].message.content;

    // Parse the string into a real array
    const parsedArray = JSON.parse(rawMessage);

    res.status(200).json({
      success: true,
      array: parsedArray,
    });
  } catch (error) {
    console.error("Parsing or OpenAI error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const receiveJson = async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Reply only with a JSON object. No explanation. Just return the object.",
        },
        {
          role: "user",
          content:
            "Give me a lesson plan with fields: preActivity, activity, postActivity, objective, and successCriteria.",
        },
      ],
    });

    const rawMessage = response.choices[0].message.content;

    let parsedJson;
    try {
      parsedJson = JSON.parse(rawMessage);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return res.status(500).json({
        success: false,
        message: "OpenAI did not return valid JSON",
        raw: rawMessage,
      });
    }

    res.status(200).json({
      success: true,
      data: parsedJson,
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


module.exports = { receiveArray,receiveJson };
