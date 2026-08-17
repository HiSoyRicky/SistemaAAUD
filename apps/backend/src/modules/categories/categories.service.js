// categories.service.js

import * as categoriesRepository from './categories.repository.js';

export const getAll = () => {
  return categoriesRepository.findAll();
};
