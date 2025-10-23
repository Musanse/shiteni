'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download,
  RefreshCw,
  Database,
  AlertCircle as AlertCircleIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  X,
  Edit,
  CreditCard,
  TrendingUp,
  Activity,
  Shield,
  Zap,
  Plus,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileImage,
  Upload,
  ArrowLeft
} from 'lucide-react';

interface LoanApplication {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  dateOfBirth?: string;
  occupation?: string;
  loanType: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: string;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  monthlyPayment: number;
  remainingBalance: number;
  nextPaymentDate?: string;
  institutionName: string;
  riskLevel: string;
  purpose?: string;
  monthlyIncome?: number;
  employmentStatus?: string;
  employerName?: string;
  employmentDuration?: string;
  reference1Name?: string;
  reference1Phone?: string;
  reference1Relationship?: string;
  reference2Name?: string;
  reference2Phone?: string;
  reference2Relationship?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
  guarantorAddress?: string;
  guarantorRelationship?: string;
  guarantorMonthlyIncome?: number;
  guarantor?: {
    name: string;
    relationship: string;
    contact: string;
  };
  documents?: { [key: string]: string };
}

interface Institution {
  _id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registrationDate: string;
  products: LoanProduct[];
}

interface LoanProduct {
  _id: string;
  name: string;
  description: string;
  type: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTermMonths: number;
  maxTermMonths: number;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  processingFee: number;
  guarantorRequired: boolean;
}

interface ApplicationForm {
  // Customer Information
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  
  // Loan Details
  loanType: string;
  amount: number;
  termMonths: number;
  purpose: string;
  
  // Financial Information
  monthlyIncome: number;
  employmentStatus: string;
  employerName: string;
  employmentDuration: string;
  
  // References
  reference1Name: string;
  reference1Phone: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Phone: string;
  reference2Relationship: string;
  
  // Guarantor Information
  guarantorName: string;
  guarantorPhone: string;
  guarantorEmail: string;
  guarantorAddress: string;
  guarantorRelationship: string;
  guarantorMonthlyIncome: number;
  
  // Documents
  documents: {
    customerId: File | null;
    customerPayslip: File | null;
    customerBankStatement: File | null;
    guarantorId: File | null;
    guarantorPayslip: File | null;
    guarantorBankStatement: File | null;
  };
}

