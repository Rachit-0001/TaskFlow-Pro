const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// Projects

export async function getProjects() {
  return apiRequest("/projects");
}

export async function getProject(id) {
  return apiRequest(`/projects/${id}`);
}

export async function createProject(projectData) {
  return apiRequest("/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });
}

// Tasks

export async function getTasks(projectId) {
  return apiRequest(`/projects/${projectId}/tasks`);
}

export async function createTask(
  projectId,
  taskData
) {
  return apiRequest(
    `/projects/${projectId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(taskData),
    }
  );
}

export async function updateTask(
  taskId,
  taskData
) {
  return apiRequest(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(taskData),
  });
}

export async function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// Dependencies

export async function createDependency(
  dependencyData
) {
  return apiRequest("/dependencies", {
    method: "POST",
    body: JSON.stringify(dependencyData),
  });
}

export async function getTaskDependencies(taskId) {
  return apiRequest(
    `/tasks/${taskId}/dependencies`
  );
}

export async function deleteDependency(
  dependencyId
) {
  return apiRequest(
    `/dependencies/${dependencyId}`,
    {
      method: "DELETE",
    }
  );
}

// AI Suggestions

export async function generateAISuggestion(
  taskId
) {
  return apiRequest("/ai/suggestions", {
    method: "POST",
    body: JSON.stringify({
      taskId,
    }),
  });
}

export async function getAISuggestions() {
  return apiRequest("/ai/suggestions");
}

export async function acceptAISuggestion(
  suggestionId
) {
  return apiRequest(
    `/ai/suggestions/${suggestionId}/accept`,
    {
      method: "PATCH",
    }
  );
}

export async function rejectAISuggestion(
  suggestionId
) {
  return apiRequest(
    `/ai/suggestions/${suggestionId}/reject`,
    {
      method: "PATCH",
    }
  );
}