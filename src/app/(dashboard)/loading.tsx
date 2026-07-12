import { PageContainer } from "@/components/layouts/PageContainer";

export default function Loading() {
  return (
    <PageContainer>
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-md">
        <div className="w-12 h-12 border-4 border-text-secondary/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-body text-text-secondary animate-pulse font-medium">Loading...</p>
      </div>
    </PageContainer>
  );
}
