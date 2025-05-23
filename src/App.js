import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell
} from "recharts";
import html2canvas from "html2canvas";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

function App() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode class on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
        setHeaders(Object.keys(results.data[0]));
        setSelectedColumns([Object.keys(results.data[0])[1]]); // default select second column
      },
    });
  };

  const handleChartTypeChange = (e) => setChartType(e.target.value);

  const handleColumnToggle = (col) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // Multiple Y axes, auto color
  const renderYAxes = () => selectedColumns.map((col, i) => (
    <YAxis
      key={col}
      yAxisId={col}
      orientation={i % 2 === 0 ? 'left' : 'right'}
      stroke={COLORS[i % COLORS.length]}
    />
  ));

  const renderLines = () => selectedColumns.map((col, i) => (
    <Line key={col} yAxisId={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} />
  ));

  const renderBars = () => selectedColumns.map((col, i) => (
    <Bar key={col} yAxisId={col} dataKey={col} fill={COLORS[i % COLORS.length]} />
  ));

  const renderAreas = () => selectedColumns.map((col, i) => (
    <Area key={col} yAxisId={col} dataKey={col} fill={COLORS[i % COLORS.length]} stroke={COLORS[i % COLORS.length]} />
  ));

  const renderScatters = () => selectedColumns.map((col, i) => (
    <Scatter key={col} yAxisId={col} dataKey={col} fill={COLORS[i % COLORS.length]} />
  ));

  const renderChart = () => {
    switch(chartType) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis
              dataKey={headers[0]}
              tickFormatter={value => value || "—"}
              allowDuplicatedCategory={false}
            />
            {renderYAxes()}
            <Tooltip />
            <Legend />
            {renderLines()}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis
              dataKey={headers[0]}
              tickFormatter={value => value || "—"}
              allowDuplicatedCategory={false}
            />
            {renderYAxes()}
            <Tooltip />
            <Legend />
            {renderBars()}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis
              dataKey={headers[0]}
              tickFormatter={value => value || "—"}
              allowDuplicatedCategory={false}
            />
            {renderYAxes()}
            <Tooltip />
            <Legend />
            {renderAreas()}
          </AreaChart>
        );
      case "scatter":
        return (
          <ScatterChart>
            <CartesianGrid stroke="#ccc" />
            <XAxis
              dataKey={headers[0]}
              tickFormatter={value => value || "—"}
              allowDuplicatedCategory={false}
            />
            {renderYAxes()}
            <Tooltip />
            <Legend />
            {renderScatters()}
          </ScatterChart>
        );
      case "pie":
        const pieData = selectedColumns.map((col, i) => ({
          name: col,
          value: Number(data[0][col]) || 0,
          color: COLORS[i % COLORS.length],
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default: return null;
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">CSV Plotter</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-6 p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
      />

      {data.length > 0 && (
        <>
          <select
            value={chartType}
            onChange={handleChartTypeChange}
            className="mb-4 p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
            <option value="scatter">Scatter Chart</option>
            <option value="pie">Pie Chart</option>
          </select>

          <div className="mb-4">
            <p className="mb-1 font-semibold">Select Columns to Plot:</p>
            {headers.slice(1).map((col) => (
              <label key={col} className="mr-4">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={() => handleColumnToggle(col)}
                  className="mr-1"
                />
                {col}
              </label>
            ))}
          </div>

          <div id="chart" className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <ResponsiveContainer width="100%" height={400}>
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default App;