export default function CustomerApply() {
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [showProgressiveForm, setShowProgressiveForm] = useState(false);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<LoanApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationForm>({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    loanType: '',
    amount: 0,
    termMonths: 0,
    purpose: '',
    monthlyIncome: 0,
    employmentStatus: '',
    employerName: '',
    employmentDuration: '',
    reference1Name: '',
    reference1Phone: '',
    reference1Relationship: '',
    reference2Name: '',
    reference2Phone: '',
    reference2Relationship: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorEmail: '',
    guarantorAddress: '',
    guarantorRelationship: '',
    guarantorMonthlyIncome: 0,
    documents: {
      customerId: null,
      customerPayslip: null,
      customerBankStatement: null,
      guarantorId: null,
      guarantorPayslip: null,
      guarantorBankStatement: null,
    }
  });

  // Fetch user profile and pre-fill form
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/profile');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw profile data:', data);
        
        // The API returns { success: true, user: { ... } }
        const userData = data.user || data;
        const fullName = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        
        // Pre-fill customer information in the form
        setFormData(prev => ({
          ...prev,
          customerId: userData.id || '',
          customerName: fullName || '',
          customerEmail: userData.email || '',
        }));
        
        console.log('User profile loaded and form pre-filled:', {
          customerId: userData.id,
          name: fullName,
          email: userData.email
        });
      } else {
        console.error('Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  // Fetch loan applications from database
  const fetchLoanApplications = useCallback(async () => {
    try {
      setLoansLoading(true);
      const response = await fetch('/api/customer/loans');
      
      if (response.ok) {
        const data = await response.json();
        setLoanApplications(data.loans || []);
      } else {
        console.error('Failed to fetch loan applications:', response.statusText);
        setLoanApplications(getMockLoanApplications());
      }
    } catch (error) {
      console.error('Error fetching loan applications:', error);
      setLoanApplications(getMockLoanApplications());
    } finally {
      setLoansLoading(false);
    }
  }, []);

  // Fetch institutions and their products from database
  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/institutions');
      
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
        setIsRealData(true);
      } else if (response.status === 401) {
        console.warn('Unauthorized - using mock data');
        setInstitutions(getMockInstitutions());
        setIsRealData(false);
      } else {
        console.error('Failed to fetch institutions:', response.statusText);
        setInstitutions(getMockInstitutions());
        setIsRealData(false);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setInstitutions(getMockInstitutions());
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchInstitutions();
    fetchLoanApplications();
  }, [fetchUserProfile, fetchInstitutions, fetchLoanApplications]);

  const getMockLoanApplications = (): LoanApplication[] => [
    {
      _id: 'mock_loan1',
      loanType: 'Personal Loan',
      amount: 50000,
      interestRate: 8.5,
      termMonths: 24,
      status: 'approved',
      applicationDate: '2024-01-15T00:00:00.000Z',
      approvalDate: '2024-01-20T00:00:00.000Z',
      disbursementDate: '2024-01-25T00:00:00.000Z',
      monthlyPayment: 2200,
      remainingBalance: 35000,
      nextPaymentDate: '2024-02-25T00:00:00.000Z',
      institutionName: 'First National Bank',
      riskLevel: 'low'
    },
    {
      _id: 'mock_loan2',
      loanType: 'Business Loan',
      amount: 150000,
      interestRate: 6.2,
      termMonths: 36,
      status: 'pending_review',
      applicationDate: '2024-02-01T00:00:00.000Z',
      monthlyPayment: 4500,
      remainingBalance: 150000,
      institutionName: 'Commercial Bank',
      riskLevel: 'medium'
    },
    {
      _id: 'mock_loan3',
      loanType: 'Auto Loan',
      amount: 80000,
      interestRate: 7.8,
      termMonths: 48,
      status: 'rejected',
      applicationDate: '2023-12-10T00:00:00.000Z',
      monthlyPayment: 2000,
      remainingBalance: 0,
      institutionName: 'Auto Finance Co',
      riskLevel: 'high'
    }
  ];

  const getMockInstitutions = (): Institution[] => [
    {
      _id: 'mock_inst1',
      name: 'First National Bank',
      description: 'Leading financial institution providing comprehensive banking services',
      address: '123 Main Street, Lusaka',
      phone: '+260 211 123456',
      email: 'info@fnb.co.zm',
      website: 'www.fnb.co.zm',
      registrationDate: '2020-01-15T00:00:00.000Z',
      products: [
        {
          _id: 'mock_prod1',
      name: 'Personal Loan',
      description: 'Quick personal loan for immediate needs',
      type: 'Personal Loan',
      minAmount: 5000,
      maxAmount: 100000,
      interestRate: 8.5,
      minTermMonths: 6,
      maxTermMonths: 36,
      eligibilityCriteria: ['Minimum age 21', 'Stable income', 'Good credit history'],
      requiredDocuments: ['National ID', 'Payslip', 'Bank Statement'],
      processingFee: 500,
      guarantorRequired: false
        }
      ]
    },
    {
      _id: 'mock_inst2',
      name: 'Commercial Bank',
      description: 'Business-focused banking solutions for enterprises',
      address: '456 Business Avenue, Lusaka',
      phone: '+260 211 234567',
      email: 'business@commercialbank.co.zm',
      website: 'www.commercialbank.co.zm',
      registrationDate: '2019-03-20T00:00:00.000Z',
      products: [
        {
          _id: 'mock_prod2',
      name: 'Business Loan',
      description: 'Funding for business growth and expansion',
      type: 'Business Loan',
      minAmount: 25000,
      maxAmount: 500000,
      interestRate: 6.2,
      minTermMonths: 12,
      maxTermMonths: 60,
      eligibilityCriteria: ['Business registration', 'Minimum 2 years operation', 'Financial statements'],
      requiredDocuments: ['Business License', 'Financial Statements', 'Tax Returns'],
      processingFee: 1000,
      guarantorRequired: true
        }
      ]
    },
    {
      _id: 'mock_inst3',
      name: 'Auto Finance Co',
      description: 'Specialized vehicle financing solutions',
      address: '789 Auto Plaza, Lusaka',
      phone: '+260 211 345678',
      email: 'loans@autofinance.co.zm',
      website: 'www.autofinance.co.zm',
      registrationDate: '2021-06-10T00:00:00.000Z',
      products: [
        {
          _id: 'mock_prod3',
      name: 'Auto Loan',
      description: 'Vehicle financing with competitive rates',
      type: 'Auto Loan',
      minAmount: 10000,
      maxAmount: 200000,
      interestRate: 7.8,
      minTermMonths: 12,
      maxTermMonths: 48,
      eligibilityCriteria: ['Valid driver license', 'Vehicle insurance', 'Down payment'],
      requiredDocuments: ['Driver License', 'Vehicle Registration', 'Insurance Certificate'],
      processingFee: 750,
      guarantorRequired: false
        }
      ]
    }
  ];

  // Get all products from all institutions
  const allProducts = institutions.flatMap(institution => 
    institution.products.map(product => ({
      ...product,
      institutionName: institution.name,
      institutionId: institution._id
    }))
  );

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.institutionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || product.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    setProducts(institution.products);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'disbursed':
        return <Badge className="bg-blue-100 text-blue-800">Disbursed</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="outline" className="text-green-600 border-green-600">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-red-600 border-red-600">High Risk</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefreshAll = () => {
    fetchInstitutions();
    fetchLoanApplications();
  };

  const handleProductSelect = (product: LoanProduct & { institutionName: string; institutionId: string }) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      loanType: product.type,
      amount: product.minAmount,
      termMonths: product.minTermMonths
    }));
    setShowApplicationForm(true);
    setCurrentStep(1);
  };

  const handleFormChange = (field: keyof ApplicationForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentChange = (field: keyof ApplicationForm['documents'], file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const calculateMonthlyPayment = (amount: number, interestRate: number, termMonths: number) => {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(monthlyPayment);
  };

  const handleSubmitApplication = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      // Upload documents first
      const uploadedDocuments: { [key: string]: string } = {};
      const documentUploadPromises = [];
      
      // Customer documents
      for (const [key, file] of Object.entries(formData.documents)) {
        if (file) {
          const uploadPromise = (async () => {
            const formDataObj = new FormData();
            formDataObj.append('file', file);
            formDataObj.append('type', key);
            
            const uploadResponse = await fetch('/api/customer/upload', {
              method: 'POST',
              body: formDataObj
            });
            
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              uploadedDocuments[key] = uploadData.filename;
            } else {
              const error = await uploadResponse.json();
              throw new Error(`Failed to upload ${key}: ${error.error}`);
            }
          })();
          documentUploadPromises.push(uploadPromise);
        }
      }

      // Wait for all uploads to complete
      try {
        await Promise.all(documentUploadPromises);
      } catch (error) {
        throw new Error(`Document upload failed: ${error.message}`);
      }

      // Prepare application data
      console.log('Selected Product:', {
        institutionId: selectedProduct.institutionId,
        institutionName: selectedProduct.institutionName,
        type: selectedProduct.type
      });
      
      const applicationData = {
        ...formData,
        institutionId: selectedProduct.institutionId,
        institutionName: selectedProduct.institutionName,
        interestRate: selectedProduct.interestRate,
        monthlyPayment: calculateMonthlyPayment(formData.amount, selectedProduct.interestRate, formData.termMonths),
        documents: uploadedDocuments,
        // Add required fields
        customerId: formData.customerId || '',
        customerName: formData.customerName || '',
        customerEmail: formData.customerEmail || '',
        customerPhone: formData.customerPhone || '',
        customerAddress: formData.customerAddress || '',
        loanType: selectedProduct.type,
        amount: formData.amount || 0,
        termMonths: formData.termMonths || 0,
        purpose: formData.purpose || '',
        // Add optional fields with defaults
        monthlyIncome: formData.monthlyIncome || 0,
        employmentStatus: formData.employmentStatus || '',
        employerName: formData.employerName || '',
        employmentDuration: formData.employmentDuration || '',
        reference1Name: formData.reference1Name || '',
        reference1Phone: formData.reference1Phone || '',
        reference1Relationship: formData.reference1Relationship || '',
        reference2Name: formData.reference2Name || '',
        reference2Phone: formData.reference2Phone || '',
        reference2Relationship: formData.reference2Relationship || '',
        guarantorName: formData.guarantorName || '',
        guarantorPhone: formData.guarantorPhone || '',
        guarantorEmail: formData.guarantorEmail || '',
        guarantorAddress: formData.guarantorAddress || '',
        guarantorRelationship: formData.guarantorRelationship || '',
        guarantorMonthlyIncome: formData.guarantorMonthlyIncome || 0
      };

      // Submit application
      const response = await fetch('/api/customer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        // Use a proper alert dialog
        const alertDialog = document.createElement('div');
        alertDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        alertDialog.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-green-600 mb-2">Success!</h3>
            <p class="text-gray-600 mb-4">Your loan application has been submitted successfully.</p>
            <button class="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90">OK</button>
          </div>
        `;
        document.body.appendChild(alertDialog);
        
        // Refresh loan applications list to show the newly submitted loan
        await fetchLoanApplications();
        
        // Handle close
        const closeDialog = () => {
          document.body.removeChild(alertDialog);
          setShowProgressiveForm(false);
          setSelectedProduct(null);
          setCurrentStep(1);
        };
        
        alertDialog.querySelector('button')?.addEventListener('click', closeDialog);
        alertDialog.addEventListener('click', (e) => {
          if (e.target === alertDialog) closeDialog();
        });
        setFormData({
          customerId: '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: '',
          loanType: '',
          amount: 0,
          termMonths: 0,
          purpose: '',
          monthlyIncome: 0,
          employmentStatus: '',
          employerName: '',
          employmentDuration: '',
          reference1Name: '',
          reference1Phone: '',
          reference1Relationship: '',
          reference2Name: '',
          reference2Phone: '',
          reference2Relationship: '',
          guarantorName: '',
          guarantorPhone: '',
          guarantorEmail: '',
          guarantorAddress: '',
          guarantorRelationship: '',
          guarantorMonthlyIncome: 0,
          documents: {
            customerId: null,
            customerPayslip: null,
            customerBankStatement: null,
            guarantorId: null,
            guarantorPayslip: null,
            guarantorBankStatement: null,
          }
        });
      } else {
        let errorMessage = 'Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        // Show error dialog
        const errorDialog = document.createElement('div');
        errorDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        errorDialog.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
            <p class="text-gray-600 mb-4">Failed to submit application: ${errorMessage}</p>
            <button class="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">Close</button>
          </div>
        `;
        document.body.appendChild(errorDialog);
        
        // Handle close
        const closeDialog = () => {
          document.body.removeChild(errorDialog);
        };
        
        errorDialog.querySelector('button')?.addEventListener('click', closeDialog);
        errorDialog.addEventListener('click', (e) => {
          if (e.target === errorDialog) closeDialog();
        });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      // Show error dialog
      const errorDialog = document.createElement('div');
      errorDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      errorDialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p class="text-gray-600 mb-4">An error occurred while submitting your application. Please try again.</p>
          <button class="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">Close</button>
        </div>
      `;
      document.body.appendChild(errorDialog);
      
      // Handle close
      const closeDialog = () => {
        document.body.removeChild(errorDialog);
      };
      
      errorDialog.querySelector('button')?.addEventListener('click', closeDialog);
      errorDialog.addEventListener('click', (e) => {
        if (e.target === errorDialog) closeDialog();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading loan products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Apply for Loan
          </h1>
          <p className="text-muted-foreground">Browse available loan products and submit your application</p>
          {isRealData ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                <Database className="w-3 h-3" />
                Live Data
              </div>
              <span className="text-sm text-green-600">Showing real loan products from database</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                <AlertCircleIcon className="w-3 h-3" />
                Demo Data
              </div>
              <span className="text-sm text-yellow-600">Please log in to see real loan products</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowProgressiveForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Apply for Loan
          </Button>
        <Button 
          variant="outline" 
            onClick={handleRefreshAll}
            disabled={loading || loansLoading}
          className="flex items-center gap-2"
        >
            <RefreshCw className={`h-4 w-4 ${(loading || loansLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        </div>
      </div>

      {!showProgressiveForm ? (
        <>
          {/* Loan Applications History */}
          <Card>
                <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                My Loan Applications
                  </CardTitle>
              <CardDescription>
                View your past and current loan applications
              </CardDescription>
                </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading loan applications...</span>
                    </div>
              ) : loanApplications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Loan Applications</h3>
                  <p className="text-muted-foreground">You haven't applied for any loans yet.</p>
                    </div>
              ) : (
                <div className="space-y-4">
                  {loanApplications.map((application) => (
                    <Card key={application._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{application.loanType}</h3>
                              {getStatusBadge(application.status)}
                              {getRiskBadge(application.riskLevel)}
                    </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-medium ml-2">ZMW {application.amount.toLocaleString()}</span>
                    </div>
                              <div>
                                <span className="text-muted-foreground">Interest Rate:</span>
                                <span className="font-medium ml-2">{application.interestRate}%</span>
                  </div>
                              <div>
                                <span className="text-muted-foreground">Term:</span>
                                <span className="font-medium ml-2">{application.termMonths} months</span>
                  </div>
                              <div>
                                <span className="text-muted-foreground">Institution:</span>
                                <span className="font-medium ml-2">{application.institutionName}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Applied:</span>
                                <span className="font-medium ml-2">{formatDate(application.applicationDate)}</span>
                              </div>
                              {application.approvalDate && (
                                <div>
                                  <span className="text-muted-foreground">Approved:</span>
                                  <span className="font-medium ml-2">{formatDate(application.approvalDate)}</span>
                                </div>
                              )}
                            </div>
                            {application.status === 'approved' && application.remainingBalance > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Monthly Payment:</span>
                                    <span className="font-medium ml-2">ZMW {application.monthlyPayment.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Remaining Balance:</span>
                                    <span className="font-medium ml-2">ZMW {application.remainingBalance.toLocaleString()}</span>
                                  </div>
                                  {application.nextPaymentDate && (
                                    <div className="md:col-span-2">
                                      <span className="text-muted-foreground">Next Payment:</span>
                                      <span className="font-medium ml-2">{formatDate(application.nextPaymentDate)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedLoanForDetails(application);
                                setShowLoanDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            {application.status === 'approved' && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                </CardContent>
              </Card>
            ))}
          </div>
              )}
            </CardContent>
          </Card>

        </>
      ) : (
        /* Progressive Loan Application Form */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Loan Application Form
                </CardTitle>
            <CardDescription>
                  Step {currentStep} of 7: Complete all required information
            </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowProgressiveForm(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Applications
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round((currentStep / 7) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Institution and Loan Type Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Select Institution and Loan Type</h3>
                
                {/* Institution Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Choose Financial Institution *</label>
                  <select
                    value={selectedInstitution?._id || ''}
                    onChange={(e) => {
                      const institution = institutions.find(inst => inst._id === e.target.value);
                      setSelectedInstitution(institution || null);
                      setSelectedProduct(null); // Reset product selection when institution changes
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select an institution...</option>
                    {institutions.map((institution) => (
                      <option key={institution._id} value={institution._id}>
                        {institution.name}
                      </option>
                    ))}
                  </select>
                  {selectedInstitution && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedInstitution.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedInstitution.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedInstitution.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <span className="text-muted-foreground">Products available:</span>
                        <span className="font-medium">{selectedInstitution.products?.length || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Loan Type Selection */}
                {selectedInstitution && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Choose Loan Type *</label>
                    {selectedInstitution.products && selectedInstitution.products.length > 0 ? (
                      <select
                        value={selectedProduct?._id || ''}
                        onChange={(e) => {
                          const product = selectedInstitution.products.find(prod => prod._id === e.target.value);
                          if (product) {
                            setSelectedProduct({...product, institutionName: selectedInstitution.name, institutionId: selectedInstitution._id});
                            // Pre-fill form data with product details
                            setFormData(prev => ({
                              ...prev,
                              loanType: product.type,
                              amount: product.minAmount,
                              termMonths: product.minTermMonths
                            }));
                          } else {
                            setSelectedProduct(null);
                          }
                        }}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select a loan type...</option>
                        {selectedInstitution.products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - {product.type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground">
                        <select disabled className="w-full bg-transparent">
                          <option>No loan products available for this institution</option>
                        </select>
                      </div>
                    )}
                    {selectedProduct && (
                      <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--coffee-brown)', color: 'white' }}>
                        <h4 className="font-medium mb-2 text-white">{selectedProduct.name}</h4>
                        <p className="text-sm text-white/80 mb-3">{selectedProduct.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-white/70">Amount Range:</span>
                            <div className="font-medium text-white">
                              ZMW {selectedProduct.minAmount.toLocaleString()} - ZMW {selectedProduct.maxAmount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-white/70">Interest Rate:</span>
                            <div className="font-medium text-white">{selectedProduct.interestRate}% APR</div>
                          </div>
                          <div>
                            <span className="text-white/70">Term:</span>
                            <div className="font-medium text-white">{selectedProduct.minTermMonths} - {selectedProduct.maxTermMonths} months</div>
                          </div>
                        </div>
                        {selectedProduct.eligibilityCriteria.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-white">Eligibility Requirements:</span>
                            <ul className="text-sm text-white/80 mt-1 space-y-1">
                              {selectedProduct.eligibilityCriteria.map((criteria, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                  {criteria}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Customer Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">National ID *</label>
                    <input
                      type="text"
                      value={formData.customerId}
                      onChange={(e) => handleFormChange('customerId', e.target.value)}
                      placeholder="Enter your National ID"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleFormChange('customerName', e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address *</label>
                    <textarea
                      value={formData.customerAddress}
                      onChange={(e) => handleFormChange('customerAddress', e.target.value)}
                      placeholder="Enter your address"
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Loan Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Loan Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Loan Type</label>
                    <input
                      type="text"
                      value={formData.loanType}
                      readOnly
                      className="w-full px-3 py-2 border border-input rounded-md bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (ZMW) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleFormChange('amount', Number(e.target.value))}
                      min={selectedProduct?.minAmount}
                      max={selectedProduct?.maxAmount}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: ZMW {selectedProduct?.minAmount.toLocaleString()} - ZMW {selectedProduct?.maxAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Term (Months) *</label>
                    <input
                      type="number"
                      value={formData.termMonths}
                      onChange={(e) => handleFormChange('termMonths', Number(e.target.value))}
                      min={selectedProduct?.minTermMonths}
                      max={selectedProduct?.maxTermMonths}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: {selectedProduct?.minTermMonths} - {selectedProduct?.maxTermMonths} months
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose *</label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => handleFormChange('purpose', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select purpose</option>
                      <option value="personal">Personal Use</option>
                      <option value="business">Business</option>
                      <option value="education">Education</option>
                      <option value="medical">Medical</option>
                      <option value="home">Home Improvement</option>
                      <option value="vehicle">Vehicle Purchase</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                {formData.amount > 0 && formData.termMonths > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Loan Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Monthly Payment:</span>
                        <span className="font-medium ml-2">
                          ZMW {calculateMonthlyPayment(formData.amount, selectedProduct?.interestRate || 0, formData.termMonths).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <span className="font-medium ml-2">{selectedProduct?.interestRate}% APR</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Financial Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Monthly Income (ZMW) *</label>
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => handleFormChange('monthlyIncome', Number(e.target.value))}
                      placeholder="Enter your monthly income"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employment Status *</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => handleFormChange('employmentStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select status</option>
                      <option value="employed">Employed</option>
                      <option value="self_employed">Self-Employed</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="retired">Retired</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employer Name</label>
                    <input
                      type="text"
                      value={formData.employerName}
                      onChange={(e) => handleFormChange('employerName', e.target.value)}
                      placeholder="Enter employer name"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employment Duration</label>
                    <select
                      value={formData.employmentDuration}
                      onChange={(e) => handleFormChange('employmentDuration', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select duration</option>
                      <option value="less_than_1_year">Less than 1 year</option>
                      <option value="1_2_years">1-2 years</option>
                      <option value="2_5_years">2-5 years</option>
                      <option value="more_than_5_years">More than 5 years</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: References */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">References</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Reference 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={formData.reference1Name}
                          onChange={(e) => handleFormChange('reference1Name', e.target.value)}
                          placeholder="Full name"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={formData.reference1Phone}
                          onChange={(e) => handleFormChange('reference1Phone', e.target.value)}
                          placeholder="Phone number"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Relationship *</label>
                        <select
                          value={formData.reference1Relationship}
                          onChange={(e) => handleFormChange('reference1Relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Select relationship</option>
                          <option value="family">Family</option>
                          <option value="friend">Friend</option>
                          <option value="colleague">Colleague</option>
                          <option value="neighbor">Neighbor</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Reference 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={formData.reference2Name}
                          onChange={(e) => handleFormChange('reference2Name', e.target.value)}
                          placeholder="Full name"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={formData.reference2Phone}
                          onChange={(e) => handleFormChange('reference2Phone', e.target.value)}
                          placeholder="Phone number"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Relationship *</label>
                        <select
                          value={formData.reference2Relationship}
                          onChange={(e) => handleFormChange('reference2Relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Select relationship</option>
                          <option value="family">Family</option>
                          <option value="friend">Friend</option>
                          <option value="colleague">Colleague</option>
                          <option value="neighbor">Neighbor</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Guarantor Information */}
            {currentStep === 6 && (
              <div className="space-y-4 p-6 rounded-lg" style={{ backgroundColor: 'black', color: 'white' }}>
                <h3 className="text-lg font-semibold text-white">Guarantor Information</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-600 border border-blue-500 rounded-lg">
                    <p className="text-sm text-white">
                      {selectedProduct?.guarantorRequired ? (
                        <>
                          <AlertTriangle className="h-4 w-4 inline mr-1 text-white" />
                          A guarantor is required for this loan type.
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 inline mr-1 text-white" />
                          Adding a guarantor is optional but may improve your loan approval chances.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Guarantor Name {selectedProduct?.guarantorRequired && '*'}</label>
                  <input
                    type="text"
                    value={formData.guarantorName}
                    onChange={(e) => handleFormChange('guarantorName', e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-gray-800 text-white placeholder-gray-300"
                  />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Phone {selectedProduct?.guarantorRequired && '*'}</label>
                      <input
                        type="tel"
                        value={formData.guarantorPhone}
                        onChange={(e) => handleFormChange('guarantorPhone', e.target.value)}
                        placeholder="Phone number"
                        className="w-full px-3 py-2 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-gray-800 text-white placeholder-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Email</label>
                      <input
                        type="email"
                        value={formData.guarantorEmail}
                        onChange={(e) => handleFormChange('guarantorEmail', e.target.value)}
                        placeholder="Email address"
                        className="w-full px-3 py-2 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-gray-800 text-white placeholder-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Relationship {selectedProduct?.guarantorRequired && '*'}</label>
                      <select
                        value={formData.guarantorRelationship}
                        onChange={(e) => handleFormChange('guarantorRelationship', e.target.value)}
                        className="w-full px-3 py-2 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-gray-800 text-white"
                      >
                        <option value="" className="bg-gray-800 text-white">Select relationship</option>
                        <option value="spouse" className="bg-gray-800 text-white">Spouse</option>
                        <option value="parent" className="bg-gray-800 text-white">Parent</option>
                        <option value="sibling" className="bg-gray-800 text-white">Sibling</option>
                        <option value="friend" className="bg-gray-800 text-white">Friend</option>
                        <option value="colleague" className="bg-gray-800 text-white">Colleague</option>
                        <option value="other" className="bg-gray-800 text-white">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-white">Address {selectedProduct?.guarantorRequired && '*'}</label>
                      <textarea
                        value={formData.guarantorAddress}
                        onChange={(e) => handleFormChange('guarantorAddress', e.target.value)}
                        placeholder="Enter guarantor address"
                        rows={3}
                        className="w-full px-3 py-2 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-gray-800 text-white placeholder-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Monthly Income (ZMW)</label>
                      <input
                        type="number"
                        value={formData.guarantorMonthlyIncome}
                        onChange={(e) => handleFormChange('guarantorMonthlyIncome', Number(e.target.value))}
                        placeholder="Enter monthly income"
                        className="w-full px-3 py-2 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 bg-gray-800 text-white placeholder-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Document Upload */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Document Upload</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Customer Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">National ID *</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentChange('customerId', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {formData.documents.customerId && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {formData.documents.customerId.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Payslip *</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentChange('customerPayslip', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {formData.documents.customerPayslip && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {formData.documents.customerPayslip.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Bank Statement *</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentChange('customerBankStatement', e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {formData.documents.customerBankStatement && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {formData.documents.customerBankStatement.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedProduct?.guarantorRequired && (
                    <div>
                      <h4 className="font-medium mb-3">Guarantor Documents</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Guarantor ID *</label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentChange('guarantorId', e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          {formData.documents.guarantorId && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {formData.documents.guarantorId.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Guarantor Payslip *</label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentChange('guarantorPayslip', e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          {formData.documents.guarantorPayslip && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {formData.documents.guarantorPayslip.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Guarantor Bank Statement *</label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentChange('guarantorBankStatement', e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          {formData.documents.guarantorBankStatement && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {formData.documents.guarantorBankStatement.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 7 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Details Modal */}
      {showLoanDetailsModal && selectedLoanForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--coffee-brown)', color: 'white' }}>
            <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
              <h2 className="text-xl font-semibold text-white">Loan Application Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLoanDetailsModal(false);
                  setSelectedLoanForDetails(null);
                }}
                className="border-white text-white hover:bg-white hover:text-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-white text-opacity-70">Loan Type:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.loanType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Amount:</span>
                    <p className="font-medium text-white">ZMW {selectedLoanForDetails.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Interest Rate:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.interestRate}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Term:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.termMonths} months</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Monthly Payment:</span>
                    <p className="font-medium text-white">ZMW {selectedLoanForDetails.monthlyPayment.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedLoanForDetails.status)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Risk Level:</span>
                    <div className="mt-1">{getRiskBadge(selectedLoanForDetails.riskLevel)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Institution:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.institutionName}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-white text-opacity-70">Name:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.customerName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Email:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Phone:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Address:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.customerAddress}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-white text-opacity-70">Monthly Income:</span>
                    <p className="font-medium text-white">ZMW {selectedLoanForDetails.monthlyIncome?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Employment Status:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.employmentStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Employer:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.employerName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Employment Duration:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.employmentDuration || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* References */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">References</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-white text-opacity-70">Reference 1:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.reference1Name || 'N/A'}</p>
                    <p className="text-sm text-white text-opacity-70">{selectedLoanForDetails.reference1Phone || ''}</p>
                    <p className="text-sm text-white text-opacity-70">{selectedLoanForDetails.reference1Relationship || ''}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Reference 2:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.reference2Name || 'N/A'}</p>
                    <p className="text-sm text-white text-opacity-70">{selectedLoanForDetails.reference2Phone || ''}</p>
                    <p className="text-sm text-white text-opacity-70">{selectedLoanForDetails.reference2Relationship || ''}</p>
                  </div>
                </div>
              </div>

              {/* Guarantor Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Guarantor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-white text-opacity-70">Name:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.guarantorName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Phone:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.guarantorPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Email:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.guarantorEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Relationship:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.guarantorRelationship || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Monthly Income:</span>
                    <p className="font-medium text-white">ZMW {selectedLoanForDetails.guarantorMonthlyIncome?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-white text-opacity-70">Address:</span>
                    <p className="font-medium text-white">{selectedLoanForDetails.guarantorAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#6B4423' }}>
                <h3 className="text-lg font-medium mb-4 text-white">Documents</h3>
                {selectedLoanForDetails.documents && Object.keys(selectedLoanForDetails.documents).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedLoanForDetails.documents).map(([key, filename]) => (
                      <div key={key} className="p-4 border border-white border-opacity-30 rounded-lg bg-black bg-opacity-20">
                        <div className="flex flex-col gap-3">
                          <div>
                            <span className="text-sm text-white text-opacity-70 capitalize block mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <p className="font-medium text-white text-sm break-all">{filename}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-white text-white hover:bg-white hover:text-gray-800"
                              onClick={() => window.open(`/uploads/${filename}`, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 border-white text-white hover:bg-white hover:text-gray-800"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/uploads/${filename}`;
                                link.download = filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-black bg-opacity-20 border border-white border-opacity-30 rounded-lg">
                    <p className="text-sm text-white text-opacity-70">No documents uploaded for this application.</p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Important Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-white text-opacity-70">Application Date:</span>
                    <p className="font-medium text-white">{formatDate(selectedLoanForDetails.applicationDate)}</p>
                  </div>
                  {selectedLoanForDetails.approvalDate && (
                    <div>
                      <span className="text-sm text-white text-opacity-70">Approval Date:</span>
                      <p className="font-medium text-white">{formatDate(selectedLoanForDetails.approvalDate)}</p>
                    </div>
                  )}
                  {selectedLoanForDetails.disbursementDate && (
                    <div>
                      <span className="text-sm text-white text-opacity-70">Disbursement Date:</span>
                      <p className="font-medium text-white">{formatDate(selectedLoanForDetails.disbursementDate)}</p>
                    </div>
                  )}
                  {selectedLoanForDetails.maturityDate && (
                    <div>
                      <span className="text-sm text-white text-opacity-70">Maturity Date:</span>
                      <p className="font-medium text-white">{formatDate(selectedLoanForDetails.maturityDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-white border-opacity-20">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLoanDetailsModal(false);
                  setSelectedLoanForDetails(null);
                }}
                className="border-white text-white hover:bg-white hover:text-gray-800"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Close modal
                  setShowLoanDetailsModal(false);
                  setSelectedLoanForDetails(null);
                  
                  // Pre-fill form data
                  setFormData({
                    customerId: selectedLoanForDetails.customerId || '',
                    customerName: selectedLoanForDetails.customerName || '',
                    customerEmail: selectedLoanForDetails.customerEmail || '',
                    customerPhone: selectedLoanForDetails.customerPhone || '',
                    customerAddress: selectedLoanForDetails.customerAddress || '',
                    loanType: selectedLoanForDetails.loanType || '',
                    amount: selectedLoanForDetails.amount || 0,
                    termMonths: selectedLoanForDetails.termMonths || 0,
                    purpose: selectedLoanForDetails.purpose || '',
                    monthlyIncome: selectedLoanForDetails.monthlyIncome || 0,
                    employmentStatus: selectedLoanForDetails.employmentStatus || '',
                    employerName: selectedLoanForDetails.employerName || '',
                    employmentDuration: selectedLoanForDetails.employmentDuration || '',
                    reference1Name: selectedLoanForDetails.reference1Name || '',
                    reference1Phone: selectedLoanForDetails.reference1Phone || '',
                    reference1Relationship: selectedLoanForDetails.reference1Relationship || '',
                    reference2Name: selectedLoanForDetails.reference2Name || '',
                    reference2Phone: selectedLoanForDetails.reference2Phone || '',
                    reference2Relationship: selectedLoanForDetails.reference2Relationship || '',
                    guarantorName: selectedLoanForDetails.guarantorName || '',
                    guarantorPhone: selectedLoanForDetails.guarantorPhone || '',
                    guarantorEmail: selectedLoanForDetails.guarantorEmail || '',
                    guarantorAddress: selectedLoanForDetails.guarantorAddress || '',
                    guarantorRelationship: selectedLoanForDetails.guarantorRelationship || '',
                    guarantorMonthlyIncome: selectedLoanForDetails.guarantorMonthlyIncome || 0,
                    documents: {}
                  });
                  
                  // Set selected product and institution
                  const institution = institutions.find(inst => inst.name === selectedLoanForDetails.institutionName);
                  if (institution) {
                    setSelectedInstitution(institution);
                    const product = institution.products.find(prod => prod.type === selectedLoanForDetails.loanType);
                    if (product) {
                      setSelectedProduct({...product, institutionName: institution.name, institutionId: institution._id});
                    }
                  }
                  
                  // Show progressive form
                  setShowProgressiveForm(true);
                  setCurrentStep(1);
                }}
                className="flex items-center gap-2 bg-white text-gray-800 hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
                Edit Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
