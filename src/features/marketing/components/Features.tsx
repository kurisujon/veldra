'use client'

import { motion } from 'framer-motion';
import { Brain, FileSearch, Sparkles, FileText, Download, Lock } from 'lucide-react';

export function Features() {
  const features = [
    {
      title: "AI-powered Document Extraction",
      description: "Automatically extract structured data from PSA Birth Certificates, Transcripts of Records, Diplomas, and more using advanced OCR and LLM models.",
      icon: Brain,
      color: "text-accent"
    },
    {
      title: "Cross-document Comparison",
      description: "Instantly compare extracted fields across multiple documents to detect discrepancies in names, dates, addresses, and academic records.",
      icon: FileSearch,
      color: "text-warning"
    },
    {
      title: "Smart Findings Detection",
      description: "Automatically flag inconsistencies and missing information with severity ratings, guiding reviewers directly to potential issues.",
      icon: Sparkles,
      color: "text-error"
    },
    {
      title: "Affidavit Generation",
      description: "Generate professional legal drafts (Affidavit of Discrepancy, Letters of Explanation) with one click based on detected findings.",
      icon: FileText,
      color: "text-success"
    },
    {
      title: "Export-ready Reports",
      description: "Download verified documents, extracted data, findings, and drafts as bundled PDF or DOCX packages ready for submission.",
      icon: Download,
      color: "text-text-primary"
    },
    {
      title: "Secure Workspace",
      description: "Manage cases in a secure, role-based environment with complete audit trails and encrypted cloud storage for sensitive documents.",
      icon: Lock,
      color: "text-text-secondary"
    }
  ];

  return (
    <section id="features" className="w-full py-2xl px-md bg-surface">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-2xl max-w-[600px]"
        >
          <h2 className="text-[32px] md:text-[40px] font-bold text-text-primary mb-md">Everything you need for seamless verification</h2>
          <p className="text-body text-text-secondary">Veldra replaces manual data entry and spreadsheet tracking with an intelligent, automated workspace.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl w-full">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-background border border-text-secondary/10 rounded-card p-xl hover:shadow-card transition-shadow"
            >
              <div className="w-12 h-12 rounded-button bg-surface border border-text-secondary/10 flex items-center justify-center mb-md">
                <feature.icon size={24} className={feature.color} />
              </div>
              <h3 className="text-title font-semibold text-text-primary mb-sm">{feature.title}</h3>
              <p className="text-body text-text-secondary leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
