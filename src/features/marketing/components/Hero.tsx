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
            {/* Product Demo Video / Interactive Preview */}
            <div className="flex h-[400px] md:h-[550px] bg-background relative overflow-hidden items-center justify-center">
              <video 
                src="/demos/landing-demo.webm"
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  // If media file isn't uploaded yet, hide video tag and show rich UI preview
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = document.getElementById('demo-fallback-ui');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="demo-fallback-ui" className="w-full h-full flex flex-row bg-background" style={{ display: 'none' }}>
                {/* Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="hidden md:flex w-[220px] border-r border-text-secondary/10 bg-surface flex-col p-md gap-sm"
                >
                  <div className="flex items-center gap-xs mb-md px-xs">
                    <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs">V</div>
                    <span className="font-semibold text-text-primary text-small">Veldra Workspace</span>
                  </div>
                  <div className="px-sm py-xs rounded-button bg-background text-text-primary text-small font-medium flex items-center justify-between shadow-xs">
                    <span>Cases</span>
                    <span className="text-[11px] bg-accent/10 text-accent font-semibold px-xs py-0.5 rounded-full">12</span>
                  </div>
                  <div className="px-sm py-xs rounded-button text-text-secondary text-small font-medium">Documents</div>
                  <div className="px-sm py-xs rounded-button text-text-secondary text-small font-medium">Findings</div>
                  <div className="px-sm py-xs rounded-button text-text-secondary text-small font-medium">Analytics</div>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 p-lg md:p-xl flex flex-col gap-md overflow-hidden bg-background">
                  {/* Case Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.2 }}
                    className="flex justify-between items-center border-b border-text-secondary/10 pb-md"
                  >
                    <div>
                      <div className="text-small font-semibold text-text-primary">Juan Dela Cruz — Case #2026-0815</div>
                      <div className="text-[12px] text-text-secondary mt-0.5">Student Visa Application • Primary Applicant</div>
                    </div>
                    <span className="text-[12px] font-medium text-accent bg-accent/10 border border-accent/20 px-sm py-xs rounded-full">
                      Stage 3 Verified
                    </span>
                  </motion.div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-sm md:gap-md">
                    {[
                      { label: 'Applicant Docs', value: 'PSA, TOR, SF10', delay: 1.4 },
                      { label: 'Sponsor Docs', value: 'ID, COE, ITR', delay: 1.5 },
                      { label: 'Evidence Chain', value: 'Parent Link ✓', delay: 1.6, isSuccess: true },
                    ].map((card) => (
                      <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: card.delay }}
                        className="bg-surface border border-text-secondary/10 rounded-card p-sm md:p-md shadow-xs"
                      >
                        <div className="text-[11px] text-text-secondary">{card.label}</div>
                        <div className={`text-body font-semibold mt-xs ${card.isSuccess ? 'text-success' : 'text-text-primary'}`}>
                          {card.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Findings Table */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.7 }}
                    className="flex-1 bg-surface border border-text-secondary/10 rounded-card p-md shadow-xs flex flex-col gap-sm"
                  >
                    <div className="flex items-center justify-between pb-xs border-b border-text-secondary/10">
                      <span className="text-small font-semibold text-text-primary">Verification Findings</span>
                      <span className="text-[11px] text-text-secondary">3-Stage Engine</span>
                    </div>
                    {[
                      { name: 'Full Name Consistency', badge: 'Exact Match', badgeClass: 'bg-success/10 text-success', delay: 1.9 },
                      { name: 'Date of Birth Cross-Reference', badge: 'Exact Match', badgeClass: 'bg-success/10 text-success', delay: 2.1 },
                      { name: 'Mother\u2019s Name (Affidavit)', badge: 'Fuzzy Match', badgeClass: 'bg-warning/10 text-warning', delay: 2.3 },
                      { name: 'Sponsor Income (ITR vs COE)', badge: 'Verified', badgeClass: 'bg-accent/10 text-accent', delay: 2.5 },
                    ].map((finding) => (
                      <motion.div
                        key={finding.name}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: finding.delay }}
                        className="p-sm bg-background border border-text-secondary/10 rounded-button flex items-center justify-between text-small"
                      >
                        <span className="font-medium text-text-primary">{finding.name}</span>
                        <span className={`text-[11px] ${finding.badgeClass} font-semibold px-xs py-0.5 rounded`}>
                          {finding.badge}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
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
