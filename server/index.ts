import express from "express";
import axios from "axios";
import cors from "cors";
import * as cheerio from "cheerio";

const categories: Record<string, string[]> = {
  // Языки и технологии
  "JavaScript": ["javascript", "js", "джс"],
  "TypeScript": ["typescript", "ts", "тайпскрипт"],
  "Python": ["python", "питон", "fast api", "django", "flask"],
  "Java": ["java", "явa", "spring"],
  "C#": ["c#", ".net", "дотнет", "blazor"],
  "C++": ["c++", "cpp", "qt"],
  "Go": ["golang", "го"],
  "PHP": ["php", "laravel"],
  "Ruby": ["ruby", "руби", "rails"],
  "Kotlin": ["kotlin", "котлин", "android"],
  "Swift": ["swift", "свифт", "ios", "macos"],
  "Node.js": ["node", "node.js", "nodejs", "ноде"],
  "Frontend": ["frontend", "front-end", "фронтенд"],
  "Backend": ["backend", "бекенд", "бэкенд", "разработчик", "developer"],
  "Fullstack": ["fullstack", "full stack", "full - stack", "full-stack"],
  "React": ["react", "реакт", "react native"],
  "Vue": ["vue", "вью"],
  "Angular": ["angular", "ангуляр"],
  "Flutter": ["flutter", "флаттер"],
  "SQL / Database": ["sql", "mysql", "postgresql", "data engineer", "database"],
  "DevOps": ["devops", "sre", "aws", "gcp", "docker", "kubernetes", "ci/cd"],
  "QA": ["qa", "tester", "test", "manual", "automation", "cypress", "selenium"],
  "Data Science / ML": ["data scientist", "machine learning", "ml", "ai", "аналитик", "аналитика", "data engineer", "data analyst"],
  "iOS": ["ios", "macos", "swift"],
  "Android": ["android", "kotlin"],
  "Unity": ["unity"],
  "1C": ["1c", "1с"],

  // Управленческие / непрофильные позиции
  "Project Manager / Product Manager": ["project manager", "pm", "scrum master", "agile", "product manager", "продакт менеджер", "проектный менеджер"],
  "HR / Recruiter": ["hr", "human resources", "recruiter", "it-рекрутер", "it recruiter", "кадровик"],
  "Business Analyst": ["business analyst", "ba", "аналитик бизнеса", "бизнес-аналитик"],
  "Marketing / SMM": ["marketing", "smm", "digital маркетолог", "маркетолог"],
  "Design / UIUX": ["designer", "ui/ux", "graphic designer", "web designer", "дизайнер", "ui/ux-дизайнер"],
  "Finance / Accounting": ["бухгалтер", "finance", "accountant", "зарплата", "payroll"],
  "Legal / Lawyer": ["юрист", "lawyer", "legal"]
};


async function fetchAllJobs() {
  const allTitles: string[] = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const url = `https://devkg.com/ru/jobs?page=${page}`;
    console.log(`Fetching ${url}`);

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Проверяем наличие архива
    if ($("a.link.archived").length > 0) {
      console.log("Found archived link — stopping iteration.");
      break;
    }

    // Собираем все вакансии на странице
    $("div.jobs-item-field.position").each((_, el) => {
      const title = $(el).text().trim();
      if (title) allTitles.push(title);
    });

    page += 1; // переход к следующей странице
  }

  return allTitles;
}


const app = express();
const PORT = 5000;

app.use(cors());

app.get("/jobs", async (req, res) => {
  try {
    const response = await axios.get("https://devkg.com/ru/jobs");
    const html = response.data;

    // Select all divs with class "jobs-item-field position"
    const titles: string[] = await fetchAllJobs();

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
