import { DocumentProfile, DocumentProfileRegistry } from './types';
import { PsaBirthCertificateProfile } from './psa-birth-certificate';
import { SponsorValidIdProfile } from './sponsor-valid-id';
import { AffidavitOfSupportProfile } from './affidavit-of-support';

const profiles = new Map<string, DocumentProfile<any>>();

function registerProfile(profile: DocumentProfile<any>) {
  profiles.set(profile.documentType.toLowerCase(), profile);
}

// Register known profiles
registerProfile(PsaBirthCertificateProfile);
registerProfile(SponsorValidIdProfile);
registerProfile(AffidavitOfSupportProfile);

// Also register alternative names if needed (e.g. from existing DB or document type selector)
profiles.set('psa birth certificate', PsaBirthCertificateProfile);
profiles.set('birth certificate', PsaBirthCertificateProfile);
profiles.set('sponsor valid id', SponsorValidIdProfile);
profiles.set('valid id', SponsorValidIdProfile);
profiles.set('passport', SponsorValidIdProfile);
profiles.set('affidavit of support', AffidavitOfSupportProfile);

export const Registry: DocumentProfileRegistry = {
  getProfile(documentType: string): DocumentProfile<any> | undefined {
    if (!documentType) return undefined;
    return profiles.get(documentType.toLowerCase().trim());
  }
};
