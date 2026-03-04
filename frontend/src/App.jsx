// src/App.jsx
import { useState, useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
} from "date-fns";

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
        const res = await axios.get("http://localhost:5000/api/summary/daily");
        const dataMap = {};
        res.data.forEach((item) => {
          const dateStr = format(new Date(item.trade_date), "yyyy-MM-dd");
          dataMap[dateStr] = Number(item.totalR);
        });
        setDailyData(dataMap);
      } catch (err) {
        console.error(err);
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

    if (totalR === undefined) {
      return { r: null, color: "bg-gray-800 text-gray-400" };
    }

    if (totalR > 1.5)
      return { r: totalR.toFixed(1), color: "bg-green-700 text-white" };
    if (totalR > 0.8)
      return { r: totalR.toFixed(1), color: "bg-green-600 text-white" };
    if (totalR > 0)
      return { r: totalR.toFixed(1), color: "bg-green-500 text-white" };
    if (totalR < -1.5)
      return { r: totalR.toFixed(1), color: "bg-red-700 text-white" };
    if (totalR < -0.8)
      return { r: totalR.toFixed(1), color: "bg-red-600 text-white" };
    if (totalR < 0)
      return { r: totalR.toFixed(1), color: "bg-red-500 text-white" };

    return { r: totalR.toFixed(1), color: "bg-gray-700 text-gray-300" };
  };

  const goToPrevMonth = () => setCurrentMonth((prev) => addMonths(prev, -1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  return (
    <div className="bg-gray-800 rounded-xl shadow border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="p-3 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
        >
          ←
        </button>

        <h3 className="text-xl font-semibold text-gray-100">
          {format(currentMonth, "MMMM yyyy")}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-3 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
        >
          →
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          Loading calendar data...
        </div>
      )}
      {error && <div className="text-center py-16 text-red-400">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="h-24" />
            ))}

            {days.map((day) => {
              const { r, color } = getDayPerformance(day);
              const isToday =
                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={day.toISOString()}
                  className={`h-24 flex flex-col items-center justify-center rounded-lg transition-all hover:scale-105 hover:ring-2 hover:ring-green-500/40
                    ${color} ${isToday ? "ring-2 ring-green-400" : ""}`}
                >
                  <span className="font-medium text-base">
                    {format(day, "d")}
                  </span>
                  {r !== null && (
                    <span className="text-xs mt-1 opacity-90 font-semibold">
                      {r} R
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total_trades: 0,
    winning_streak: 0,
    monthly_r: 0,
    win_rate: 0,
    trades_change: "+0 this month",
    streak_longest: "Longest: 0 days",
    r_change: "+0.0 vs last month",
    win_rate_change: "↑ 0% this month",
  });

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  // Idea form
  const [ideaForm, setIdeaForm] = useState({
    pair: "",
    session: "",
    setup_type: "",
    risk_percent: "",
    notes: "",
    trade_date: new Date().toISOString().split("T")[0],
  });
  const [ideaFile, setIdeaFile] = useState(null);

  // Outcome form + ideas dropdown
  const [outcomeForm, setOutcomeForm] = useState({
    idea_id: "",
    result_r: "",
  });
  const [outcomeFile, setOutcomeFile] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch ideas for dropdown
  useEffect(() => {
    const fetchIdeas = async () => {
      setLoadingIdeas(true);
      try {
        const res = await axios.get("http://localhost:5000/api/ideas");
        setIdeas(res.data);
      } catch (err) {
        console.error("Failed to load ideas:", err);
      } finally {
        setLoadingIdeas(false);
      }
    };
    fetchIdeas();
  }, []);

  const handleChange = (e, setForm, form) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    Object.keys(ideaForm).forEach((key) => formData.append(key, ideaForm[key]));
    if (ideaFile) formData.append("before_screenshot", ideaFile);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/ideas",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      alert(`Idea created! ID: ${res.data.ideaId}`);
      setIsIdeaModalOpen(false);
      setIdeaForm({
        pair: "",
        session: "",
        setup_type: "",
        risk_percent: "",
        notes: "",
        trade_date: new Date().toISOString().split("T")[0],
      });
      setIdeaFile(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to create idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOutcome = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("idea_id", outcomeForm.idea_id);
    formData.append("result_r", outcomeForm.result_r);
    if (outcomeFile) formData.append("screenshot", outcomeFile);

    try {
      await axios.post("http://localhost:5000/api/outcomes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Outcome attached successfully!");
      setIsOutcomeModalOpen(false);
      setOutcomeForm({ idea_id: "", result_r: "" });
      setOutcomeFile(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Failed to attach outcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2l3 7h6l-5 4 2 7-6-3-6 3 2-7-5-4h6l3-7z"
              />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight">MyJournal</h1>
          </div>

          <p className="text-gray-400 mt-1">Welcome back, Bahati</p>

          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-950">
              + Add Trade
              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black/20 focus:outline-none divide-y divide-gray-700"
            >
              <div className="px-1 py-1">
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`group flex w-full items-center rounded-md px-4 py-3 text-sm font-medium ${
                        active ? "bg-green-700 text-white" : "text-gray-200"
                      }`}
                      onClick={() => setIsIdeaModalOpen(true)}
                    >
                      Add Idea
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button
                      className={`group flex w-full items-center rounded-md px-4 py-3 text-sm font-medium ${
                        active ? "bg-green-700 text-white" : "text-gray-200"
                      }`}
                      onClick={() => setIsOutcomeModalOpen(true)}
                    >
                      Add Outcome
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Trades"
            value={stats.total_trades}
            icon="📊"
            change={stats.trades_change}
          />
          <StatCard
            title="Winning Streak"
            value={`${stats.winning_streak || 0}day${stats.winning_streak === 1 ? "" : "s"}`}
            icon="🔥"
            change={`Longest: ${stats.winning_streak || 0} day${stats.winning_streak === 1 ? "" : "s"}`}
          />
          <StatCard
            title="Monthly R"
            value={`+${Number(stats.monthly_r || 0).toFixed(1)} R`}
            icon="₿"
            change={stats.r_change}
            color="text-green-400"
          />
          <StatCard
            title="Win Rate"
            value={`${Number(stats.win_rate || 0).toFixed(0)}%`}
            icon="🎯"
            change={stats.win_rate_change}
            color="text-green-400"
          />
        </div>

        {/* Calendar */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-100">
            Performance Calendar
          </h2>
          <PerformanceCalendar />
        </section>
      </main>

      {/* Add Idea Modal */}
      <Transition show={isIdeaModalOpen}>
        <Dialog
          onClose={() => setIsIdeaModalOpen(false)}
          className="relative z-50"
        >
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl p-10 shadow-2xl border border-gray-700">
                <DialogTitle className="text-2xl font-bold mb-8 text-white">
                  Add New Trade Idea
                </DialogTitle>

                {errorMessage && (
                  <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitIdea} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Pair (e.g. EUR/USD)
                      </label>
                      <input
                        name="pair"
                        value={ideaForm.pair}
                        onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Session
                      </label>
                      <input
                        name="session"
                        value={ideaForm.session}
                        onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Setup Type
                      </label>
                      <input
                        name="setup_type"
                        value={ideaForm.setup_type}
                        onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-300">
                        Risk (%)
                      </label>
                      <input
                        name="risk_percent"
                        type="number"
                        step="0.01"
                        value={ideaForm.risk_percent}
                        onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={ideaForm.notes}
                      onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none min-h-[120px]"
                      rows={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Trade Date
                    </label>
                    <input
                      name="trade_date"
                      type="date"
                      value={ideaForm.trade_date}
                      onChange={(e) => handleChange(e, setIdeaForm, ideaForm)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Before Screenshot (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setIdeaFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                    />
                  </div>

                  <div className="flex justify-end gap-4 mt-10">
                    <button
                      type="button"
                      onClick={() => setIsIdeaModalOpen(false)}
                      className="px-8 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Create Idea"}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Add Outcome Modal */}
      <Transition show={isOutcomeModalOpen}>
        <Dialog
          onClose={() => setIsOutcomeModalOpen(false)}
          className="relative z-50"
        >
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl p-10 shadow-2xl border border-gray-700">
                <DialogTitle className="text-2xl font-bold mb-8 text-white">
                  Attach Trade Outcome
                </DialogTitle>

                {errorMessage && (
                  <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitOutcome} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Select Idea
                    </label>
                    {loadingIdeas ? (
                      <div className="text-gray-400 py-3">Loading ideas...</div>
                    ) : ideas.length === 0 ? (
                      <div className="text-red-400 py-3">
                        No ideas found. Create one first.
                      </div>
                    ) : (
                      <select
                        name="idea_id"
                        value={outcomeForm.idea_id}
                        onChange={(e) =>
                          handleChange(e, setOutcomeForm, outcomeForm)
                        }
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        required
                      >
                        <option value="">-- Select an idea --</option>
                        {ideas.map((idea) => (
                          <option key={idea.id} value={idea.id}>
                            {idea.pair} —{" "}
                            {format(new Date(idea.trade_date), "dd MMM yyyy")} (
                            {idea.setup_type || "Unknown"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Result in R
                    </label>
                    <input
                      name="result_r"
                      type="number"
                      step="0.01"
                      value={outcomeForm.result_r}
                      onChange={(e) =>
                        handleChange(e, setOutcomeForm, outcomeForm)
                      }
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      required
                      placeholder="e.g. 2.5 or -1.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Outcome Screenshot (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setOutcomeFile(e.target.files?.[0] || null)
                      }
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-gray-300 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
                    />
                  </div>

                  <div className="flex justify-end gap-4 mt-10">
                    <button
                      type="button"
                      onClick={() => setIsOutcomeModalOpen(false)}
                      className="px-8 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
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
