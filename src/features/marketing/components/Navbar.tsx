'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { LoginModal } from './LoginModal';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Security", href: "#security" },
    { name: "About", href: "#why-veldra" },
  ];

  const openLogin = () => {
    setMobileMenuOpen(false);
    setLoginModalOpen(true);
  };

  return (
    <>
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-surface/90 backdrop-blur-md border-b border-text-secondary/10' : 'bg-transparent'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="max-w-[1200px] mx-auto px-md h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-sm">
            <Image src="/veldra.png" alt="Veldra Logo" width={32} height={32} className="object-contain" />
            <span className="font-bold text-heading text-text-primary">Veldra</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-lg">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-body font-medium text-text-secondary hover:text-text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-md">
            <button
              onClick={openLogin}
              className="text-body font-medium text-text-primary hover:text-accent transition-colors"
            >
              Login
            </button>
            <button
              onClick={openLogin}
              className="bg-text-primary text-white px-md py-sm rounded-button text-body font-medium hover:bg-text-primary/90 transition-colors shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-surface border-b border-text-secondary/10 p-md flex flex-col gap-md shadow-lg">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-body font-medium text-text-primary p-sm hover:bg-background rounded-button">
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-sm pt-sm border-t border-text-secondary/10">
              <button onClick={openLogin} className="text-center text-body font-medium text-text-primary p-sm border border-text-secondary/20 rounded-button">Login</button>
              <button onClick={openLogin} className="text-center bg-text-primary text-white p-sm rounded-button text-body font-medium shadow-sm">Get Started</button>
            </div>
          </div>
        )}
      </motion.header>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
