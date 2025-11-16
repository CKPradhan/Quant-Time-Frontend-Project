// Helper
const qs = (s) => document.querySelector(s);

// DOM Selectors
const localClock = qs("#localClock");
const mainTime = qs("#mainTime");
const todayDate = qs("#todayDate");
const sessionTime = qs("#sessionTime");
const toggleStopwatchBtn = qs("#toggleStopwatch");
const themeToggle = qs("#themeToggle");
const resetDataBtn = qs("#resetData");
const exportCSVBtn = qs("#exportCSV");

// Weekly Data Navigation
const weeklyChartCanvas = qs("#weeklyChart");
let currentWeekOffset = 0;
let weeklyChart;

// Utilities
const getDateKey = (date) => date.toISOString().substring(0, 10);
const pad = (n) => String(n).padStart(2, "0");

// Theme Toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// Clock
function updateClocks() {
  const now = new Date();
  localClock.textContent = now.toLocaleTimeString();
  mainTime.textContent = now.toLocaleTimeString("en-US", { hour12: true });
  todayDate.textContent = now.toDateString();
}
setInterval(updateClocks, 1000);
updateClocks();

// Stopwatch
let isRunning = false;
let stopwatchStart = 0;
let elapsedSeconds = 0;
let stopwatchInterval;

// Save usage data every second
function updateUsageData() {
  const dateKey = getDateKey(new Date());
  const usageData = JSON.parse(localStorage.getItem("usageData") || "{}");
  usageData[dateKey] = (usageData[dateKey] || 0) + 1000; // +1 sec
  localStorage.setItem("usageData", JSON.stringify(usageData));
}

toggleStopwatchBtn.addEventListener("click", () => {
  if (!isRunning) {
    stopwatchStart = Date.now() - elapsedSeconds * 1000;
    stopwatchInterval = setInterval(() => {
      elapsedSeconds++;
      elapsedTime = elapsedSeconds * 1000;

      sessionTime.textContent = new Date(elapsedTime).toISOString().substr(11, 8);

      // Save usage every second
      updateUsageData();

      // Refresh chart every minute
      if (elapsedSeconds % 60 === 0) {
        renderWeeklyChart();
      }
    }, 1000);
    toggleStopwatchBtn.textContent = "Pause";
    isRunning = true;
  } else {
    clearInterval(stopwatchInterval);
    toggleStopwatchBtn.textContent = "Start";
    isRunning = false;
  }
});

// Weekly range generator
function getWeekRange(offset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const start = new Date(now.setDate(now.getDate() - now.getDay()));

  return [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return getDateKey(d);
  });
}


// Render weekly chart
function renderWeeklyChart() {
  const week = getWeekRange(currentWeekOffset);
  const usageData = JSON.parse(localStorage.getItem("usageData") || "{}");
  const data = week.map((day) => Math.floor((usageData[day] || 0) / 60000));

  const ctx = weeklyChartCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "#f39c12");
  gradient.addColorStop(1, "#d35400");

  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(weeklyChartCanvas, {
    type: "bar",
    data: {
      labels: week.map((d) => d.substring(5)),
      datasets: [
        {
          label: "Usage (in minutes)",
          data,
          backgroundColor: gradient,
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} minutes`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}
renderWeeklyChart();

// Add Navigation UI
weeklyChartCanvas.insertAdjacentHTML(
  "beforebegin",
  `
  <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
    <button id="prevWeekBtn">← Previous</button>
    <span id="weekLabel" style="font-weight:600;">This Week</span>
    <button id="nextWeekBtn">Next →</button>
  </div>
`
);

const updateWeekLabel = () => {
  qs("#weekLabel").textContent =
    currentWeekOffset === 0
      ? "This Week"
      : currentWeekOffset > 0
      ? `+${currentWeekOffset} Week`
      : `${currentWeekOffset} Week`;
};

qs("#prevWeekBtn").addEventListener("click", () => {
  currentWeekOffset--;
  updateWeekLabel();
  renderWeeklyChart();
});
qs("#nextWeekBtn").addEventListener("click", () => {
  currentWeekOffset++;
  updateWeekLabel();
  renderWeeklyChart();
});

// Export CSV
exportCSVBtn.addEventListener("click", () => {
  const usageData = JSON.parse(localStorage.getItem("usageData") || "{}");
  let csv = "Date,Minutes Used\n";
  Object.keys(usageData).forEach((date) => {
    csv += `${date},${Math.floor(usageData[date] / 60000)}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "usage_data.csv";
  a.click();
});

// Reset Data
resetDataBtn.addEventListener("click", () => {
  localStorage.removeItem("usageData");
  alert("All data reset!");
  location.reload();
});

// Save usage on unload
window.addEventListener("beforeunload", () => {
  if (elapsedSeconds > 0) updateUsageData();
});

// ---------------- ALARM ----------------
const alarmTimeInput = qs('#alarmTime');
const alarmSoundInput = qs('#alarmSound');
const setAlarmBtn = qs('#setAlarmBtn');
const clearAlarmBtn = qs('#clearAlarmBtn');
const alarmStatus = qs('#alarmStatus');
const defaultAlarm = qs('#defaultAlarm');

let alarmTime = null;
let alarmSound = null;
let alarmTriggered = false;

setAlarmBtn.addEventListener('click', () => {
  if (!alarmTimeInput.value) {
    alarmStatus.textContent = "⛔ Please set a valid time!";
    return;
  }
  alarmTime = alarmTimeInput.value;
  alarmTriggered = false;
  alarmStatus.textContent = `⏰ Alarm set for ${alarmTime}`;

  // Load selected or default sound
  if (alarmSoundInput.files.length > 0) {
    alarmSound = new Audio(URL.createObjectURL(alarmSoundInput.files[0]));
  } else {
    alarmSound = defaultAlarm;
  }
});

clearAlarmBtn.addEventListener("click", () => {
  alarmTime = null;
  alarmTriggered = false;
  alarmStatus.textContent = "🔕 Alarm cleared.";
});

// Check and trigger alarm
setInterval(() => {
  if (!alarmTime || alarmTriggered) return;

  const now = new Date();
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  if (currentTime === alarmTime) {
    alarmTriggered = true;
    alarmStatus.textContent = "⏰ ALARM RINGING!";
    alarmStatus.classList.add("ringing");

    // Play alarm directly - no popup
    alarmSound.play().catch(err => {
      console.error("Audio playback failed:", err);
    });

    // Stop ringing after a time (optional)
    setTimeout(() => alarmStatus.classList.remove("ringing"), 10000);
  }
}, 1000);
