'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FAQ() {
  const faqs = [
    {
      question: "What file types are supported?",
      answer: "Veldra currently supports PDF, PNG, JPEG, and WebP for document extraction. Exported drafts and reports are available in PDF and DOCX formats."
    },
    {
      question: "How accurate is the AI extraction?",
      answer: "Our specialized extraction models achieve over 98% accuracy on standard document types like PSA Birth Certificates and Academic Transcripts, with confidence scores provided for every extracted field."
    },
    {
      question: "Can findings be reviewed manually?",
      answer: "Yes. Veldra operates as a copilot, not an autopilot. All AI-generated findings must be reviewed, edited, or approved by a human agent before drafts can be generated."
    },
    {
      question: "Can generated drafts be edited?",
      answer: "Absolutely. The generated legal drafts (such as Affidavits of Discrepancy) open in a rich-text editor within the workspace, allowing full manual editing before final export."
    },
    {
      question: "Does Veldra integrate with existing systems?",
      answer: "We offer API access for Enterprise customers to seamlessly push cases and pull verified reports into existing CRM or case management systems."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="w-full py-2xl px-md bg-background">
      <div className="max-w-[800px] mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-xl"
        >
          <h2 className="text-[32px] md:text-[40px] font-bold text-text-primary mb-md">Frequently Asked Questions</h2>
        </motion.div>

        <div className="w-full flex flex-col gap-sm">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-surface border border-text-secondary/10 rounded-card overflow-hidden"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-lg py-md flex items-center justify-between font-semibold text-text-primary hover:bg-background transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} size={20} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-lg pb-md text-body text-text-secondary"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
