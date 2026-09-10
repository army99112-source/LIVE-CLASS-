const courses = [
  { title: "Class 8", class: "8th Standard", subject: "All Subjects", color: "#8b5cf6" },
  { title: "Class 9", class: "9th Standard", subject: "All Subjects", color: "#ef4444" },
  { title: "Class 10", class: "10th Standard", subject: "All Subjects", color: "#f59e0b" },
  { title: "PINTISIR", class: "Class 11", subject: "All Subjects", color: "#6366f1" },
  { title: "DEEPAK SIR", class: "Class 12", subject: "All Subjects", color: "#22c55e" }
];

const grid = document.getElementById("courseGrid");
if (grid) {
  courses.forEach(c => {
    grid.innerHTML += `
      <div class="course-card" style="border-top: 4px solid ${c.color}">
        <h3>${c.title}</h3>
        <p class="tag">${c.class}</p>
        <p>${c.subject}</p>
        <button class="btn-primary">Join Karo</button>
      </div>
    `;
  });
}
