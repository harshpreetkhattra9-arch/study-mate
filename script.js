const taskForm = document.getElementById("taskForm");
const taskName = document.getElementById("taskName");
const subject = document.getElementById("subject");
const taskDate = document.getElementById("taskDate");
const priority = document.getElementById("priority");
const taskList = document.getElementById("taskList");
const taskFilter = document.getElementById("taskFilter");
const emptyMessage = document.getElementById("emptyMessage");
const formMessage = document.getElementById("formMessage");

// Get today's date in the local time zone.
function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Display today's date.
document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

// Set the default study date.
taskDate.value = getLocalDate();
taskDate.min = getLocalDate();

// Load saved tasks from the browser.
let tasks = [];

try {
  const savedTasks = localStorage.getItem("studymate-tasks");
  const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

  if (Array.isArray(parsedTasks)) {
    tasks = parsedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.name === "string" &&
      typeof task.subject === "string" &&
      typeof task.date === "string" &&
      ["Low", "Medium", "High"].includes(task.priority) &&
      typeof task.completed === "boolean"
    );
  }
} catch (error) {
  console.error("Could not load saved tasks:", error);
  formMessage.textContent =
    "Saved data could not be loaded. You can still add tasks.";
}

// Save tasks to the browser.
function saveTasks() {
  try {
    localStorage.setItem("studymate-tasks", JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks:", error);
    formMessage.textContent =
      "Could not save data. Browser storage may be full or unavailable.";
    return false;
  }
}

// Create a task when the form is submitted.
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = taskName.value.trim();
  const date = taskDate.value;

  if (!name) {
    formMessage.textContent = "Please enter a task name.";
    taskName.focus();
    return;
  }

  if (!date || date < getLocalDate()) {
    formMessage.textContent =
      "Please choose today or a future date.";
    return;
  }

  const task = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name,
    subject: subject.value,
    date: date,
    priority: priority.value,
    completed: false
  };

  tasks.push(task);

  const saved = saveTasks();
  renderTasks();

  taskForm.reset();
  taskDate.value = getLocalDate();
  taskDate.min = getLocalDate();

  formMessage.textContent = saved
    ? "Task added successfully!"
    : "Task added for this session, but could not be saved.";
  taskName.focus();
});

// Update the statistics at the top.
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const percentage = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("progressText").textContent =
    `${percentage}%`;

  document.getElementById("progressBar").style.width =
    `${percentage}%`;
}

// Format the study date.
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Build the task list.
function renderTasks() {
  taskList.replaceChildren();

  const filter = taskFilter.value;

  const visibleTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  emptyMessage.hidden = visibleTasks.length > 0;

  if (tasks.length === 0) {
    emptyMessage.textContent =
      "No tasks yet. Add your first study task above!";
  } else if (visibleTasks.length === 0) {
    emptyMessage.textContent =
      "No tasks match this filter.";
  }

  visibleTasks.sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = "task-item";

    const info = document.createElement("div");
    info.className = "task-info";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
      "aria-label",
      `Mark ${task.name} as completed`
    );

    checkbox.addEventListener("change", function () {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const details = document.createElement("div");
    details.className = "task-details";

    if (task.completed) {
      details.classList.add("is-complete");
    }

    const title = document.createElement("h3");
    title.textContent = task.name;

    const description = document.createElement("p");
    description.textContent =
      `${task.subject} · ${formatDate(task.date)}`;

    const badge = document.createElement("span");
    badge.className = `priority ${task.priority}`;
    badge.textContent = `${task.priority} priority`;

    details.append(title, description, badge);
    info.append(checkbox, details);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete ${task.name}`
    );

    deleteButton.addEventListener("click", function () {
      const confirmed = window.confirm(
        `Delete "${task.name}"?`
      );

      if (!confirmed) return;

      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      renderTasks();
      formMessage.textContent = "Task deleted.";
    });

    item.append(info, deleteButton);
    taskList.appendChild(item);
  });

  updateStats();
}

// Filter tasks when the selection changes.
taskFilter.addEventListener("change", renderTasks);

// Show saved tasks when the page opens.
renderTasks();
