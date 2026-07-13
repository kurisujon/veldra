'use client'

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export function WhyVeldra() {
  const comparison = [
    {
      feature: "Data Extraction",
      traditional: "Manual data entry",
      veldra: "Automated extraction"
    },
    {
      feature: "Cross-Checking",
      traditional: "Time-consuming visual checks",
      veldra: "Instant cross-document verification"
    },
    {
      feature: "Issue Tracking",
      traditional: "Multiple spreadsheets",
      veldra: "Structured Findings dashboard"
    },
    {
      feature: "Document Drafting",
      traditional: "Manual copy-pasting",
      veldra: "1-click legal draft generation"
    },
    {
      feature: "Final Reporting",
      traditional: "No standardized automation",
      veldra: "Export-ready bundled reports"
    }
  ];

  return (
    <section id="why-veldra" className="w-full py-2xl px-md bg-background">
      <div className="max-w-[1000px] mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-2xl max-w-[600px]"
        >
          <h2 className="text-[32px] md:text-[40px] font-bold text-text-primary mb-md">Why Choose Veldra</h2>
          <p className="text-body text-text-secondary">Stop wasting hours on manual checks. Veldra modernizes the entire verification lifecycle.</p>
        </motion.div>

        <div className="w-full bg-surface border border-text-secondary/10 rounded-[20px] overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 bg-background border-b border-text-secondary/10 p-md font-semibold text-text-primary text-body">
            <div className="col-span-1 pl-sm">Capabilities</div>
            <div className="col-span-1 text-center text-text-secondary">Traditional Verification</div>
            <div className="col-span-1 text-center text-accent">Veldra</div>
          </div>
          <div className="divide-y divide-text-secondary/10">
            {comparison.map((item, index) => (
              <motion.div 
                key={item.feature}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="grid grid-cols-3 p-md text-body hover:bg-background transition-colors"
              >
                <div className="col-span-1 font-medium pl-sm flex items-center text-text-primary">{item.feature}</div>
                <div className="col-span-1 text-center text-text-secondary flex items-center justify-center gap-xs">
                  <X size={16} className="text-error shrink-0" />
                  <span className="hidden sm:inline">{item.traditional}</span>
                </div>
                <div className="col-span-1 text-center text-text-primary font-medium flex items-center justify-center gap-xs bg-accent/5 py-sm rounded">
                  <Check size={16} className="text-success shrink-0" />
                  <span className="hidden sm:inline">{item.veldra}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
