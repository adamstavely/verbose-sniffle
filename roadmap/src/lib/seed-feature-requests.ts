import { db, FeatureRequest } from 'astro:db';

// Feature requests are separate from Planned (roadmap content). These are ideas users vote on.
export const SEED_REQUESTS = [
	{ id: 'req-csv-import', title: 'CSV import/export', description: 'Bulk import and export data via CSV for migrations and reporting.', status: 'pending' as const },
	{ id: 'req-two-factor', title: 'Two-factor authentication', description: 'Optional 2FA for account security using TOTP or authenticator apps.', status: 'pending' as const },
	{ id: 'req-email-digest', title: 'Email digest', description: 'Weekly or daily email summary of activity and updates.', status: 'pending' as const },
	{ id: 'req-custom-dashboards', title: 'Custom dashboards', description: 'Build and save custom dashboards with configurable widgets and filters.', status: 'pending' as const },
	{ id: 'req-api-rate-increase', title: 'Higher API rate limits', description: 'Increase default API rate limits for power users and integrations.', status: 'pending' as const },
];

/** Inserts seed feature requests if the table is empty. Safe to call on every request. */
export async function ensureFeatureRequestSeeds() {
	try {
		const existing = await db.select().from(FeatureRequest);
		if (existing.length > 0) return;

		const now = new Date();
		await db.insert(FeatureRequest).values(
			SEED_REQUESTS.map((r) => ({
				...r,
				createdAt: now,
			}))
		);
	} catch (err) {
		// Skip seeding when db is read-only (e.g. preview, production with read-only mount)
		const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
		const msg = err instanceof Error ? err.message : String(err);
		if (code.includes('SQLITE_READONLY') || msg.toLowerCase().includes('readonly')) {
			return;
		}
		throw err;
	}
}
