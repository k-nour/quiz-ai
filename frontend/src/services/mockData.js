/**
 * services/mockData.js
 * ---------------------
 * Données fictives utilisées quand VITE_USE_MOCK=true dans le .env.
 * Permet de développer et démontrer le front-end sans avoir besoin de lancer
 * Django ni Ollama.
 */

export const mockUser = {
  id: 1,
  username: "prof.demo",
  first_name: "Camille",
  last_name: "Dupont",
  email: "camille.dupont@ecole-demo.fr",
  role: "enseignant",
  role_display: "Enseignant",
  date_joined: "2026-01-10T09:00:00Z",
};

export const mockCourses = {
  count: 2,
  results: [
    {
      id: 1,
      title: "La Révolution française",
      content: "La Révolution française débute en 1789 avec la prise de la Bastille...",
      subject: "Histoire",
      level: "college",
      quiz_count: 1,
      created_at: "2026-02-01T10:00:00Z",
    },
    {
      id: 2,
      title: "Le théorème de Pythagore",
      content: "Dans un triangle rectangle, le carré de l'hypoténuse est égal à la somme...",
      subject: "Mathématiques",
      level: "college",
      quiz_count: 0,
      created_at: "2026-02-05T14:30:00Z",
    },
  ],
};

export const mockQuizzes = {
  count: 1,
  results: [
    {
      id: 1,
      course: 1,
      course_title: "La Révolution française",
      title: "Quiz - La Révolution française",
      validated: true,
      created_at: "2026-02-02T11:00:00Z",
      questions: [
        {
          id: 1,
          type: "qcm",
          text: "En quelle année commence la Révolution française ?",
          choices: ["1789", "1799", "1804", "1815"],
          correct_answer: "1789",
          explanation: "",
        },
        {
          id: 2,
          type: "vrai_faux",
          text: "La prise de la Bastille a eu lieu le 14 juillet.",
          choices: [],
          correct_answer: "vrai",
          explanation: "C'est en effet le 14 juillet 1789.",
        },
      ],
    },
  ],
};

export const mockExport = new Blob(
  [JSON.stringify({ profil: mockUser, cours: mockCourses.results }, null, 2)],
  { type: "application/json" }
);

export function mockRegister(role = "enseignant") {
  return {
    ...mockUser,
    role,
    role_display: role === "enseignant" ? "Enseignant" : "Élève",
  };
}

export function mockLogin() {
  localStorage.setItem("access_token", "mock-access-token");
  localStorage.setItem("refresh_token", "mock-refresh-token");
  return { access: "mock-access-token", refresh: "mock-refresh-token" };
}

/** Simule un streaming IA en "tapant" un JSON de quiz morceau par morceau. */
export async function mockGenerateStream(onChunk) {
  const fakeResult = JSON.stringify(
    {
      title: "Quiz généré (démo)",
      questions: [
        {
          type: "qcm",
          text: "Quelle est la capitale de la France ?",
          choices: ["Paris", "Lyon", "Marseille", "Toulouse"],
          correct_answer: "Paris",
          explanation: "",
        },
      ],
    },
    null,
    2
  );

  let fullText = "";
  for (const char of fakeResult) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    fullText += char;
    onChunk(char, fullText);
  }
  return fullText;
}
