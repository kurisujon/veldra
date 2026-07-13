'use client'

import { motion } from 'framer-motion';
import { FileText, ArrowRight, AlertTriangle } from 'lucide-react';

export function InteractiveDemo() {
  return (
    <section className="w-full py-2xl px-md bg-surface border-y border-text-secondary/10 overflow-hidden">
      <div className="max-w-[1000px] mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-xl"
        >
          <h2 className="text-[32px] md:text-[40px] font-bold text-text-primary mb-md">See It In Action</h2>
          <p className="text-body text-text-secondary max-w-[600px] mx-auto">Veldra automatically cross-references documents to find hidden discrepancies.</p>
        </motion.div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-lg relative">
          {/* Document 1 */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-background border border-text-secondary/10 rounded-card p-lg shadow-sm"
          >
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-text-secondary/10">
              <FileText className="text-text-secondary" />
              <h3 className="font-semibold text-text-primary">PSA Birth Certificate</h3>
            </div>
            <div className="space-y-sm font-mono text-small text-text-primary">
              <p><span className="text-text-secondary">Name:</span> JUAN DELA CRUZ</p>
              <p><span className="text-text-secondary">DOB:</span> 01-JAN-1995</p>
              <motion.div 
                initial={{ backgroundColor: 'transparent' }}
                whileInView={{ backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
                viewport={{ once: true }}
                transition={{ delay: 1, duration: 0.5 }}
                className="p-xs -mx-xs rounded px-xs border border-transparent"
              >
                <span className="text-text-secondary">Mother:</span> MARIA M. SANTOS
              </motion.div>
            </div>
          </motion.div>

          {/* Connection Animation */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center">
             <motion.div 
               initial={{ scale: 0 }}
               whileInView={{ scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: 1.5, type: 'spring' }}
               className="w-12 h-12 rounded-full bg-warning flex items-center justify-center shadow-lg text-white"
             >
               <AlertTriangle size={20} />
             </motion.div>
          </div>

          {/* Document 2 */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-background border border-text-secondary/10 rounded-card p-lg shadow-sm"
          >
            <div className="flex items-center gap-sm mb-md pb-sm border-b border-text-secondary/10">
              <FileText className="text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Transcript of Records</h3>
            </div>
            <div className="space-y-sm font-mono text-small text-text-primary">
              <p><span className="text-text-secondary">Name:</span> JUAN DELA CRUZ</p>
              <p><span className="text-text-secondary">DOB:</span> 01-JAN-1995</p>
              <motion.div 
                initial={{ backgroundColor: 'transparent' }}
                whileInView={{ backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
                viewport={{ once: true }}
                transition={{ delay: 1, duration: 0.5 }}
                className="p-xs -mx-xs rounded px-xs border border-transparent"
              >
                <span className="text-text-secondary">Mother:</span> MARY M. SANTOS
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Finding Result */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 2, duration: 0.5 }}
          className="mt-lg w-full max-w-[600px] bg-background border border-warning/30 rounded-card p-md shadow-sm flex items-start gap-md"
        >
          <AlertTriangle className="text-warning shrink-0 mt-xs" size={24} />
          <div>
            <h4 className="font-semibold text-text-primary">Discrepancy Detected</h4>
            <p className="text-body text-text-secondary mt-xs">Name mismatch in Mother's First Name: <strong>MARIA</strong> (PSA) vs <strong>MARY</strong> (TOR).</p>
            <div className="mt-md flex items-center gap-sm">
              <button className="text-small bg-accent text-white px-sm py-xs rounded-button flex items-center gap-xs font-medium">
                Generate Affidavit <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
