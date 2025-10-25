const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzIyYzU1ZSIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTM1IDEyMCBRNzUgOTAgMTE1IDEyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjE1IiBmaWxsPSJub25lIi8+PC9zdmc+';

export const mockWorkers = [
  { id: 1, name: 'Juan Pérez', photo: defaultAvatar },
  { id: 2, name: 'María García', photo: defaultAvatar },
  { id: 3, name: 'Carlos López', photo: defaultAvatar },
  { id: 4, name: 'Ana Martínez', photo: defaultAvatar },
  { id: 5, name: 'Pedro Rodríguez', photo: defaultAvatar },
  { id: 6, name: 'Laura Sánchez', photo: defaultAvatar },
  { id: 7, name: 'Miguel Torres', photo: defaultAvatar },
  { id: 8, name: 'Isabel Ramírez', photo: defaultAvatar }
];

export const getRandomWorker = () => {
  return mockWorkers[Math.floor(Math.random() * mockWorkers.length)];
};

export const getWorkerById = (id) => {
  return mockWorkers.find(w => w.id === id);
};
