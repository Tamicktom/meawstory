//* Libraries imports
// import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

//* API imports
import { serverEnv } from "@/env/server";

export const openAI = createOpenAI({
  apiKey: serverEnv.OPENAI_API_KEY,
});

// const { text } = await generateText({
//   model: openAI("gpt-5-mini"),
//   prompt: "What is love?",
// });