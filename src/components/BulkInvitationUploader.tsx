import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BulkInvitationData {
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  visit_purpose: string;
  visit_date: string;
  resident_id: string;
}

interface UploadProgress {
  total: number;
  processed: number;
  errors: number;
  success: number;
}

export const BulkInvitationUploader: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    processed: 0,
    errors: 0,
    success: 0
  });
  const [csvData, setCsvData] = useState<BulkInvitationData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      parseCSV(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    maxFiles: 1
  });

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const requiredHeaders = ['visitor_name', 'visitor_email', 'visitor_phone', 'visit_purpose', 'visit_date'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      toast({
        title: "Invalid CSV format",
        description: `Missing required headers: ${missingHeaders.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const data: BulkInvitationData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 5 && values[0]?.trim()) {
        data.push({
          visitor_name: values[0]?.trim() || '',
          visitor_email: values[1]?.trim() || '',
          visitor_phone: values[2]?.trim() || '',
          visit_purpose: values[3]?.trim() || '',
          visit_date: values[4]?.trim() || '',
          resident_id: ''
        });
      }
    }

    setCsvData(data);
    setUploadProgress({ total: data.length, processed: 0, errors: 0, success: 0 });
  };

  const processBulkInvitations = async () => {
    if (csvData.length === 0) {
      toast({
        title: "No data to process",
        description: "Please upload a CSV file first",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to send invitations",
          variant: "destructive"
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your profile setup",
          variant: "destructive"
        });
        return;
      }

      const processed = 0;
      let errors = 0;
      let success = 0;

      for (let i = 0; i < csvData.length; i++) {
        const invitation = csvData[i];
        try {
          const { error } = await supabase.functions.invoke("create-invitation", {
            body: {
              visitor_full_name: invitation.visitor_name,
              visitor_email: invitation.visitor_email,
              visitor_phone_number: invitation.visitor_phone,
              visit_purpose: invitation.visit_purpose,
              visit_date: invitation.visit_date,
              resident_id: profile.id
            }
          });

          if (error) {
            errors++;
          } else {
            success++;
          }
        } catch (error) {
          errors++;
        }

        setUploadProgress(prev => ({
          ...prev,
          processed: i + 1,
          errors,
          success
        }));
      }

      toast({
        title: "Bulk invitations processed",
        description: `${success} invitations sent successfully, ${errors} errors`,
        variant: errors > 0 ? "default" : "default"
      });

    } catch (error) {
      toast({
        title: "Processing failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Visitor Registration</CardTitle>
        <CardDescription>
          Upload a CSV file to register multiple visitors at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">
            {isDragActive ? 'Drop the CSV file here...' : 'Drag & drop a CSV file here, or click to select'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: CSV, Excel
          </p>
        </div>

        {csvData.length > 0 && (
          <>
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Found {csvData.length} visitors to register
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{uploadProgress.processed} / {uploadProgress.total}</span>
              </div>
              <Progress value={(uploadProgress.processed / uploadProgress.total) * 100} />
              
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{uploadProgress.success} successful</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>{uploadProgress.errors} errors</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={processBulkInvitations} 
              disabled={isUploading || uploadProgress.processed === uploadProgress.total}
              className="w-full"
            >
              {isUploading ? 'Processing...' : 'Send Invitations'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
