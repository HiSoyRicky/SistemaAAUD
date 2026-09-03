import {
  getClassificationPreview,
  summarizeClassificationPreview,
} from '../src/modules/inventory/services/inventory-classification-preview.service.js';
import { prisma } from '../src/config/prisma.js';

const preview = await getClassificationPreview();
const summary = summarizeClassificationPreview(preview);
const examples = Object.fromEntries(
  Object.keys(summary).map((status) => [
    status,
    preview.filter((row) => row.status === status).slice(0, 3),
  ])
);

console.log(JSON.stringify({ total: preview.length, summary, examples }, null, 2));
await prisma.$disconnect();