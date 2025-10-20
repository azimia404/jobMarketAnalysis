import express from "express";
import axios from "axios";
import cors from "cors";
import * as cheerio from "cheerio";

const categories: Record<string, string[]> = {
  "JavaScript": ["javascript", "js", "джс", "javascript"],
  "TypeScript": ["typescript", "ts"],
  "Python": ["python", "питон", "Python"],
  "Java": ["java", "явa"],
  "C#": ["c#", ".net", "дотнет"],
  "Go": ["golang", "го"],
  "PHP": ["php", "пи-аш-пи"],
  "Ruby": ["ruby", "руби"],
  "Kotlin": ["kotlin", "котлин"],
  "Swift": ["swift", "свифт"],
  "Node.js": ["node", "node.js", "ноде"],
  "Frontend": ["frontend", "фронтенд"],
  "Backend": ["backend", "бекенд", "бэкенд"],
  "React": ["react", "реакт"],
  "Vue": ["vue", "вью"],
  "Angular": ["angular", "ангуляр"],
  "Flutter": ["flutter", "флаттер"],
  "SQL": ["sql", "sql"],
  "Data Analyst": ["аналитик", "analyst", "data engineer"],
  "Designer": ["ui/ux", "ui", "ux", "designer", "дизайнер"],
  "Product Manager": ["product manager", "manager", "project manager"],
  "Marketing": ["marketing", "маркетинг"],
  "HR": ["hr"],
};

const app = express();
const PORT = 5000;

app.use(cors());

app.get("/jobs", async (req, res) => {
  try {
    const response = await axios.get("https://devkg.com/ru/jobs");
    const html = response.data;
    
    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Select all divs with class "jobs-item-field position"
    const titles: string[] = [];
    $("div.jobs-item-field.position").each((_, el) => {
      const title = $(el).text().trim();
      if (title) titles.push(title);
      console.dir(title);
    });

    const counts: Record<string, number> = {};
    const countsTitles: Record<string, string[]> = {};
    Object.keys(categories).forEach(cat => counts[cat] = 0);
    counts["Other"] = 0;
    Object.keys(categories).forEach(cat => countsTitles[cat] = []);
    countsTitles["Other"] = [];

    for (const title of titles) {
        const lowerTitle = title
            .toLowerCase()                  // нижний регистр
            .replace(/\n/g, " ")            // убрать переносы
            .replace(/\s+/g, " ")           // убрать лишние пробелы
            .trim();
            
        let matched = false;
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerTitle.includes(keyword))) {
                if (counts[category] != undefined) {
                    counts[category] += 1;
                    countsTitles[category]?.push(title);
                    matched = true;
                    break;
                }
            }
        }
        if(!matched) {
            counts["Other"] += 1;
            countsTitles["Other"]?.push(title);
        }
    }

    console.dir(countsTitles);
    // Send JSON to frontend
    res.json({ counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
