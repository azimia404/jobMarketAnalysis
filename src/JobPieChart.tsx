import React, { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from "recharts";

export const COLORS = [
  "#FF6633", "#FFB399", "#FF33FF", "#FFFF99", "#00B3E6",
  "#E6B333", "#3366E6", "#999966", "#99FF99", "#B34D4D",
  "#80B300", "#809900", "#E6B3B3", "#6680B3", "#66991A",
  "#FF99E6", "#CCFF1A", "#FF1A66", "#E6331A", "#33FFCC",
  "#66994D", "#B366CC", "#4D8000", "#B33300", "#CC80CC",
  "#66664D", "#991AFF", "#E666FF", "#4DB3FF", "#1AB399",
  "#E666B3", "#33991A", "#CC9999", "#B3B31A", "#00E680",
  "#4D8066", "#809980", "#E6FF80", "#1AFF33", "#999933",
  "#FF3380", "#CCCC00", "#66E64D", "#4D80CC", "#9900B3",
  "#E64D66", "#4DB380", "#FF4D4D", "#99E6E6", "#6666FF"
];


export default function JobPieChart() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/jobs") 
      .then(res => res.json())
      .then((counts: Record<string, number>) => {
        const chartData = Object.entries(counts)
          .filter(([_, v]) => {
            console.log(_);
            console.log(v);
            return v > 0;
          })
          .map(([key, value]) => ({ name: key, value }));
        setData(chartData);
      })
      .catch(console.error);
  }, []);

 return (
  <div style={{ width: "100%", height: 1000 }}> {/* фиксированная высота */}
    <h2 style={{ textAlign: "center" }}>Job Categories</h2>
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={160}
          fill="#8884d8"
          label
        >
          {data.map((_, index) => {
            console.log(_ + " " + index);
            return <Cell key={index} fill={COLORS[index % COLORS.length]} />
        })}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

}
