import React, { useState } from "react";
import Papa from "papaparse";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";

function App() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  // When user uploads a CSV file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,        // parse CSV with header row
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);                  // store parsed data
        setHeaders(Object.keys(results.data[0]));  // extract headers (column names)
      },
    });
  };

  // Export chart by rendering the chart div as an image
  const exportChart = (id) => {
    const chart = document.getElementById(id);
    html2canvas(chart).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">CSV Plotter</h1>

      {/* File Upload Input */}
      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-6" />

      {/* Show charts only if data is present and there are at least 2 columns */}
      {data.length > 0 && headers.length >= 2 && (
        <>
          {/* Line Chart */}
          <div id="lineChart" className="mb-6 bg-white p-4 shadow rounded">
            <h2 className="text-xl font-semibold mb-2">Line Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey={headers[0]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={headers[1]} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
            <button onClick={() => exportChart("lineChart")} className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">
              Download Line Chart
            </button>
          </div>

          {/* Bar Chart */}
          <div id="barChart" className="mb-6 bg-white p-4 shadow rounded">
            <h2 className="text-xl font-semibold mb-2">Bar Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey={headers[0]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={headers[1]} fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
            <button onClick={() => exportChart("barChart")} className="mt-2 px-4 py-1 bg-green-500 text-white rounded">
              Download Bar Chart
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;