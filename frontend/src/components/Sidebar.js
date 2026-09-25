"use client";

export default function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
    },
    {
      name: "Projects",
      icon: "▤",
    },
    {
      name: "Tasks",
      icon: "✓",
    },
    {
      name: "Dependencies",
      icon: "↔",
    },
    {
      name: "AI Suggestions",
      icon: "✦",
    },
  ];

  return (
   <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 md:flex">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <div>
          <h1 className="text-xl font-bold text-white">
            TaskFlow Pro
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Workflow Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-base">
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-900 p-3">
          <p className="text-xs text-slate-500">
            Dependency-aware
          </p>

          <p className="mt-1 text-sm font-medium text-slate-300">
            DAG Scheduling Engine
          </p>
        </div>
      </div>
    </aside>
  );
}