const courses = [
  { title: "DEEPAK SIR", class: "Class 11-12", subject: "Physics, Chemistry, Maths", color: "#6366f1" },
  { title: "PINTU SIR", class: "Class 11-12", subject: "Biology, Physics, Chemistry", color: "#22c55e" },
  { title: "Board Booster", class: "Class 10", subject: "All Subjects", color: "#f59e0b" },
  { title: "SSC Foundation", class: "Class 9-10", subject: "Maths, Reasoning", color: "#ef4444" },
   { title: "Udaan", class: "Class 8", subject: "Science, Maths", color: "#8b5cf6" },
 { title: "Yakeen", class: "Droppers", subject: "Full Syllabus", color: "#06b6d4" }
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
