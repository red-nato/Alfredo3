export const SESSION_STATUS = Object.freeze({ WAITING: 'EN_ESPERA', ACTIVE: 'EN_CURSO', FINISHED: 'FINALIZADA' });
export const normalise = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
export const sessionCode = (value) => String(value ?? '').trim().toUpperCase();
