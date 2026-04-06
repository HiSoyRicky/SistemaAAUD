import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './activity.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await service.getAll(req.query);
  res.json(data);
});
