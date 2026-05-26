// src/App.jsx
import { useState, useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
} from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const API = "http://localhost:5000";

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconTrades() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconInsights() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, change, color = "text-gray-100" }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow border border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
      <p className="text-sm mt-4 text-gray-500">{change}</p>
    </div>
  );
}

// ─── Performance Calendar ─────────────────────────────────────────────────────
function PerformanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyData, setDailyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API}/api/summary/daily`);
        const dataMap = {};
        res.data.forEach((item) => {
          const dateStr = format(new Date(item.trade_date), "yyyy-MM-dd");
          dataMap[dateStr] = Number(item.totalR);
        });
        setDailyData(dataMap);
      } catch (err) {
        setError("Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const getDayPerformance = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const totalR = dailyData[dateStr];
    if (totalR === undefined) return { r: null, color: "bg-gray-800 text-gray-400" };
    if (totalR > 1.5) return { r: totalR.toFixed(1), color: "bg-green-700 text-white" };
    if (totalR > 0.8) return { r: totalR.toFixed(1), color: "bg-green-600 text-white" };
    if (totalR > 0) return { r: totalR.toFixed(1), color: "bg-green-500 text-white" };
    if (totalR < -1.5) return { r: totalR.toFixed(1), color: "bg-red-700 text-white" };
    if (totalR < -0.8) return { r: totalR.toFixed(1), color: "bg-red-600 text-white" };
    if (totalR < 0) return { r: totalR.toFixed(1), color: "bg-red-500 text-white" };
    return { r: totalR.toFixed(1), color: "bg-gray-700 text-gray-300" };
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth((p) => addMonths(p, -1))}
          className="p-3 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">←</button>
        <h3 className="text-xl font-semibold text-gray-100">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={() => setCurrentMonth((p) => addMonths(p, 1))}
          className="p-3 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">→</button>
      </div>
      {loading && <div className="text-center py-16 text-gray-400">Loading calendar data...</div>}
      {error && <div className="text-center py-16 text-red-400">{error}</div>}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400 mb-4">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: paddingDays }).map((_, i) => <div key={`pad-${i}`} className="h-24" />)}
            {days.map((day) => {
              const { r, color } = getDayPerformance(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              return (
                <div key={day.toISOString()}
                  className={`h-24 flex flex-col items-center justify-center rounded-lg transition-all hover:scale-105 hover:ring-2 hover:ring-green-500/40 ${color} ${isToday ? "ring-2 ring-green-400" : ""}`}>
                  <span className="font-medium text-base">{format(day, "d")}</span>
                  {r !== null && <span className="text-xs mt-1 opacity-90 font-semibold">{r} R</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Trade Card ───────────────────────────────────────────────────────────────
function TradeCard({ trade }) {
  const [expanded, setExpanded] = useState(false);
  const hasOutcome = trade.outcome_id !== null;
  const isWin = hasOutcome && Number(trade.result_r) > 0;
  const isLoss = hasOutcome && Number(trade.result_r) < 0;

  return (
    <div className={`bg-gray-800 rounded-xl border transition-all duration-200 overflow-hidden
      ${isWin ? "border-green-700/60" : isLoss ? "border-red-700/60" : "border-gray-700"}`}>
      {/* Card Header */}
      <div className="p-5 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={`w-2 h-12 rounded-full flex-shrink-0
            ${isWin ? "bg-green-500" : isLoss ? "bg-red-500" : "bg-gray-600"}`} />
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">{trade.pair}</span>
              {trade.session && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                  {trade.session}
                </span>
              )}
              {trade.setup_type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                  {trade.setup_type}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {format(new Date(trade.trade_date), "dd MMM yyyy")}
              {trade.risk_percent && ` · ${trade.risk_percent}% risk`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {hasOutcome ? (
            <span className={`text-2xl font-bold tabular-nums
              ${isWin ? "text-green-400" : "text-red-400"}`}>
              {Number(trade.result_r) > 0 ? "+" : ""}{Number(trade.result_r).toFixed(2)}R
            </span>
          ) : (
            <span className="text-sm text-gray-500 italic">No outcome yet</span>
          )}
          <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-700 p-5 space-y-5">
          {/* Screenshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Before</p>
              {trade.before_screenshot ? (
                <a href={`${API}${trade.before_screenshot}`} target="_blank" rel="noreferrer">
                  <img src={`${API}${trade.before_screenshot}`} alt="Before screenshot"
                    className="w-full rounded-lg border border-gray-700 object-cover max-h-56 hover:opacity-90 transition-opacity cursor-pointer" />
                </a>
              ) : (
                <div className="w-full h-36 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-sm">
                  No screenshot
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">After</p>
              {trade.after_screenshot ? (
                <a href={`${API}${trade.after_screenshot}`} target="_blank" rel="noreferrer">
                  <img src={`${API}${trade.after_screenshot}`} alt="After screenshot"
                    className="w-full rounded-lg border border-gray-700 object-cover max-h-56 hover:opacity-90 transition-opacity cursor-pointer" />
                </a>
              ) : (
                <div className="w-full h-36 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-sm">
                  No screenshot
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-gray-300 bg-gray-900 rounded-lg p-4 leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {trade.risk_percent && (
              <div className="bg-gray-900 rounded-lg px-4 py-2">
                <span className="text-gray-500">Risk </span>
                <span className="text-white font-medium">{trade.risk_percent}%</span>
              </div>
            )}
            {hasOutcome && (
              <div className={`rounded-lg px-4 py-2 ${isWin ? "bg-green-900/40" : "bg-red-900/40"}`}>
                <span className="text-gray-400">Result </span>
                <span className={`font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
                  {Number(trade.result_r) > 0 ? "+" : ""}{Number(trade.result_r).toFixed(2)}R
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trades Page ─────────────────────────────────────────────────────────────
function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | wins | losses | pending

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/trades-view`);
        setTrades(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = trades.filter((t) => {
    if (filter === "wins") return t.outcome_id && Number(t.result_r) > 0;
    if (filter === "losses") return t.outcome_id && Number(t.result_r) < 0;
    if (filter === "pending") return !t.outcome_id;
    return true;
  });

  const tabs = [
    { key: "all", label: "All Trades" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "pending", label: "Pending" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100">Trades</h2>
        <p className="text-gray-500 mt-1">Every idea and its outcome, side by side.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === tab.key
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"}`}>
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 self-center">
          {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-500">Loading trades...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-600">No trades found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => (
            <TradeCard key={`${trade.id}-${trade.outcome_id}`} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Insights: Win Rate Bar ───────────────────────────────────────────────────
function WinRateBar({ label, win_rate, total, total_r }) {
  const isPositive = Number(total_r) >= 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{total} trades</span>
          <span className={`font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{Number(total_r).toFixed(1)}R
          </span>
          <span className="font-bold text-white w-12 text-right">{win_rate}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className="h-2.5 rounded-full bg-green-500 transition-all duration-700"
          style={{ width: `${win_rate}%` }} />
      </div>
    </div>
  );
}

// ─── Insights Page ────────────────────────────────────────────────────────────
function InsightsPage() {
  const [byPair, setByPair] = useState([]);
  const [bySession, setBySession] = useState([]);
  const [bySetup, setBySetup] = useState([]);
  const [rOverTime, setROverTime] = useState([]);
  const [bestWorst, setBestWorst] = useState({ best: [], worst: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pairRes, sessionRes, setupRes, rRes, bwRes] = await Promise.all([
          axios.get(`${API}/api/insights/by-pair`),
          axios.get(`${API}/api/insights/by-session`),
          axios.get(`${API}/api/insights/by-setup`),
          axios.get(`${API}/api/insights/r-over-time`),
          axios.get(`${API}/api/insights/best-worst`),
        ]);
        setByPair(pairRes.data);
        setBySession(sessionRes.data);
        setBySetup(setupRes.data);
        setROverTime(rRes.data);
        setBestWorst(bwRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-center py-24 text-gray-500">Loading insights...</div>;

  const formatDate = (d) => {
    try { return format(new Date(d), "dd MMM"); } catch { return d; }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Insights</h2>
        <p className="text-gray-500 mt-1">Patterns in your trading performance.</p>
      </div>

      {/* R Over Time */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-6">Cumulative R Over Time</h3>
        {rOverTime.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#D1D5DB" }}
                formatter={(val, name) => [
                  `${Number(val).toFixed(2)}R`,
                  name === "cumulative_r" ? "Cumulative R" : "Daily R"
                ]}
                labelFormatter={formatDate}
              />
              <ReferenceLine y={0} stroke="#4B5563" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="cumulative_r" stroke="#22C55E" strokeWidth={2.5}
                dot={{ fill: "#22C55E", r: 3 }} activeDot={{ r: 6 }} name="cumulative_r" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Win Rate Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Pair */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-5">Win Rate by Pair</h3>
          {byPair.length === 0 ? (
            <p className="text-gray-600 text-sm">No data yet.</p>
          ) : (
            byPair.map((row) => (
              <WinRateBar key={row.pair} label={row.pair} win_rate={row.win_rate}
                total={row.total} total_r={row.total_r} />
            ))
          )}
        </div>

        {/* By Session */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-5">Win Rate by Session</h3>
          {bySession.length === 0 ? (
            <p className="text-gray-600 text-sm">No data yet.</p>
          ) : (
            bySession.map((row) => (
              <WinRateBar key={row.session} label={row.session} win_rate={row.win_rate}
                total={row.total} total_r={row.total_r} />
            ))
          )}
        </div>

        {/* By Setup */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-5">Win Rate by Setup</h3>
          {bySetup.length === 0 ? (
            <p className="text-gray-600 text-sm">No data yet.</p>
          ) : (
            bySetup.map((row) => (
              <WinRateBar key={row.setup_type} label={row.setup_type} win_rate={row.win_rate}
                total={row.total} total_r={row.total_r} />
            ))
          )}
        </div>
      </div>

      {/* Best & Worst Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-5 flex items-center gap-2">
            <span>🏆</span> Best Trades
          </h3>
          {bestWorst.best.length === 0 ? (
            <p className="text-gray-600 text-sm">No trades yet.</p>
          ) : (
            <div className="space-y-3">
              {bestWorst.best.map((t) => (
                <div key={t.outcome_id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <span className="font-semibold text-white">{t.pair}</span>
                    <span className="text-gray-500 text-sm ml-2">{formatDate(t.trade_date)}</span>
                    {t.setup_type && <span className="text-gray-600 text-xs ml-2">· {t.setup_type}</span>}
                  </div>
                  <span className="font-bold text-green-400">+{Number(t.result_r).toFixed(2)}R</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-5 flex items-center gap-2">
            <span>📉</span> Worst Trades
          </h3>
          {bestWorst.worst.length === 0 ? (
            <p className="text-gray-600 text-sm">No trades yet.</p>
          ) : (
            <div className="space-y-3">
              {bestWorst.worst.map((t) => (
                <div key={t.outcome_id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <span className="font-semibold text-white">{t.pair}</span>
                    <span className="text-gray-500 text-sm ml-2">{formatDate(t.trade_date)}</span>
                    {t.setup_type && <span className="text-gray-600 text-xs ml-2">· {t.setup_type}</span>}
                  </div>
                  <span className="font-bold text-red-400">{Number(t.result_r).toFixed(2)}R</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage({ onOpenIdea, onOpenOutcome }) {
  const [stats, setStats] = useState({
    total_trades: 0, winning_streak: 0, monthly_r: 0, win_rate: 0,
    trades_change: "+0 this month", streak_longest: "Longest: 0 days",
    r_change: "+0.0 vs last month", win_rate_change: "↑ 0% this month",
  });

  useEffect(() => {
    axios.get(`${API}/api/stats`).then((res) => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100">Dashboard</h2>
        <p className="text-gray-500 mt-1">Your trading performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Trades" value={stats.total_trades} icon="📊" change={stats.trades_change} />
        <StatCard title="Winning Streak"
          value={`${stats.winning_streak || 0}day${stats.winning_streak === 1 ? "" : "s"}`}
          icon="🔥" change={`Longest: ${stats.winning_streak || 0} day${stats.winning_streak === 1 ? "" : "s"}`} />
        <StatCard title="Monthly R"
          value={`+${Number(stats.monthly_r || 0).toFixed(1)} R`}
          icon="₿" change={stats.r_change} color="text-green-400" />
        <StatCard title="Win Rate"
          value={`${Number(stats.win_rate || 0).toFixed(0)}%`}
          icon="🎯" change={stats.win_rate_change} color="text-green-400" />
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-6 text-gray-100">Performance Calendar</h2>
        <PerformanceCalendar />
      </section>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
    { key: "trades",    label: "Trades",    icon: <IconTrades />    },
    { key: "insights",  label: "Insights",  icon: <IconInsights />  },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800 flex items-center gap-3">
        <svg className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 2l3 7h6l-5 4 2 7-6-3-6 3 2-7-5-4h6l3-7z" />
        </svg>
        <span className="text-xl font-bold text-white tracking-tight">MyJournal</span>
      </div>

      {/* Greeting */}
      <div className="px-6 py-4 border-b border-gray-800">
        <p className="text-xs text-gray-600 uppercase tracking-widest">Welcome back</p>
        <p className="text-sm font-semibold text-gray-200 mt-0.5">Bahati</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button key={item.key} onClick={() => setActivePage(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${activePage === item.key
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-700">Trading Journal v2.0</p>
      </div>
    </aside>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const [ideaForm, setIdeaForm] = useState({
    pair: "", session: "", setup_type: "", risk_percent: "", notes: "",
    trade_date: new Date().toISOString().split("T")[0],
  });
  const [ideaFile, setIdeaFile] = useState(null);
  const [outcomeForm, setOutcomeForm] = useState({ idea_id: "", result_r: "" });
  const [outcomeFile, setOutcomeFile] = useState(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoadingIdeas(true);
      try {
        const res = await axios.get(`${API}/api/ideas`);
        setIdeas(res.data);
      } catch (e) { console.error(e); }
      finally { setLoadingIdeas(false); }
    };
    fetchIdeas();
  }, []);

  const handleChange = (e, setForm, form) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setErrorMessage("");
    const formData = new FormData();
    Object.keys(ideaForm).forEach((k) => formData.append(k, ideaForm[k]));
    if (ideaFile) formData.append("before_screenshot", ideaFile);
    try {
      const res = await axios.post(`${API}/api/ideas`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      alert(`Idea created! ID: ${res.data.ideaId}`);
      setIsIdeaModalOpen(false);
      setIdeaForm({ pair: "", session: "", setup_type: "", risk_percent: "", notes: "", trade_date: new Date().toISOString().split("T")[0] });
      setIdeaFile(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to create idea");
    } finally { setIsSubmitting(false); }
  };

  const handleSubmitOutcome = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setErrorMessage("");
    const formData = new FormData();
    formData.append("idea_id", outcomeForm.idea_id);
    formData.append("result_r", outcomeForm.result_r);
    if (outcomeFile) formData.append("screenshot", outcomeFile);
    try {
      await axios.post(`${API}/api/outcomes`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Outcome attached successfully!");
      setIsOutcomeModalOpen(false);
      setOutcomeForm({ idea_id: "", result_r: "" }); setOutcomeFile(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to attach outcome");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="border-b border-gray-800 bg-gray-900 px-8 py-4 flex items-center justify-end sticky top-0 z-10">
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-950">
              + Add Trade
              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
            </MenuButton>
            <MenuItems transition
              className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black/20 focus:outline-none divide-y divide-gray-700">
              <div className="px-1 py-1">
                <MenuItem>
                  {({ active }) => (
                    <button onClick={() => setIsIdeaModalOpen(true)}
                      className={`group flex w-full items-center rounded-md px-4 py-3 text-sm font-medium ${active ? "bg-green-700 text-white" : "text-gray-200"}`}>
                      Add Idea
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button onClick={() => setIsOutcomeModalOpen(true)}
                      className={`group flex w-full items-center rounded-md px-4 py-3 text-sm font-medium ${active ? "bg-green-700 text-white" : "text-gray-200"}`}>
                      Add Outcome
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-10 max-w-7xl w-full mx-auto">
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "trades"    && <TradesPage />}
          {activePage === "insights"  && <InsightsPage />}
        </main>
      </div>

      {/* ── Add Idea Modal ── */}
      <Transition show={isIdeaModalOpen}>
        <Dialog onClose={() => setIsIdeaModalOpen(false)} className="relative z-50">
          <Transition.Child enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl p-10 shadow-2xl border border-gray-700">
                <DialogTitle className="text-2xl font-bold mb-8 text-white">Add New Trade Idea</DialogTitle>
                {errorMessage && <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">{errorMessage}</div>}
                <form onSubmit={handleSubmitIdea} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[["pair","Pair (e.g. EUR/USD)","text"],["session","Session","text"],["setup_type","Setup Type","text"],["risk_percent","Risk (%)","number"]].map(([name, label, type]) => (
                      <div key={name}>
                        <label className="block text-sm font-medium mb-1.5 text-gray-300">{label}</label>
                        <input name={name} type={type} step={type === "number" ? "0.01" : undefined}
                          value={ideaForm[name]}
                          onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                          className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
                          required />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Notes</label>
                    <textarea name="notes" value={ideaForm.notes} onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none min-h-[120px]" rows={5} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Trade Date</label>
                    <input name="trade_date" type="date" value={ideaForm.trade_date}
                      onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Before Screenshot (optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setIdeaFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600" />
                  </div>
                  <div className="flex justify-end gap-4 mt-10">
                    <button type="button" onClick={() => setIsIdeaModalOpen(false)} disabled={isSubmitting}
                      className="px-8 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50">
                      {isSubmitting ? "Creating..." : "Create Idea"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* ── Add Outcome Modal ── */}
      <Transition show={isOutcomeModalOpen}>
        <Dialog onClose={() => setIsOutcomeModalOpen(false)} className="relative z-50">
          <Transition.Child enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl p-10 shadow-2xl border border-gray-700">
                <DialogTitle className="text-2xl font-bold mb-8 text-white">Attach Trade Outcome</DialogTitle>
                {errorMessage && <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">{errorMessage}</div>}
                <form onSubmit={handleSubmitOutcome} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Select Idea</label>
                    {loadingIdeas ? <div className="text-gray-400 py-3">Loading ideas...</div>
                      : ideas.length === 0 ? <div className="text-red-400 py-3">No ideas found. Create one first.</div>
                      : (
                        <select name="idea_id" value={outcomeForm.idea_id}
                          onChange={(e) => handleChange(e, setOutcomeForm, outcomeForm)}
                          className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none" required>
                          <option value="">-- Select an idea --</option>
                          {ideas.map((idea) => (
                            <option key={idea.id} value={idea.id}>
                              {idea.pair} — {format(new Date(idea.trade_date), "dd MMM yyyy")} ({idea.setup_type || "Unknown"})
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Result in R</label>
                    <input name="result_r" type="number" step="0.01" value={outcomeForm.result_r}
                      onChange={(e) => handleChange(e, setOutcomeForm, outcomeForm)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 outline-none"
                      required placeholder="e.g. 2.5 or -1.0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Outcome Screenshot (optional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setOutcomeFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600" />
                  </div>
                  <div className="flex justify-end gap-4 mt-10">
                    <button type="button" onClick={() => setIsOutcomeModalOpen(false)} disabled={isSubmitting}
                      className="px-8 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50">
                      {isSubmitting ? "Submitting..." : "Attach Outcome"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default App;
