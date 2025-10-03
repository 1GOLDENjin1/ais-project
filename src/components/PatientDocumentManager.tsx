import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Share2, 
  Plus, 
  Filter,
  Search,
  Calendar,
  User,
  FileImage,
  FilePlus2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/db';

interface PatientDocument {
  id: string;
  patientId: string;
  documentType: 'lab_result' | 'prescription' | 'medical_certificate' | 'imaging' | 'insurance_card' | 'id_document' | 'other';
  documentName: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  description: string;
  isConfidential: boolean;
  uploadedBy: string;
  uploadedByName: string;
  relatedAppointmentId?: string;
  documentDate: string;
  expiryDate?: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

interface DocumentUploadProps {
  patientId: string;
  onDocumentUploaded: (document: PatientDocument) => void;
}

interface DocumentManagerProps {
  patientId: string;
  userRole: 'patient' | 'doctor' | 'staff' | 'admin';
  currentUserId: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ patientId, onDocumentUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    documentName: '',
    category: '',
    description: '',
    isConfidential: true,
    documentDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'lab_result', label: 'Lab Result', icon: FileText },
    { value: 'prescription', label: 'Prescription', icon: FilePlus2 },
    { value: 'medical_certificate', label: 'Medical Certificate', icon: FileText },
    { value: 'imaging', label: 'Medical Imaging', icon: FileImage },
    { value: 'insurance_card', label: 'Insurance Card', icon: FileText },
    { value: 'id_document', label: 'ID Document', icon: FileText },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, image, or document file",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      if (!formData.documentName) {
        setFormData(prev => ({ ...prev, documentName: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.documentType || !formData.documentName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // In a real implementation, you would upload the file to a cloud service
      // For now, we'll simulate this with a data URL
      const fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // Create document record
      const documentData = {
        patientId,
        documentType: formData.documentType as PatientDocument['documentType'],
        documentName: formData.documentName,
        filePath: fileDataUrl, // In production, this would be a cloud URL
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        category: formData.category || formData.documentType,
        description: formData.description,
        isConfidential: formData.isConfidential,
        uploadedBy: 'current-user-id', // This would be the actual current user ID
        uploadedByName: 'Current User', // This would be the actual current user name
        documentDate: formData.documentDate,
        expiryDate: formData.expiryDate || undefined,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Simulate document creation (in real app, this would go to your database)
      const newDocument: PatientDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...documentData
      };

      toast({
        title: "Document Uploaded Successfully! 📄",
        description: `${formData.documentName} has been added to medical records`,
      });

      onDocumentUploaded(newDocument);

      // Reset form
      setFormData({
        documentType: '',
        documentName: '',
        category: '',
        description: '',
        isConfidential: true,
        documentDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload New Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div>
          <Label>Select File *</Label>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx"
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {selectedFile ? (
                <>
                  <span className="font-semibold text-blue-600">{selectedFile.name}</span>
                  <br />
                  <span className="text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>Click to upload or drag and drop<br />
                <span className="text-xs">PDF, Images, Documents (Max 10MB)</span></>
              )}
            </p>
          </div>
        </div>

        {/* Document Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Document Type *</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Document Name *</Label>
            <Input
              value={formData.documentName}
              onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
              placeholder="Enter document name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Document Date *</Label>
            <Input
              type="date"
              value={formData.documentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, documentDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>Expiry Date (if applicable)</Label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label>Category</Label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Optional category or tag"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Additional notes or description"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isConfidential"
            checked={formData.isConfidential}
            onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="isConfidential">Mark as confidential</Label>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={isUploading || !selectedFile || !formData.documentType || !formData.documentName}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
};

export const PatientDocumentManager: React.FC<DocumentManagerProps> = ({
  patientId,
  userRole,
  currentUserId
}) => {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<PatientDocument | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({
    documentType: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [patientId]);

  useEffect(() => {
    applyFilters();
  }, [documents, filters]);

  const loadDocuments = async () => {
    try {
      // Simulate loading documents from database
      const mockDocuments: PatientDocument[] = [
        {
          id: 'doc_1',
          patientId,
          documentType: 'lab_result',
          documentName: 'Blood Chemistry Panel - September 2025',
          filePath: 'mock_file_path_1',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          category: 'Laboratory',
          description: 'Complete blood chemistry including glucose, cholesterol, and liver function tests',
          isConfidential: true,
          uploadedBy: 'doc_123',
          uploadedByName: 'Dr. Maria Santos',
          relatedAppointmentId: 'apt_1',
          documentDate: '2025-09-25',
          status: 'active',
          createdAt: '2025-09-25T10:30:00Z',
          updatedAt: '2025-09-25T10:30:00Z'
        },
        {
          id: 'doc_2',
          patientId,
          documentType: 'prescription',
          documentName: 'Hypertension Medication - Dr. Santos',
          filePath: 'mock_file_path_2',
          fileSize: 512000,
          mimeType: 'application/pdf',
          category: 'Prescription',
          description: 'Prescription for blood pressure management',
          isConfidential: true,
          uploadedBy: 'doc_123',
          uploadedByName: 'Dr. Maria Santos',
          relatedAppointmentId: 'apt_1',
          documentDate: '2025-09-20',
          expiryDate: '2026-09-20',
          status: 'active',
          createdAt: '2025-09-20T14:15:00Z',
          updatedAt: '2025-09-20T14:15:00Z'
        },
        {
          id: 'doc_3',
          patientId,
          documentType: 'imaging',
          documentName: 'Chest X-Ray - Normal',
          filePath: 'mock_file_path_3',
          fileSize: 2048000,
          mimeType: 'image/jpeg',
          category: 'Radiology',
          description: 'Chest X-ray showing normal lung fields and heart size',
          isConfidential: true,
          uploadedBy: 'tech_456',
          uploadedByName: 'Radiologic Technologist',
          documentDate: '2025-09-18',
          status: 'active',
          createdAt: '2025-09-18T09:45:00Z',
          updatedAt: '2025-09-18T09:45:00Z'
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }

    if (filters.category) {
      filtered = filtered.filter(doc => 
        doc.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(doc =>
        doc.documentName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(doc => doc.documentDate >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(doc => doc.documentDate <= filters.dateTo);
    }

    setFilteredDocuments(filtered);
  };

  const handleDocumentUploaded = (newDocument: PatientDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
    setShowUpload(false);
  };

  const handleViewDocument = (document: PatientDocument) => {
    setSelectedDocument(document);
    // In a real implementation, this would open the document in a viewer or download it
    toast({
      title: "Document Viewer",
      description: `Opening ${document.documentName}...`,
    });
  };

  const handleDownloadDocument = (document: PatientDocument) => {
    // In a real implementation, this would trigger a download
    toast({
      title: "Download Started",
      description: `Downloading ${document.documentName}...`,
    });
  };

  const handleShareDocument = (document: PatientDocument) => {
    // In a real implementation, this would open a sharing dialog
    toast({
      title: "Share Document",
      description: `Sharing options for ${document.documentName}...`,
    });
  };

  const getDocumentIcon = (type: string, mimeType: string) => {
    if (mimeType?.startsWith('image/')) return FileImage;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Medical Documents</h2>
          <p className="text-gray-600">Manage patient medical records and documents</p>
        </div>
        {(userRole === 'patient' || userRole === 'doctor' || userRole === 'staff') && (
          <Button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Upload Section */}
      {showUpload && (
        <DocumentUpload
          patientId={patientId}
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Document Type</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, documentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="lab_result">Lab Results</SelectItem>
                  <SelectItem value="prescription">Prescriptions</SelectItem>
                  <SelectItem value="medical_certificate">Medical Certificates</SelectItem>
                  <SelectItem value="imaging">Medical Imaging</SelectItem>
                  <SelectItem value="insurance_card">Insurance Cards</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((document) => {
          const Icon = getDocumentIcon(document.documentType, document.mimeType || '');
          return (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <Badge variant="secondary" className="text-xs">
                      {document.documentType.replace('_', ' ')}
                    </Badge>
                  </div>
                  {document.isConfidential && (
                    <Badge variant="destructive" className="text-xs">
                      Confidential
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base line-clamp-2">
                  {document.documentName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {document.description}
                </p>
                
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(document.documentDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {document.uploadedByName}
                  </div>
                  {document.fileSize && (
                    <div>{formatFileSize(document.fileSize)}</div>
                  )}
                  {document.expiryDate && (
                    <div className="text-yellow-600">
                      Expires: {new Date(document.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDocument(document)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(document)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareDocument(document)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-gray-600">
              {documents.length === 0 
                ? "No documents have been uploaded yet." 
                : "No documents match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};