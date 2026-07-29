import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizePublicHttpUrl, isPrivateOrLocalAddress } from "../src/lib/public-url-security.ts";
import { parseCreateFunnel } from "../src/lib/business-intelligence/request.ts";
import { leadSearchSchema } from "../src/lib/lead-finder/validation.ts";
import { mapOverpassCandidates } from "../src/lib/lead-finder/normalization.ts";
import { legacyBusiness, legacyRequest } from "../src/lib/lead-finder/legacy.ts";

const valid = leadSearchSchema.parse({ location: { type: "city", value: "Miami" } });
assert.equal(valid.radius, 12000);
assert.equal(valid.limit, 40);
assert.equal(leadSearchSchema.safeParse({ location: { type: "city", value: "" } }).success, false);
assert.equal(leadSearchSchema.safeParse({ location: { type: "city", value: "Miami" }, limit: 101 }).success, false);

const normalizedBusinessUrl = normalizePublicHttpUrl("HTTPS://WWW.Example.com/path?q=1");
assert.equal(normalizedBusinessUrl.hostname.toLowerCase().replace(/^www\./, ""), "example.com");
assert.throws(() => normalizePublicHttpUrl("http://localhost:3000"), /Local or private/);
assert.equal(isPrivateOrLocalAddress("127.0.0.1"), true);
assert.equal(isPrivateOrLocalAddress("192.168.1.2"), true);
assert.equal(isPrivateOrLocalAddress("8.8.8.8"), false);

assert.equal(parseCreateFunnel({ businessName: "Test", domain: "example.com" }), false);
assert.equal(parseCreateFunnel({ businessName: "Test", domain: "example.com", createFunnel: true }), true);

const elements = [
  { id: 1, type: "node", tags: { name: "Cafe One", website: "https://cafe.test/path", amenity: "cafe" } },
  { id: 2, type: "node", tags: { name: "Cafe One", website: "https://duplicate.test", amenity: "cafe" } },
];
const candidates = mapOverpassCandidates(elements, { searchArea: "Miami" });
assert.equal(candidates.length, 1);
assert.equal(candidates[0].confidence, null);
assert.equal(candidates[0].source, "openstreetmap");
assert.equal(legacyRequest({ zipcode: "33101", withoutFunnel: true }).location.type, "postalCode");
assert.equal(legacyBusiness(candidates[0]).source, "OpenStreetMap Overpass");

const discovery = await readFile(new URL("../src/app/api/discovery/route.ts", import.meta.url), "utf8");
const autoDiscovery = await readFile(new URL("../src/components/AutoDiscovery.tsx", import.meta.url), "utf8");
const localFinder = await readFile(new URL("../src/components/LocalBusinessFinder.tsx", import.meta.url), "utf8");
const funnelsRoute = await readFile(new URL("../src/app/api/funnels/route.ts", import.meta.url), "utf8");
assert.match(discovery, /parseCreateFunnel\(body\)/);
assert.match(autoDiscovery, /createFunnel: true/);
assert.match(localFinder, /createFunnel: true/);
assert.doesNotMatch(discovery, /const generatedFunnel = await generateLocalizedFunnel/);
assert.match(funnelsRoute, /`BORRAR EMBUDO \$\{funnelId\}`/);
assert.match(funnelsRoute, /WHERE funnel_id=\$1/);

console.log("Phase 2 characterization: 20 assertions passed; no network or provider credentials used.");
