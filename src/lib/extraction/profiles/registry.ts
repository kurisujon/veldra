import { DocumentProfile, DocumentProfileRegistry } from './types';
import { PsaBirthCertificateProfile } from './psa-birth-certificate';
import { PsaMarriageCertificateProfile } from './psa-marriage-certificate';
import { SponsorValidIdProfile } from './sponsor-valid-id';
import { AffidavitOfSupportProfile } from './affidavit-of-support';
import { DiplomaProfile } from './diploma';

const profiles = new Map<string, DocumentProfile<any>>();

function registerProfile(profile: DocumentProfile<any>) {
  profiles.set(profile.documentType.toLowerCase(), profile);
}

// Register known profiles
registerProfile(PsaBirthCertificateProfile);
registerProfile(PsaMarriageCertificateProfile);
registerProfile(SponsorValidIdProfile);
registerProfile(AffidavitOfSupportProfile);
registerProfile(DiplomaProfile);

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
    const key = documentType.toLowerCase().trim();
    // Directly handle the exact DB enum strings
    if (key === 'psabirth' || key === 'sponsorpsabirth') return PsaBirthCertificateProfile;
    if (key === 'psamarriage' || key === 'sponsorpsamarriage') return PsaMarriageCertificateProfile;
    if (key === 'validid' || key === 'sponsorvalidid') return SponsorValidIdProfile;
    if (key === 'affidavitofsupport') return AffidavitOfSupportProfile;
    if (key === 'diploma') return DiplomaProfile;
    
    return profiles.get(key);
  }
};
