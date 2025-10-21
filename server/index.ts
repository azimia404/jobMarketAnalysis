import express from "express";
import axios from "axios";
import cors from "cors";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

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

const cachePath = path.join(process.cwd(), "cache.json");



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



// время жизни кэша (например, 1 час)
const CACHE_TTL = 60 * 60 * 1000;
let memoryCache: { data: any; timestamp: number } | null = null;

const app = express();
const PORT = 5000;
let cache: Record<string, number>;

app.use(cors());

app.get("/jobs", async (req, res) => {
  try {
    // 🔹 1. Проверяем кэш в памяти
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
      console.log("✅ Using in-memory cache");
      return res.json(memoryCache.data);
    }

    // 🔹 2. Проверяем кэш на диске
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (Date.now() - cache.timestamp < CACHE_TTL) {
        console.log("✅ Using cached data from file");
        memoryCache = { data: cache.data, timestamp: cache.timestamp };
        return res.json(cache.data);
      }
    }

    // 🔹 3. Если кэша нет — парсим свежие данные
    console.log("🔄 Fetching fresh data...");

    const response = await axios.get("https://devkg.com/ru/jobs");
    const html = response.data;

    const titles: string[] = await fetchAllJobs(); // твоя функция парсинга

    const counts: Record<string, number> = {};
    const countsTitles: Record<string, string[]> = {};
    Object.keys(categories).forEach(cat => {
      counts[cat] = 0;
      countsTitles[cat] = [];
    });
    counts["Other"] = 0;
    countsTitles["Other"] = [];

    for (const title of titles) {
      const lowerTitle = title
        .toLowerCase()
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      let matched = false;
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerTitle.includes(keyword))) {
          counts[category] = (counts[category] ?? 0) + 1;
          countsTitles[category]?.push(title);
          matched = true;
          break;
        }
      }

      if (!matched) {
        counts["Other"]++;
        countsTitles["Other"].push(title);
      }
    }

    // 🔹 4. Сохраняем кэш
    const cacheData = { timestamp: Date.now(), data: counts  };
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    memoryCache = cacheData;

    console.log("💾 Cached new data to file");
    res.json(cacheData.data);

  } catch (err) {
    console.error("❌ Failed to fetch jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
