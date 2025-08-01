const fs = require('fs');
const path = require('path');

/**
 * Reads and assembles the full terms JSON object from disk.
 * Expects terms.json to have a structure like:
 * {
 *   "version": "1.0",
 *   "lastUpdated": "2025-08-01",
 *   "terms_and_conditions": [ { title: "...", body: "..." }, ... ]
 * }
 *
 * @returns {Object} Full JSON including metadata and terms.
 */
function getTermsJson() {
    const termsPath = path.join(__dirname, '..', 'data', '../terms.json');

    try {
        const raw = fs.readFileSync(termsPath, 'utf8');
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed.terms_and_conditions)) {
            throw new Error('Invalid terms format: terms_and_conditions must be an array');
        }

        return {
            version: parsed.version || '1.0',
            lastUpdated: parsed.lastUpdated || null,
            terms_and_conditions: parsed.terms_and_conditions
        };
    } catch (err) {
        console.error('Failed to read or parse terms.json:', err);

        return {
            version: '0.0',
            lastUpdated: null,
            terms_and_conditions: []
        };
    }
}

module.exports = getTermsJson;
