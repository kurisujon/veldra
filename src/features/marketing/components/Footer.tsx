import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-text-secondary/10 pt-2xl pb-xl px-md">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-xl">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-sm mb-md">
            <Image src="/veldra.png" alt="Veldra Logo" width={24} height={24} className="object-contain grayscale opacity-80" />
            <span className="font-bold text-title text-text-primary">Veldra</span>
          </Link>
          <p className="text-small text-text-secondary leading-relaxed">
            Premium Smart Document Verification Platform for immigration, education, and compliance.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-text-primary mb-md">Product</h4>
          <ul className="space-y-sm">
            <li><Link href="#features" className="text-small text-text-secondary hover:text-text-primary transition-colors">Features</Link></li>
            <li><Link href="#how-it-works" className="text-small text-text-secondary hover:text-text-primary transition-colors">Workflow</Link></li>
            <li><Link href="#security" className="text-small text-text-secondary hover:text-text-primary transition-colors">Security</Link></li>
            <li><Link href="#pricing" className="text-small text-text-secondary hover:text-text-primary transition-colors">Pricing</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-text-primary mb-md">Resources</h4>
          <ul className="space-y-sm">
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">Documentation</Link></li>
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">API Reference</Link></li>
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">Help Center</Link></li>
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">Contact Support</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-text-primary mb-md">Company</h4>
          <ul className="space-y-sm">
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">About</Link></li>
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="text-small text-text-secondary hover:text-text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="https://github.com" target="_blank" className="text-small text-text-secondary hover:text-text-primary transition-colors">GitHub</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1200px] mx-auto mt-2xl pt-lg border-t border-text-secondary/10 flex flex-col md:flex-row items-center justify-between gap-md">
        <p className="text-small text-text-secondary">© {new Date().getFullYear()} Veldra. All rights reserved.</p>
        <div className="flex gap-md">
          {/* Social icons could go here */}
        </div>
      </div>
    </footer>
  );
}
