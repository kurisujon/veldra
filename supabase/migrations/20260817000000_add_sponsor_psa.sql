-- Add SponsorPSABirth to documents type check constraint
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
    'SponsorPSABirth'
  ));
