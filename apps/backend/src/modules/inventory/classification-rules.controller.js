import catchAsync from '../../common/utils/catchAsync.js';
import * as service from './classification-rules.service.js';
import * as reconciliationService from './classification-reconciliation.service.js';

export const list = catchAsync(async (req, res) => res.json(await service.list(req.query)));
export const getById = catchAsync(async (req, res) => res.json(await service.getById(req.params.id)));
export const create = catchAsync(async (req, res) => res.status(201).json(await service.create(req.body)));
export const update = catchAsync(async (req, res) =>
	res.json(await service.update(req.params.id, req.body, req.user))
);
export const setActive = catchAsync(async (req, res) =>
	res.json(await service.setActive(req.params.id, req.body.active, req.user))
);
export const remove = catchAsync(async (req, res) => res.json(await service.remove(req.params.id)));

export const getAssetTypes = catchAsync(async (_req, res) =>
	res.json(await service.getAssetTypes())
);

export const getAssetExtensions = catchAsync(async (_req, res) =>
	res.json(await service.getAssetExtensions())
);

export const getAdministrativeAreas = catchAsync(async (_req, res) =>
	res.json(await service.getAdministrativeAreas())
);

export const getClassifications = catchAsync(async (_req, res) =>
	res.json(await service.getClassifications())
);

export const resolve = catchAsync(async (req, res) => {
	const rule = await service.resolve(req.body);
	res.json({
		asset_classification_rule_id: rule?.id ?? null,
		classification: rule?.classification
			? {
					...rule.classification,
					code: rule.classification.code_new,
					name: rule.classification.description,
				}
			: null,
		asset_type: rule?.asset_type || null,
		extension: rule?.extension || null,
		administrative_area: rule?.administrative_area || null,
	});
});

export const reconciliationDryRun = catchAsync(async (req, res) => {
	res.json(await reconciliationService.runDryRun({ batchSize: req.body?.batch_size }));
});

export const reconciliation = catchAsync(async (req, res) => {
	res.json({
		success: true,
		data: await reconciliationService.runReconcile({
			batchSize: req.body?.batch_size,
			currentUser: req.user,
		}),
	});
});