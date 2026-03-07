import { ensureFeatureRequestSeeds } from '../src/lib/seed-feature-requests';

// https://astro.build/db/seed
export default async function seed() {
	await ensureFeatureRequestSeeds();
}
