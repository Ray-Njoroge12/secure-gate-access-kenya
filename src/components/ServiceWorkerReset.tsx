import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export const ServiceWorkerReset = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [hasReset, setHasReset] = useState(false);
  const { clearServiceWorkerData } = useServiceWorker();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await clearServiceWorkerData();
      setHasReset(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsResetting(false);
    }
  };

  if (hasReset) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Reset Complete</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Service worker data has been cleared. The page will refresh automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Service Worker Issues?</CardTitle>
        </div>
        <CardDescription>
          If you're experiencing repeated update prompts or other service worker issues, 
          you can reset the service worker data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleReset} 
          disabled={isResetting}
          className="w-full"
          variant="outline"
        >
          {isResetting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Service Worker
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          This will clear all cached data and restart the service worker.
        </p>
      </CardContent>
    </Card>
  );
};

