import { defineDb, defineTable, column } from 'astro:db';

const FeatureRequest = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    title: column.text(),
    description: column.text(),
    createdAt: column.date(),
    status: column.text({ enum: ['pending', 'approved', 'rejected'] }),
  },
});

const Vote = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    featureRequestId: column.text({ references: () => FeatureRequest.columns.id }),
    createdAt: column.date(),
  },
});

// https://astro.build/db/config
export default defineDb({
  tables: {
    FeatureRequest,
    Vote,
  },
});
