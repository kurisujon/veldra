'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LoginModal } from './LoginModal'

export function CTA() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  return (
    <>
      <section className="w-full py-2xl px-md bg-background border-t border-text-secondary/10 overflow-hidden relative">
        <div className="max-w-[800px] mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[36px] md:text-[48px] font-bold text-text-primary mb-lg leading-tight"
          >
            Ready to Modernize Your <br className="hidden md:block" /> Document Verification Process?
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-md"
          >
            <button
              onClick={() => setLoginModalOpen(true)}
              className="bg-text-primary text-white px-xl py-md rounded-button text-[16px] font-medium hover:bg-text-primary/90 transition-colors w-full sm:w-auto shadow-md"
            >
              Get Started
            </button>
            <a href="#demo" className="bg-surface text-text-primary border border-text-secondary/20 px-xl py-md rounded-button text-[16px] font-medium hover:bg-background transition-colors w-full sm:w-auto shadow-sm">
              Book a Demo
            </a>
          </motion.div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      </section>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  )
}
