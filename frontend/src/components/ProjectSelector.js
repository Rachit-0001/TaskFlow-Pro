"use client";

import { useEffect, useRef, useState } from "react";

export default function ProjectSelector({
  projects,
  selectedProject,
  onProjectChange,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSelect(project) {
    onProjectChange(project.id);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className="relative w-full max-w-[420px]"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-left text-lg font-semibold text-white outline-none transition hover:border-slate-600 focus:border-blue-500"
      >
        <span className="truncate">
          {selectedProject?.name || "Select Project"}
        </span>

        <span
          className={`ml-3 text-sm text-slate-300 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
          <div className="max-h-64 overflow-y-auto p-1">
            {projects.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                No projects available
              </div>
            ) : (
              projects.map((item) => {
                const isSelected =
                  Number(selectedProject?.id) === Number(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="truncate">
                      {item.name}
                    </span>

                    {isSelected && (
                      <span className="ml-3">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}