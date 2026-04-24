import catchAsync from '../../common/utils/catchAsync.js';
import * as categoriesService from './categories.service.js';

export const list = catchAsync(async (req, res) => {
  const categories = await categoriesService.getAll();
  res.json({ data: categories });
});