'use client'

import { motion } from 'framer-motion';
import { Shield, Lock, FileKey, History } from 'lucide-react';

export function Security() {
  const securityFeatures = [
    {
      title: "Private Storage",
      description: "All documents are stored in secure, private cloud buckets isolated per workspace.",
      icon: Shield
    },
    {
      title: "Encrypted Files",
      description: "Data is encrypted at rest and in transit using industry-standard protocols.",
      icon: Lock
    },
    {
      title: "Role-based Permissions",
      description: "Strict access control ensuring only authorized personnel can view sensitive cases.",
      icon: FileKey
    },
    {
      title: "Audit Logs",
      description: "Comprehensive tracking of every action, view, and modification within the platform.",
      icon: History
    }
  ];

  return (
    <section id="security" className="w-full py-2xl px-md bg-text-primary text-white">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-2xl max-w-[600px]"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-md">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-[32px] md:text-[40px] font-bold mb-md">Enterprise-Grade Security</h2>
          <p className="text-body text-white/70">We understand that document verification involves highly sensitive PII. Veldra is built from the ground up with security at its core.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg w-full">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-card p-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <feature.icon size={28} className="text-accent mb-md" />
              <h3 className="text-title font-semibold mb-sm">{feature.title}</h3>
              <p className="text-body text-white/60 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
