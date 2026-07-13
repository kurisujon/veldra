'use client'

import { motion } from 'framer-motion';
import { UserPlus, Upload, Cpu, Search, AlertCircle, FileEdit, Download } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    { title: "Create Applicant Case", icon: UserPlus },
    { title: "Upload Documents", icon: Upload },
    { title: "AI Extracts Information", icon: Cpu },
    { title: "Cross-check Documents", icon: Search },
    { title: "Review Findings", icon: AlertCircle },
    { title: "Generate Affidavits", icon: FileEdit },
    { title: "Export Reports", icon: Download }
  ];

  return (
    <section id="how-it-works" className="w-full py-2xl px-md bg-background overflow-hidden relative">
      <div className="max-w-[800px] mx-auto flex flex-col items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-xl max-w-[600px]"
        >
          <h2 className="text-[32px] md:text-[40px] font-bold text-text-primary mb-md">How Veldra Works</h2>
          <p className="text-body text-text-secondary">A streamlined, step-by-step process designed for high-volume verification teams.</p>
        </motion.div>

        <div className="relative w-full">
          {/* Vertical Line */}
          <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-0.5 bg-text-secondary/10 -translate-x-1/2"></div>
          
          <div className="flex flex-col gap-lg">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div 
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`flex items-center gap-md relative ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                >
                  <div className={`hidden md:flex flex-1 ${isEven ? 'justify-start' : 'justify-end'}`}>
                    <div className="text-title font-semibold text-text-primary">{step.title}</div>
                  </div>
                  
                  <div className="w-[80px] h-[80px] rounded-full bg-surface border-4 border-background flex items-center justify-center shrink-0 z-10 shadow-sm">
                    <step.icon size={32} className="text-accent" />
                  </div>
                  
                  <div className="flex-1 md:hidden">
                    <div className="text-title font-semibold text-text-primary">{step.title}</div>
                  </div>
                  <div className="hidden md:block flex-1"></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
