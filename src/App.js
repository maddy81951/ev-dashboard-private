import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";

const COLORS = ['#0ea5e9', '#10b981', '#facc15', '#ef4444', '#a855f7'];

function App() {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [makeOptions, setMakeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [countyOptions, setCountyOptions] = useState([]);

  const [selectedMake, setSelectedMake] = useState("All");
  const [selectedModel, setSelectedModel] = useState("All");
  const [selectedCounty, setSelectedCounty] = useState("All");

  const [makeData, setMakeData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [rangeData, setRangeData] = useState([]);
  const [yearData, setYearData] = useState([]);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [expanded, setExpanded] = useState({});

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const toggleCard = (title) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    fetch("/Electric_Vehicle_Population_Data.csv")
      .then((res) => res.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          complete: (results) => {
            const cleaned = results.data.filter(row =>
              row.Make && row.Model && row["Electric Vehicle Type"]
            );
            setRawData(cleaned);
            setFilteredData(cleaned);
            setMakeOptions(["All", ...new Set(cleaned.map(row => row.Make))]);
            setCountyOptions(["All", ...new Set(cleaned.map(row => row.County))]);
          },
        });
      });
  }, []);

  useEffect(() => {
    const models = rawData
      .filter(row => selectedMake === "All" || row.Make === selectedMake)
      .map(row => row.Model);
    setModelOptions(["All", ...new Set(models)]);
  }, [rawData, selectedMake]);

  useEffect(() => {
    let filtered = rawData;
    if (selectedMake !== "All") filtered = filtered.filter(row => row.Make === selectedMake);
    if (selectedModel !== "All") filtered = filtered.filter(row => row.Model === selectedModel);
    if (selectedCounty !== "All") filtered = filtered.filter(row => row.County === selectedCounty);
    setFilteredData(filtered);
  }, [rawData, selectedMake, selectedModel, selectedCounty]);

  useEffect(() => {
    const makeCount = {}, modelCount = {}, typeCount = {}, cityCount = {}, rangeBuckets = {}, yearCount = {};
    filteredData.forEach(row => {
      makeCount[row.Make] = (makeCount[row.Make] || 0) + 1;
      const modelKey = `${row.Make} ${row.Model}`;
      modelCount[modelKey] = (modelCount[modelKey] || 0) + 1;
      const type = row["Electric Vehicle Type"];
      typeCount[type] = (typeCount[type] || 0) + 1;
      cityCount[row.City] = (cityCount[row.City] || 0) + 1;
      const range = parseInt(row["Electric Range"]);
      if (!isNaN(range)) {
        const bucket = Math.floor(range / 50) * 50;
        rangeBuckets[bucket] = (rangeBuckets[bucket] || 0) + 1;
      }
      const year = parseInt(row["Model Year"]);
      if (!isNaN(year)) {
        yearCount[year] = (yearCount[year] || 0) + 1;
      }
    });
    setMakeData(Object.entries(makeCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5));
    setModelData(Object.entries(modelCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10));
    setTypeData(Object.entries(typeCount).map(([name, value]) => ({ name, value })));
    setCityData(Object.entries(cityCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10));
    setRangeData(Object.entries(rangeBuckets).map(([range, value]) => ({ range: `${range}-${+range + 49}`, value })).sort((a, b) => parseInt(a.range) - parseInt(b.range)));
    setYearData(Object.entries(yearCount).map(([year, value]) => ({ year, value })).sort((a, b) => a.year - b.year));
  }, [filteredData]);

  const downloadPDF = () => {
    const input = document.getElementById("dashboard");
    html2canvas(input, { useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("ev-dashboard.pdf");
    });
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 p-6 font-sans">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold">⚡ Electric Vehicle Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Explore trends and metrics from EV population data</p>
        </header>

        <div className="flex flex-wrap gap-4 mb-6 justify-center items-center">
          <Dropdown label="Make" value={selectedMake} options={makeOptions} onChange={setSelectedMake} />
          <Dropdown label="Model" value={selectedModel} options={modelOptions} onChange={setSelectedModel} />
          <Dropdown label="County" value={selectedCounty} options={countyOptions} onChange={setSelectedCounty} />

          <button onClick={toggleTheme} className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Toggle {darkMode ? "Light" : "Dark"} Mode</button>
          <button onClick={downloadPDF} className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Download PDF</button>
        </div>

        <div id="dashboard" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CollapsibleCard title="Top 5 EV Makes" expanded={expanded["Top 5 EV Makes"]} onToggle={() => toggleCard("Top 5 EV Makes")}> <BarChartComp data={makeData} xKey="name" yKey="value" color="#10b981" /></CollapsibleCard>
          <CollapsibleCard title="Top 10 EV Models" expanded={expanded["Top 10 EV Models"]} onToggle={() => toggleCard("Top 10 EV Models")}> <BarChartComp data={modelData} xKey="name" yKey="value" color="#6366f1" /></CollapsibleCard>
          <CollapsibleCard title="EV Type Distribution" expanded={expanded["EV Type Distribution"]} onToggle={() => toggleCard("EV Type Distribution")}> <PieChartComp data={typeData} /></CollapsibleCard>
          <CollapsibleCard title="EVs by City (Top 10)" expanded={expanded["EVs by City"]} onToggle={() => toggleCard("EVs by City")}> <BarChartComp data={cityData} xKey="name" yKey="value" color="#f59e0b" /></CollapsibleCard>
          <CollapsibleCard title="Electric Range Distribution" expanded={expanded["Range Distribution"]} onToggle={() => toggleCard("Range Distribution")}> <BarChartComp data={rangeData} xKey="range" yKey="value" color="#3b82f6" /></CollapsibleCard>
          <CollapsibleCard title="Registrations Over Years" expanded={expanded["Registrations Over Years"]} onToggle={() => toggleCard("Registrations Over Years")}> <LineChartComp data={yearData} xKey="year" yKey="value" /></CollapsibleCard>
        </div>

        <footer className="text-center mt-10 text-sm text-gray-500 dark:text-gray-400">
          Built with ⚛️ React + Tailwind • Internship Dashboard • 2025
        </footer>
      </div>
    </div>
  );
}

export default App;

const Dropdown = ({ label, value, options, onChange }) => (
  <label className="text-black dark:text-white">
    {label}:
    <select className="ml-2 p-2 border rounded text-black" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </label>
);

const CollapsibleCard = ({ title, children, expanded, onToggle }) => (
  <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-4 transition-all duration-300">
    <div
      className="flex items-center justify-between cursor-pointer select-none hover:text-indigo-500"
      onClick={onToggle}
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <svg
        className={`w-5 h-5 transform transition-transform duration-300 ${expanded ? "rotate-90" : "rotate-0"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expanded ? "max-h-[400px] mt-4" : "max-h-0"}`}>
      {expanded && <div className="h-[300px]">{children}</div>}
    </div>
  </div>
);

const BarChartComp = ({ data, xKey, yKey, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
      <YAxis />
      <Tooltip />
      <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} isAnimationActive />
    </BarChart>
  </ResponsiveContainer>
);

const PieChartComp = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label isAnimationActive>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

const LineChartComp = ({ data, xKey, yKey }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey={yKey} stroke="#10b981" strokeWidth={2} isAnimationActive />
    </LineChart>
  </ResponsiveContainer>
);