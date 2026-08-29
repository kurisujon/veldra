-- Add SponsorPSAMarriage to documents type check constraint and remove dropped ones if possible
-- NOTE: We shouldn't remove the old ones from the CHECK constraint if old rows still use them.
-- So we will just ADD the new one to the allowed list.

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'PSABirth', 
    'PSAMarriage', 
    'TOR', 
    'SF10', 
    'Diploma', 
    'ValidID', 
    'BankStatement', 
    'ProofOfBilling',
    'SponsorValidID',
    'SponsorCOE',
    'SponsorITR',
    'AffidavitOfSupport',
    'SponsorPSABirth',
    'SponsorPSAMarriage'
  ));
