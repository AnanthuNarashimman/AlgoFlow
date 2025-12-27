require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are an expert algorithm visualizer that creates flowcharts from code.
Your goal is to parse the provided code and return a JSON object representing a flowchart.

### STRICT OUTPUT SCHEMA (JSON ONLY):
{
  "nodes": [
    { "id": "1", "type": "input", "label": "Start", "data": { "label": "Start" } },
    { "id": "2", "type": "default", "label": "a = int(input())", "data": { "label": "a = int(input())" } },
    { "id": "3", "type": "decision", "label": "a % 2 == 0?", "data": { "label": "a % 2 == 0?" } },
    { "id": "4", "type": "output", "label": "Return True", "data": { "label": "Return True" } },
    { "id": "5", "type": "output", "label": "Return False", "data": { "label": "Return False" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" },
    { "id": "e3-4", "source": "3", "target": "4", "label": "True" },
    { "id": "e3-5", "source": "3", "target": "5", "label": "False" }
  ],
  "meta": {
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "explanation": "Brief summary of what this code does."
  }
}

### CRITICAL RULES:
1. **Node Types**:
   - Use 'input' ONLY for the START node
   - Use 'output' for return statements or final print statements
   - Use 'decision' for if/elif/else conditions and loop conditions (while/for)
   - Use 'default' for variable assignments, function calls, and operations

2. **Decision Nodes (IF/ELSE)**:
   - Decision nodes MUST have exactly TWO outgoing edges
   - One edge labeled "True" going to the true branch
   - One edge labeled "False" going to the false/else branch
   - Both branches should eventually merge or end separately

3. **Loop Nodes (WHILE/FOR)**:
   - Loop condition is a 'decision' node
   - Edge labeled "True" goes INTO the loop body
   - Edge labeled "False" EXITS the loop
   - Last statement in loop body must connect BACK to the loop condition

4. **Sequential Flow**:
   - Statements that execute in sequence should be connected with unlabeled edges
   - Each node should have only ONE incoming edge (except loop conditions and merge points)

5. **Node IDs**: Use simple string IDs ("1", "2", "3", etc.) - never duplicate IDs

6. **Output Format**: Return ONLY raw JSON. No markdown, no code blocks, no explanations.

### EXAMPLE FOR IF/ELSE:
Code: if x > 5: return "big" else: return "small"
Correct edges:
- Decision node "x > 5?" → "Return big" with label "True"
- Decision node "x > 5?" → "Return small" with label "False"

### EXAMPLE FOR LOOP:
Code: while i < n: i += 1
Correct edges:
- "i < n?" → "i += 1" with label "True"
- "i += 1" → back to "i < n?" (no label)
- "i < n?" → next statement with label "False"
`;

app.post('/api/generate', async(req, res) => {
    try {
        const {code} = req.body;

        if(!code) {
            return res.status(400).json({error: "No code provided"});
        }

        console.log("Analuzing code...");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent([
            SYSTEM_PROMPT,
            `Analuze this code:\n${code}`
        ]);


        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        console.log("Flowchart generated successfully!");
        res.json(data);
    } catch (error) {
        console.error("Server Error:", error);
        req.status(500).json({
            error: "Failed to generate flowchart",
            details: error.message
        });
    }
});


app.listen(PORT, () => {
    console.log(`AlgoFlow Backend running on http://localhost:${PORT}`);
})