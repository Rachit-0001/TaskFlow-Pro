const {
    GoogleGenAI
} = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


/*
    Generate an AI dependency suggestion.

    Model fallback order:

    1. gemini-3.8-flash
    2. gemini-3.7-flash
    3. gemini-3.5-flash-lite

    If one model is temporarily unavailable
    (503 / 429), the next model is tried.
*/
const generateDependencySuggestion = async ({
    task,
    candidateTasks
}) => {

    const candidateData =
        candidateTasks.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status
        }));


    const prompt = `
You are an AI assistant for a project
dependency management system.

Determine whether the TARGET TASK should
depend on one of the CANDIDATE TASKS.

TARGET TASK:
${JSON.stringify(task)}

CANDIDATE TASKS:
${JSON.stringify(candidateData)}

Return ONLY valid JSON using exactly this structure:

{
    "suggestedTaskId": number or null,
    "confidence": number,
    "reason": "short explanation"
}

Rules:

1. suggestedTaskId must be one of the
   candidate task IDs or null.

2. confidence must be between 0 and 1.

3. If no meaningful dependency exists,
   return suggestedTaskId as null.

4. Do not suggest the target task itself.

5. Keep the reason concise.

6. Do not return markdown.

7. Do not return extra text.
`;


    /*
        Gemini model fallback list.
    */

    const models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash-lite"
    ];


    let lastError = null;


    /*
        Try each model.
    */

    for (const modelName of models) {

        try {

            console.log(
                `Trying Gemini model: ${modelName}`
            );


            const response =
                await ai.models.generateContent({

                    model: modelName,

                    contents: prompt,

                    config: {

                        responseMimeType:
                            "application/json",

                        responseSchema: {

                            type: "object",

                            properties: {

                                suggestedTaskId: {
                                    type: "integer",
                                    nullable: true
                                },

                                confidence: {
                                    type: "number"
                                },

                                reason: {
                                    type: "string"
                                }

                            },

                            required: [
                                "suggestedTaskId",
                                "confidence",
                                "reason"
                            ]
                        },

                        maxOutputTokens: 200
                    }
                });


            /*
                Get Gemini response text.
            */

            const text =
                response.text.trim();


            /*
                Convert JSON string into
                JavaScript object.
            */

            const result =
                JSON.parse(text);


            console.log(
                `Gemini model succeeded: ${modelName}`
            );


            return result;


        } catch (error) {

            lastError = error;


            console.error(
                `Gemini ${modelName} failed:`,
                error.message
            );


            /*
                Get HTTP status.
            */

            const status =
                error.status ||
                error.code;


            /*
                503 = temporary model/service issue
                429 = rate limit / capacity issue

                In both cases, try the next model.
            */

            if (
                status === 503 ||
                status === 429
            ) {

                console.log(
                    `Trying fallback Gemini model...`
                );

                continue;
            }


            /*
                Other errors are not treated
                as temporary model problems.
            */

            throw error;
        }
    }


    /*
        All models failed.
    */

    throw lastError;
};


module.exports = {
    generateDependencySuggestion
};