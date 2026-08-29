import { Registry } from './src/lib/extraction/profiles/registry';
import { applyNormalization } from './src/lib/extraction/profiles/normalizers';

console.log("Running manual tests...");
const profilePSA = Registry.getProfile('PSA Birth Certificate');
if (!profilePSA || profilePSA.documentType !== 'PSA Birth Certificate') throw new Error("Test 1 Failed");
console.log("Test 1 Passed");

const profileSponsor = Registry.getProfile('Sponsor Valid ID');
if (!profileSponsor || profileSponsor.documentType !== 'Sponsor Valid ID') throw new Error("Test 2 Failed");
console.log("Test 2 Passed");

const profileAffidavit = Registry.getProfile('Affidavit of Support');
if (!profileAffidavit || profileAffidavit.documentType !== 'Affidavit of Support') throw new Error("Test 3 Failed");
console.log("Test 3 Passed");

const profileAlien = Registry.getProfile('Alien Spaceship Registration');
if (profileAlien) throw new Error("Test 4 Failed");
console.log("Test 4 Passed");

if (profilePSA.fields.firstName.required !== true) throw new Error("Test 5 Failed");
if (profilePSA.fields.dateOfBirth.required !== true) throw new Error("Test 5 Failed");
console.log("Test 5 Passed");

if (profilePSA.fields.middleName.required !== false) throw new Error("Test 6 Failed");
console.log("Test 6 Passed");

if (profilePSA.fields.firstName.risk !== 'high') throw new Error("Test 7 Failed");
if (profilePSA.fields.remarks.risk !== 'low') throw new Error("Test 7 Failed");
console.log("Test 7 Passed");

const res = profilePSA.schema.safeParse({
  firstName: { value: "Juan", state: "candidate" },
  lastName: { value: "Dela Cruz", state: "verified", evidenceSpanIds: ["span_1"] }
});
if (!res.success) throw new Error("Test 8 Failed");
console.log("Test 8 Passed");

if (applyNormalization('01 JAN 2000', 'DATE') !== '2000-01-01') throw new Error("Test 9 Failed");
console.log("Test 9 Passed");

if (applyNormalization('  juan   dela cruz ', 'PERSON_NAME') !== 'JUAN DELA CRUZ') throw new Error("Test 10 Failed");
console.log("Test 10 Passed");

if (applyNormalization(' A B C - 1 2 3 ', 'ID_NUMBER') !== 'ABC123') throw new Error("Test 11 Failed");
console.log("Test 11 Passed");

console.log("ALL TESTS PASSED.");
