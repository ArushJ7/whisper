// In-memory data store for anonymous secrets
// Structured so it can easily be swapped with a database like PostgreSQL in the future.

export let secrets = [
  {
    id: 1,
    text: "I still pretend to listen to podcasts while keeping my headphones in noise-cancellation mode just to enjoy complete silence in busy rooms.",
    createdAt: "2026-08-20T10:15:00.000Z"
  },
  {
    id: 2,
    text: "I anonymously buy coffee for the person behind me in line whenever I win a small victory at work.",
    createdAt: "2026-08-21T14:30:00.000Z"
  },
  {
    id: 3,
    text: "I secretly keep a handwritten notebook of every funny thing my younger sister has said since she was five.",
    createdAt: "2026-08-22T09:45:00.000Z"
  },
  {
    id: 4,
    text: "I taught myself touch typing in the dark so I could draft my fantasy novel late at night without waking anyone up.",
    createdAt: "2026-08-22T18:20:00.000Z"
  },
  {
    id: 5,
    text: "I still re-read old postcards from my grandmother whenever I feel overwhelmed by deadlines.",
    createdAt: "2026-08-23T11:05:00.000Z"
  }
];

let currentId = secrets.length;

export const getNextId = () => {
  currentId += 1;
  return currentId;
};
