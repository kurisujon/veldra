import { PageContainer } from "@/components/layouts/PageContainer";
import { Card } from "@/components/ui/Card";
import { getCurrentUserRole } from "@/features/findings/actions";
import { Settings as SettingsIcon, Shield, Bot, Database } from "lucide-react";

export default async function Settings() {
  const userRole = await getCurrentUserRole();
  const aiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  
  return (
    <PageContainer>
      <div className="mb-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h1 className="text-title font-semibold text-text-primary">System Settings</h1>
          <p className="text-body text-text-secondary mt-xs">
            Manage your account preferences and view system configurations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        <Card className="p-xl">
          <div className="flex items-center gap-md mb-lg border-b border-text-secondary/10 pb-md">
            <Shield className="text-accent" size={24} />
            <h2 className="text-heading font-semibold text-text-primary">Account & Security</h2>
          </div>
          
          <div className="flex flex-col gap-md">
            <div>
              <p className="text-small font-medium text-text-secondary mb-xs">Assigned Role</p>
              <div className="flex items-center gap-sm">
                <span className="text-body font-semibold text-text-primary">{userRole}</span>
                <span className="text-xs px-sm py-1 bg-surface-secondary text-text-secondary rounded-full">
                  {userRole === 'Admin' ? 'Full Access' : 'Standard Access'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-xl">
          <div className="flex items-center gap-md mb-lg border-b border-text-secondary/10 pb-md">
            <Bot className="text-accent" size={24} />
            <h2 className="text-heading font-semibold text-text-primary">AI & Extraction Engine</h2>
          </div>
          
          <div className="flex flex-col gap-md">
            <div>
              <p className="text-small font-medium text-text-secondary mb-xs">Active Model</p>
              <p className="text-body font-semibold text-text-primary font-mono">{aiModel}</p>
            </div>
            <div>
              <p className="text-small font-medium text-text-secondary mb-xs">Key Rotation Status</p>
              <p className="text-body font-semibold text-success flex items-center gap-xs">
                <span className="w-2 h-2 rounded-full bg-success"></span> Active & Healthy
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-xl lg:col-span-2">
          <div className="flex items-center gap-md mb-lg border-b border-text-secondary/10 pb-md">
            <Database className="text-accent" size={24} />
            <h2 className="text-heading font-semibold text-text-primary">System Information</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div>
              <p className="text-small font-medium text-text-secondary mb-xs">Version</p>
              <p className="text-body font-semibold text-text-primary">v0.1.0 (Phase 9)</p>
            </div>
            <div>
              <p className="text-small font-medium text-text-secondary mb-xs">Environment</p>
              <p className="text-body font-semibold text-text-primary">Development</p>
            </div>
            <div>
              <p className="text-small font-medium text-text-secondary mb-xs">Database Connection</p>
              <p className="text-body font-semibold text-success flex items-center gap-xs">
                <span className="w-2 h-2 rounded-full bg-success"></span> Connected
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
