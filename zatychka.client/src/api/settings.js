// src/api/settings.js
import { get, put } from './client';

export const getStatisticsTexts = () => get('/api/settings/statistics-texts');
export const saveStatisticsTexts = (payload) => put('/api/settings/statistics-texts', payload);

export const getStatisticsNumbers = () => get('/api/settings/statistics-numbers');
export const saveStatisticsNumbers = (payload) => put('/api/settings/statistics-numbers', payload);
