'use client'

import { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { LoginModal } from './LoginModal'

export function Hero() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity1 = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <>
      <section ref={containerRef} className="relative w-full pt-[140px] pb-[80px] px-md flex flex-col items-center">
        <motion.div 
          style={{ y: y1, opacity: opacity1 }}
          className="max-w-[800px] w-full text-center z-10 flex flex-col items-center"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface border border-text-secondary/10 text-text-primary font-medium text-small mb-lg shadow-sm"
          >
            <ShieldCheck size={16} className="text-accent" />
            <span>Enterprise-Grade Document Verification</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[48px] md:text-[64px] font-bold text-text-primary leading-[1.1] tracking-tight mb-lg"
          >
            Professional Document Verification <br className="hidden md:block"/> 
            <span className="text-accent">Made Faster and More Reliable</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[18px] md:text-[20px] text-text-secondary leading-relaxed max-w-[650px] mb-xl"
          >
            Automate document extraction, detect discrepancies across multiple records, and generate professional legal drafts from a unified verification workspace.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-md"
          >
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center justify-center gap-sm bg-text-primary text-white px-xl py-md rounded-button text-[16px] font-medium hover:bg-text-primary/90 transition-colors w-full sm:w-auto shadow-md"
            >
              Get Started <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="flex items-center justify-center gap-sm bg-surface text-text-primary border border-text-secondary/20 px-xl py-md rounded-button text-[16px] font-medium hover:bg-background transition-colors w-full sm:w-auto shadow-sm">
              Watch Demo
            </a>
          </motion.div>
        </motion.div>

        {/* Hero Visual - Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, type: 'spring', bounce: 0.1 }}
          className="w-full max-w-[1000px] mt-xl relative z-20"
        >
          <div className="rounded-[16px] bg-surface border border-text-secondary/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col ring-1 ring-text-primary/5">
            {/* Mock Window Header */}
            <div className="h-10 bg-background border-b border-text-secondary/10 flex items-center px-md gap-xs">
              <div className="w-3 h-3 rounded-full bg-text-secondary/20"></div>
              <div className="w-3 h-3 rounded-full bg-text-secondary/20"></div>
              <div className="w-3 h-3 rounded-full bg-text-secondary/20"></div>
            </div>
            {/* Mock App UI */}
            <div className="flex h-[400px] md:h-[550px] bg-background">
              <div className="hidden md:flex w-[200px] border-r border-text-secondary/10 bg-surface flex-col p-md gap-md">
                <div className="h-6 w-24 bg-text-secondary/10 rounded-full mb-md"></div>
                {[1,2,3,4,5].map(i => <div key={i} className={`h-8 w-full rounded-button ${i===2 ? 'bg-background' : 'bg-transparent'}`}></div>)}
              </div>
              <div className="flex-1 p-xl flex flex-col gap-lg overflow-hidden">
                <div className="flex justify-between items-center">
                  <div className="h-8 w-48 bg-text-secondary/10 rounded-full"></div>
                  <div className="h-8 w-32 bg-accent/10 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-md">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-surface border border-text-secondary/10 rounded-card p-md shadow-sm"></div>)}
                </div>
                <div className="flex-1 bg-surface border border-text-secondary/10 rounded-card p-md shadow-sm flex flex-col gap-md">
                  <div className="h-6 w-32 bg-text-secondary/10 rounded-full"></div>
                  {[1,2,3,4].map(i => <div key={i} className="h-12 w-full bg-background rounded-button"></div>)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  )
}
