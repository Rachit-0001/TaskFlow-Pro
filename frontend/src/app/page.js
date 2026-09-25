"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import KanbanBoard from "../components/KanbanBoard";
import TaskModal from "../components/TaskModal";
import ThemeToggle from "../components/ThemeToggle";
import DependencyManager from "../components/DependencyManager";
import DependencyGraph from "../components/DependencyGraph";
import AISuggestions from "../components/AISuggestions";
import ProjectModal from "../components/ProjectModal";
import TaskManager from "../components/TaskManager";
import ProjectManager from "../components/ProjectManager";
import ProjectSelector from "../components/ProjectSelector";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

import {
  getProjects,
  createProject,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskDependencies,
  getAISuggestions,
} from "../lib/api";

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [dependencyMap, setDependencyMap] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");
  const [theme, setTheme] = useState("dark");

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const [draggingTask, setDraggingTask] = useState(null);

  function handleThemeToggle() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }

  async function loadProject(selectedProjectId = null) {
    const projectResponse = await getProjects();

    const projectList = Array.isArray(projectResponse)
      ? projectResponse
      : projectResponse?.projects || [];

    setProjects(projectList);

    if (projectList.length === 0) {
      throw new Error("No projects found in the database.");
    }

    let currentProject;

    if (selectedProjectId) {
      currentProject =
        projectList.find(
          (item) =>
            Number(item.id) === Number(selectedProjectId)
        ) || projectList[0];
    } else if (project) {
      currentProject =
        projectList.find(
          (item) =>
            Number(item.id) === Number(project.id)
        ) || projectList[0];
    } else {
      currentProject = projectList[0];
    }

    setProject(currentProject);

    const taskResponse = await getTasks(currentProject.id);

    const taskList = Array.isArray(taskResponse)
      ? taskResponse
      : taskResponse?.tasks || [];

    setTasks(taskList);

    const dependencyResults = await Promise.all(
      taskList.map(async (task) => {
        try {
          const result = await getTaskDependencies(task.id);

          return {
            taskId: task.id,
            data: result || {
              incoming: [],
              outgoing: [],
            },
          };
        } catch (err) {
          console.error(
            `Dependency error for task ${task.id}:`,
            err
          );

          return {
            taskId: task.id,
            data: {
              incoming: [],
              outgoing: [],
            },
          };
        }
      })
    );

    const dependencyObject = {};

    dependencyResults.forEach((item) => {
      dependencyObject[item.taskId] = item.data;
    });

    setDependencyMap(dependencyObject);

    try {
      const aiResponse = await getAISuggestions();

      const suggestions = Array.isArray(aiResponse)
        ? aiResponse
        : aiResponse?.suggestions || [];

      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(
        "AI suggestions could not be loaded:",
        err
      );

      setAiSuggestions([]);
    }
  }

  async function handleProjectChange(projectId) {
    if (!projectId) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      await loadProject(projectId);
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Failed to switch project."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDependencyChanged() {
    if (!project) {
      return;
    }

    try {
      setError("");
      await loadProject();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to refresh project data."
      );
    }
  }

  async function handleSuggestionChanged() {
    try {
      setError("");

      const response = await getAISuggestions();

      const suggestions = Array.isArray(response)
        ? response
        : response?.suggestions || [];

      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to refresh AI suggestions."
      );
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError("");

        await loadProject();
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
            "Failed to load TaskFlow Pro."
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const statistics = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.status === "DONE"
    ).length;

    let blocked = 0;
    let ready = 0;
    let dependencyCount = 0;

    tasks.forEach((task) => {
      const incoming =
        dependencyMap[task.id]?.incoming || [];

      dependencyCount += incoming.length;

      const isBlocked = incoming.some(
        (dependency) =>
          dependency.predecessor_status &&
          dependency.predecessor_status !== "DONE"
      );

      if (isBlocked) {
        blocked++;
      } else {
        ready++;
      }
    });

    return {
      total,
      completed,
      blocked,
      ready,
      dependencyCount,
      aiSuggestions: aiSuggestions.filter(
        (item) => item.status === "PENDING"
      ).length,
    };
  }, [tasks, dependencyMap, aiSuggestions]);

  function openCreateModal() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function handleSaveTask(taskData) {
    if (!project) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(project.id, taskData);
      }

      setModalOpen(false);
      setEditingTask(null);

      await loadProject();
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Failed to save task."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteTask(task.id);
      await loadProject();
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Failed to delete task."
      );
    }
  }

  async function handleCreateProject(projectData) {
    try {
      setProjectSaving(true);
      setError("");

      await createProject(projectData);

      setProjectModalOpen(false);

      await loadProject();
    } catch (err) {
      console.error(err);

      setError(
        err?.message || "Failed to create project."
      );
    } finally {
      setProjectSaving(false);
    }
  }

  async function handleSelectProject(projectId) {
    try {
      setError("");
      setLoading(true);

      await loadProject(projectId);

      setActivePage("Dashboard");
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to switch project."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDragStart(event, task) {
    event.dataTransfer.setData(
      "taskId",
      String(task.id)
    );

    event.dataTransfer.effectAllowed = "move";

    setDraggingTask(task);
  }

  async function handleDropTask(taskId, newStatus) {
    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task || task.status === newStatus) {
      setDraggingTask(null);
      return;
    }

    try {
      setError("");

      await updateTask(taskId, {
        status: newStatus,
      });

      await loadProject();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to update task status."
      );
    } finally {
      setDraggingTask(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <main className="ml-64 min-h-screen">
          <LoadingState message="Loading TaskFlow Pro..." />
        </main>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <main className="ml-64 min-h-screen">
          <div className="p-8">
            <ErrorState
              title="Unable to load TaskFlow Pro"
              message={error}
              onRetry={() => window.location.reload()}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="theme-app min-h-screen"
      data-theme={theme}
    >
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="flex min-h-[88px] items-center justify-between gap-6 px-8 py-5">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                Workspace / {activePage}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <ProjectSelector
                  projects={projects}
                  selectedProject={project}
                  onProjectChange={handleProjectChange}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <ThemeToggle
                theme={theme}
                onToggle={handleThemeToggle}
              />

              <button
                type="button"
                onClick={() =>
                  setProjectModalOpen(true)
                }
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white active:scale-[0.98]"
              >
                + New Project
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
              >
                + New Task
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {error && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-400 transition hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}

          {activePage === "Dependencies" ? (
            <div className="space-y-10">
              <DependencyManager
                project={project}
                tasks={tasks}
                dependencyMap={dependencyMap}
                onDependencyChanged={
                  handleDependencyChanged
                }
              />

              <DependencyGraph
                tasks={tasks}
                dependencyMap={dependencyMap}
              />
            </div>
          ) : activePage === "AI Suggestions" ? ( 
            <AISuggestions
              suggestions={aiSuggestions}
              tasks={tasks}
              onSuggestionChanged={handleSuggestionChanged}
            />
          ) : activePage === "Tasks" ? (
            <TaskManager
              tasks={tasks}
              dependencyMap={dependencyMap}
              onCreate={openCreateModal}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
            />
          ) : activePage === "Projects" ? (
            <ProjectManager
              projects={projects}
              tasks={tasks}
              currentProject={project}
              onSelectProject={handleSelectProject}
              onCreateProject={() =>
                setProjectModalOpen(true)
              }
            />
          ) : (
            <>
              <section className="mb-8">
                <p className="max-w-3xl text-sm leading-6 text-slate-400">
                  {project?.description ||
                    "Dependency-aware workflow management project"}
                </p>
              </section>

              <section className="mb-8">
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-white">
                    Project Overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Monitor workflow progress and dependency status.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  <StatCard
                    title="Total Tasks"
                    value={statistics.total}
                    subtitle="All workflow tasks"
                    icon="▦"
                    iconClass="bg-blue-500/10 text-blue-400"
                  />

                  <StatCard
                    title="Completed"
                    value={statistics.completed}
                    subtitle="Status: DONE"
                    icon="✓"
                    iconClass="bg-emerald-500/10 text-emerald-400"
                  />

                  <StatCard
                    title="Ready"
                    value={statistics.ready}
                    subtitle="Dependency ready"
                    icon="●"
                    iconClass="bg-green-500/10 text-green-400"
                  />

                  <StatCard
                    title="Blocked"
                    value={statistics.blocked}
                    subtitle="Waiting on dependencies"
                    icon="!"
                    iconClass="bg-red-500/10 text-red-400"
                  />

                  <StatCard
                    title="Dependencies"
                    value={statistics.dependencyCount}
                    subtitle="Task relationships"
                    icon="↔"
                    iconClass="bg-purple-500/10 text-purple-400"
                  />

                  <StatCard
                    title="AI Suggestions"
                    value={statistics.aiSuggestions}
                    subtitle="Pending review"
                    icon="✦"
                    iconClass="bg-yellow-500/10 text-yellow-400"
                  />
                </div>
              </section>

              <section className="mt-10">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Task Board
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage workflow status and dependency readiness.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {draggingTask && (
                      <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400">
                        Moving: {draggingTask.title}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98]"
                    >
                      + New Task
                    </button>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <EmptyState
                    icon="✓"
                    title="No tasks yet"
                    description="Create your first task to start managing your project workflow."
                    action={
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                      >
                        + Create Task
                      </button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <KanbanBoard
                      tasks={tasks}
                      dependencyMap={dependencyMap}
                      onEdit={openEditModal}
                      onDelete={handleDeleteTask}
                      onDragStart={handleDragStart}
                      onDropTask={handleDropTask}
                    />
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() =>
          setProjectModalOpen(false)
        }
        onSave={handleCreateProject}
        saving={projectSaving}
      />

      <TaskModal
        isOpen={modalOpen}
        task={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        saving={saving}
      />
    </div>
  );
}