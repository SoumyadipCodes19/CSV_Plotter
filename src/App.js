import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

function App() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [zoomDomain, setZoomDomain] = useState({ start: 0, end: 10 });
  const [xAxisStrategy, setXAxisStrategy] = useState("auto"); // auto, sparse, sample, none

  useEffect(() => {
    const html = document.documentElement;
    darkMode ? html.classList.add("dark") : html.classList.remove("dark");
  }, [darkMode]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        // Trim all string values in every row & every column
        const cleanedData = results.data.map(row => {
          const trimmedRow = {};
          Object.entries(row).forEach(([key, val]) => {
            trimmedRow[key] = typeof val === "string" ? val.trim() : val;
          });
          return trimmedRow;
        });
        setData(cleanedData);

        if (results.data.length > 0) {
          const cols = Object.keys(results.data[0]);
          setHeaders(cols);

          // Select the second column by default if exists, else empty
          setSelectedColumns(cols.length > 1 ? [cols[1]] : []);

          setZoomDomain({ start: 0, end: cleanedData.length - 1 });
        }
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
      }
    });
  };

  const handleChartTypeChange = (e) => setChartType(e.target.value);

  const handleColumnToggle = (col) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // Zoom In: Shrink range by removing 1/4th from both ends
  const handleZoomIn = () => {
    setZoomDomain(prev => {
      const range = prev.end - prev.start;
      if (range <= 2) return prev; // Prevent zooming in too far
      const increment = Math.ceil(range / 4);
      const newStart = prev.start + increment;
      const newEnd = prev.end - increment;
      if (newStart >= newEnd) return prev; // Prevent invalid range
      return {
        start: newStart,
        end: newEnd,
      };
    });
  };

  // Zoom Out: Expand range by adding half of current range to ends
  const handleZoomOut = () => {
    setZoomDomain(prev => {
      const range = prev.end - prev.start;
      const increment = Math.ceil(range / 2);
      const newStart = Math.max(0, prev.start - increment);
      const newEnd = Math.min(data.length - 1, prev.end + increment);
      return {
        start: newStart,
        end: newEnd,
      };
    });
  };

  const handleResetZoom = () => {
    setZoomDomain({ start: 0, end: data.length - 1 });
  };

  // Calculate data ranges for better Y-axis scaling
  const getDataRange = (data, column) => {
    const values = data.map(d => Number(d[column])).filter(v => !isNaN(v));
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  };

  // Smart interval calculation for X-axis ticks
  const calculateTickInterval = (dataLength, chartWidth = 800) => {
    const maxTicks = Math.floor(chartWidth / 100); // Assume each tick needs ~100px for readability
    
    if (dataLength <= maxTicks) {
      return 0; // Show all ticks
    }
    
    // Calculate interval to show approximately maxTicks
    const interval = Math.ceil(dataLength / maxTicks);
    return interval - 1; // Recharts uses 0-based interval
  };

  // Sample data for better performance with large datasets
  const sampleData = (data, maxPoints = 1000) => {
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    const sampled = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
    
    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1]);
    }
    
    return sampled;
  };

  // Render Y axes for all selected columns, with better scaling
  const renderYAxes = (chartData) => selectedColumns.map((col, i) => {
    const [min, max] = getDataRange(chartData, col);
    return (
      <YAxis
        key={col}
        yAxisId={col}
        orientation={i % 2 === 0 ? 'left' : 'right'}
        stroke={COLORS[i % COLORS.length]}
        domain={[min, max]}
        allowDataOverflow={false}
        tickFormatter={(value) => formatValue(value)}
      />
    );
  });

  const renderLines = () => selectedColumns.map((col, i) => (
    <Line
      key={col}
      yAxisId={col}
      type="monotone"
      dataKey={col}
      stroke={COLORS[i % COLORS.length]}
      strokeWidth={2}
      dot={false}
      isAnimationActive={false}
      connectNulls={false}
    />
  ));

  const renderBars = () => selectedColumns.map((col, i) => (
    <Bar
      key={col}
      yAxisId={col}
      dataKey={col}
      fill={COLORS[i % COLORS.length]}
      isAnimationActive={false}
    />
  ));

  const renderAreas = () => selectedColumns.map((col, i) => (
    <Area
      key={col}
      yAxisId={col}
      dataKey={col}
      fill={COLORS[i % COLORS.length]}
      stroke={COLORS[i % COLORS.length]}
      fillOpacity={0.6}
      isAnimationActive={false}
      connectNulls={false}
    />
  ));

  const renderScatters = () => selectedColumns.map((col, i) => (
    <Scatter
      key={col}
      yAxisId={col}
      dataKey={col}
      fill={COLORS[i % COLORS.length]}
      isAnimationActive={false}
    />
  ));

  // Analyze the X-axis column to determine data pattern and create descriptive name
  const analyzeXAxisColumn = () => {
    if (!data.length || !headers.length) return headers[0] || "X-Axis";
    
    const columnName = headers[0];
    const values = data.map(row => row[columnName]).filter(val => val != null);
    
    if (values.length === 0) return columnName;
    
    // Check if values are dates
    const dateValues = values.filter(val => val instanceof Date || !isNaN(Date.parse(val)));
    if (dateValues.length > values.length * 0.8) {
      return `${columnName} (Timeline)`;
    }
    
    // Check if values are numeric
    const numericValues = values.filter(val => !isNaN(Number(val)));
    if (numericValues.length > values.length * 0.8) {
      const nums = numericValues.map(val => Number(val));
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const range = max - min;
      
      if (range === 0) {
        return `${columnName} (Constant: ${min})`;
      } else if (nums.length > 1) {
        // Check if it's a sequence (like years, months, etc.)
        const sorted = [...nums].sort((a, b) => a - b);
        const differences = [];
        for (let i = 1; i < sorted.length; i++) {
          differences.push(sorted[i] - sorted[i-1]);
        }
        const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
        
        if (avgDiff > 0 && avgDiff < 1) {
          return `${columnName} (Range: ${min.toFixed(2)} - ${max.toFixed(2)})`;
        } else if (Number.isInteger(avgDiff) && avgDiff > 0) {
          return `${columnName} (Sequence: +${Math.round(avgDiff)})`;
        } else {
          return `${columnName} (Range: ${min} - ${max})`;
        }
      }
    }
    
    // Check if values are categorical (strings with repetition)
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length < values.length * 0.5 && uniqueValues.length > 1) {
      return `${columnName} (${uniqueValues.length} Categories)`;
    }
    
    // Default case - just show the column name with data type hint
    const sampleValue = values[0];
    if (typeof sampleValue === 'string') {
      return `${columnName} (Text)`;
    }
    
    return columnName;
  };

  // Custom tick formatter for X-axis to handle long labels and dates
  const formatXAxisTick = (value) => {
    if (!value) return "—";
    
    // Handle Date objects or date strings
    let dateObj = null;
    if (value instanceof Date) {
      dateObj = value;
    } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      dateObj = new Date(value);
    }
    
    if (dateObj && !isNaN(dateObj.getTime())) {
      // Check if the date has time information (not just midnight)
      const hasTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0;
      
      if (hasTime) {
        // Show date and time
        return dateObj.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else {
        // Show just date
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: '2-digit'
        });
      }
    }
    
    // Handle strings
    if (typeof value === 'string' && value.length > 8) {
      return value.substring(0, 6) + '...';
    }
    
    return String(value);
  };

  // Format values for display, handling different data types
  const formatValue = (value) => {
    if (!value && value !== 0) return "—";
    
    // Handle Date objects or date strings
    let dateObj = null;
    if (value instanceof Date) {
      dateObj = value;
    } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      dateObj = new Date(value);
    }
    
    if (dateObj && !isNaN(dateObj.getTime())) {
      // Check if the date has time information
      const hasTime = dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0 || dateObj.getSeconds() !== 0;
      
      if (hasTime) {
        return dateObj.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      } else {
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  };

  // Render the chart, supporting normal (zoomed) and full modes
  const renderChart = (mode = "normal") => {
    if (!data.length || selectedColumns.length === 0 || headers.length === 0) {
      return <p className="text-center text-gray-500">Please upload CSV and select columns.</p>;
    }

    // Slice data based on zoom or show full data
    let chartData = mode === "full" ? data : data.slice(zoomDomain.start, zoomDomain.end + 1);
    
    // For large datasets, apply sampling if needed
    if (mode === "full" && chartData.length > 2000) {
      switch (xAxisStrategy) {
        case "sample":
          chartData = sampleData(chartData, 1000);
          break;
        // For other strategies, we'll handle in X-axis configuration
      }
    }
    
    // Get the descriptive X-axis name
    const xAxisName = analyzeXAxisColumn();

    // Calculate appropriate tick interval based on strategy and data size
    let tickInterval = 0;
    let showTicks = true;
    
    switch (xAxisStrategy) {
      case "auto":
        tickInterval = calculateTickInterval(chartData.length);
        break;
      case "sparse":
        tickInterval = Math.max(Math.ceil(chartData.length / 10), 0);
        break;
      case "none":
        showTicks = false;
        break;
      case "sample":
        tickInterval = 0; // Show all ticks since data is already sampled
        break;
    }

    const xAxisProps = {
      dataKey: headers[0],
      tickFormatter: showTicks ? formatXAxisTick : () => "",
      allowDuplicatedCategory: false,
      interval: tickInterval,
      angle: showTicks ? -45 : 0,
      textAnchor: showTicks ? "end" : "middle",
      height: showTicks ? 100 : 60,
      tick: showTicks ? { fontSize: 10 } : false,
      minTickGap: 1,
      label: { 
        value: xAxisName, 
        position: 'insideBottom', 
        offset: showTicks ? 10 : -20, 
        textAnchor: 'middle' 
      }
    };

    const chartMargin = { top: 20, right: 60, left: 60, bottom: showTicks ? 120 : 80 };

    switch(chartType) {
      case "line":
        return (
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis {...xAxisProps} />
            {renderYAxes(chartData)}
            <Tooltip 
              labelFormatter={(value) => `${xAxisName}: ${formatValue(value)}`}
              formatter={(value, name) => [formatValue(value), name]}
            />
            <Legend />
            {renderLines()}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis {...xAxisProps} />
            {renderYAxes(chartData)}
            <Tooltip 
              labelFormatter={(value) => `${xAxisName}: ${formatValue(value)}`}
              formatter={(value, name) => [formatValue(value), name]}
            />
            <Legend />
            {renderBars()}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={chartData} margin={chartMargin}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis {...xAxisProps} />
            {renderYAxes(chartData)}
            <Tooltip 
              labelFormatter={(value) => `${xAxisName}: ${formatValue(value)}`}
              formatter={(value, name) => [formatValue(value), name]}
            />
            <Legend />
            {renderAreas()}
          </AreaChart>
        );

      case "scatter":
        return (
          <ScatterChart data={chartData} margin={chartMargin}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis 
              {...xAxisProps}
              type="category"
            />
            {renderYAxes(chartData)}
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              labelFormatter={(value) => `${xAxisName}: ${formatValue(value)}`}
              formatter={(value, name) => [formatValue(value), name]}
            />
            <Legend />
            {renderScatters()}
          </ScatterChart>
        );

      case "pie":
        // For pie chart, aggregate data across all rows for selected columns
        const pieData = selectedColumns.map((col, i) => {
          const sum = chartData.reduce((acc, row) => {
            const value = Number(row[col]);
            return acc + (isNaN(value) ? 0 : value);
          }, 0);
          return {
            name: col,
            value: sum,
            color: COLORS[i % COLORS.length],
          };
        }).filter(d => d.value > 0);

        // Show warning if no meaningful data
        if (pieData.length === 0 || pieData.every(d => d.value === 0)) {
          return <p className="text-center text-gray-500">Selected columns contain no numeric data for Pie Chart.</p>;
        }

        return (
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatValue(value), 'Value']} />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  // Export functionality with html2canvas alternative
  const exportChart = (isFullChart = false) => {
    const chartElement = document.getElementById(isFullChart ? "full-chart" : "chart");
    if (!chartElement) return;
    
    // Simple fallback - create a data URL from SVG if possible
    const svgElement = chartElement.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = svgElement.clientWidth || 800;
      canvas.height = svgElement.clientHeight || 600;
      
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = isFullChart ? 'full_chart.png' : 'chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  // Disable zoom buttons if zoom limits reached or no data
  const canZoomIn = zoomDomain.end - zoomDomain.start > 2;
  const canZoomOut = !(zoomDomain.start === 0 && zoomDomain.end === data.length - 1);

  // Get current data size info
  const currentDataSize = zoomDomain.end - zoomDomain.start + 1;
  const isLargeDataset = data.length > 1000;

  return (
    <div className="p-4 max-w-6xl mx-auto min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">CSV Plotter</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-6 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 w-full max-w-md"
        aria-label="Upload CSV file"
      />

      {data.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <select
              value={chartType}
              onChange={handleChartTypeChange}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              aria-label="Select chart type"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
              <option value="scatter">Scatter Chart</option>
              <option value="pie">Pie Chart</option>
            </select>

            <select
              value={xAxisStrategy}
              onChange={(e) => setXAxisStrategy(e.target.value)}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              aria-label="Select X-axis display strategy"
            >
              <option value="auto">Auto Spacing</option>
              <option value="sparse">Sparse Labels</option>
              <option value="sample">Sample Data</option>
              <option value="none">No Labels</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {currentDataSize} of {data.length} data points
              {isLargeDataset && (
                <span className="block text-xs text-orange-600 dark:text-orange-400">
                  Large dataset detected - X-axis strategy helps readability
                </span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 font-semibold">Select Columns to Plot:</p>
            <div className="flex flex-wrap gap-2">
              {headers.slice(1).map((col) => (
                <label key={col} className="flex items-center gap-1 px-3 py-1 border rounded cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={() => handleColumnToggle(col)}
                    className="mr-1"
                  />
                  <span className="text-sm">{col}</span>
                </label>
              ))}
            </div>
            {selectedColumns.length === 0 && (
              <p className="text-sm text-red-600 mt-2">Please select at least one column to plot.</p>
            )}
          </div>

          {chartType !== 'pie' && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={handleZoomIn}
                disabled={!canZoomIn}
                className={`px-3 py-2 rounded text-white transition-colors ${canZoomIn ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}
                aria-label="Zoom in"
              >
                Zoom In
              </button>
              <button
                onClick={handleZoomOut}
                disabled={!canZoomOut}
                className={`px-3 py-2 rounded text-white transition-colors ${canZoomOut ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}
                aria-label="Zoom out"
              >
                Zoom Out
              </button>
              <button
                onClick={handleResetZoom}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                aria-label="Reset zoom"
              >
                Reset Zoom
              </button>
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => exportChart(false)}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
              aria-label="Export current view as PNG"
            >
              Export View as PNG
            </button>

            <button
              onClick={() => exportChart(true)}
              className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              aria-label="Export full chart as PNG"
            >
              Export Full Chart as PNG
            </button>
          </div>

          <div
            id="chart"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg overflow-hidden"
          >
            <div style={{ width: "100%", height: "600px" }}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hidden chart for full export */}
          <div
            id="full-chart"
            style={{ position: "absolute", top: "-9999px", left: "-9999px", width: 1200, height: 800 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {renderChart("full")}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default App;