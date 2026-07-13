'use client'

import { motion } from 'framer-motion';
import { Building2, GraduationCap, Briefcase, FileSignature } from 'lucide-react';

export function Trust() {
  const trusts = [
    { icon: Building2, label: "Immigration Agencies" },
    { icon: GraduationCap, label: "Universities" },
    { icon: Briefcase, label: "Educational Consultants" },
    { icon: FileSignature, label: "Document Verification Offices" }
  ];

  return (
    <section className="w-full py-xl px-md border-b border-text-secondary/10 bg-background">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center">
        <p className="text-small font-medium text-text-secondary uppercase tracking-wider mb-lg">Designed For</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md md:gap-xl w-full">
          {trusts.map((trust, index) => (
            <motion.div 
              key={trust.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center justify-center gap-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <trust.icon size={24} className="text-text-primary" />
              <span className="text-body font-medium text-text-primary whitespace-nowrap">{trust.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
