'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Pill
} from 'lucide-react';
import { format } from 'date-fns';

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorLicense: string;
  medicines: {
    medicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
  }[];
  diagnosis: string;
  notes: string;
  status: 'pending' | 'dispensed' | 'cancelled' | 'expired';
  prescribedDate: string;
  expiryDate: string;
  dispensedDate?: string;
  prescriptionType: 'online' | 'physical';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PharmacyPrescriptionsPage() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    prescriptionNumber: '',
    patientId: '',
    patientName: '',
    doctorName: '',
    doctorLicense: '',
    medicines: [] as any[],
    diagnosis: '',
    notes: '',
    prescribedDate: '',
    expiryDate: '',
    prescriptionType: 'physical' as 'online' | 'physical',
    totalAmount: 0
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/prescriptions');
      const data = await response.json();
      
      if (data.success) {
        setPrescriptions(data.prescriptions || []);
      } else {
        setError(data.error || 'Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setError('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDispensePrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setPrescriptions(prescriptions.map(p => 
          p._id === prescriptionId 
            ? { ...p, status: 'dispensed', dispensedDate: new Date().toISOString() }
            : p
        ));
        setError(null);
      } else {
        setError(data.error || 'Failed to dispense prescription');
      }
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      setError('Failed to dispense prescription');
    }
  };

  const handleAddPrescription = async () => {
    try {
      const response = await fetch('/api/pharmacy/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setPrescriptions([data.prescription, ...prescriptions]);
        setShowAddModal(false);
        setFormData({
          prescriptionNumber: '',
          patientId: '',
          patientName: '',
          doctorName: '',
          doctorLicense: '',
          medicines: [],
          diagnosis: '',
          notes: '',
          prescribedDate: '',
          expiryDate: '',
          prescriptionType: 'physical',
          totalAmount: 0
        });
        setError(null);
      } else {
        setError(data.error || 'Failed to add prescription');
      }
    } catch (error) {
      console.error('Error adding prescription:', error);
      setError('Failed to add prescription');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      dispensed: 'default',
      cancelled: 'destructive',
      expired: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      online: 'default',
      physical: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'dispensed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    const matchesType = typeFilter === 'all' || prescription.prescriptionType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to view prescriptions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground">Manage prescription orders and dispensing</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prescription
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              {prescriptions.filter(p => p.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Awaiting dispensing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispensed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'dispensed').length}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'expired').length}</div>
            <p className="text-xs text-muted-foreground">Past expiry date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dispensed">Dispensed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions ({filteredPrescriptions.length})</CardTitle>
          <CardDescription>Manage prescription orders and dispensing</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No prescriptions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prescription #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead>Prescribed Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(prescription.status)}
                        <span className="font-medium">{prescription.prescriptionNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prescription.patientName}</div>
                        <div className="text-sm text-gray-500">ID: {prescription.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prescription.doctorName}</div>
                        <div className="text-sm text-gray-500">License: {prescription.doctorLicense}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(prescription.prescriptionType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Pill className="w-4 h-4 text-blue-500" />
                        <span>{prescription.medicines.length} medicines</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(new Date(prescription.prescribedDate), 'MMM d, yyyy')}</div>
                        <div className="text-sm text-gray-500">
                          Expires: {format(new Date(prescription.expiryDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {prescription.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleDispensePrescription(prescription._id)}
                          >
                            Dispense
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Prescription Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              View prescription information and medicines
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Prescription Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Prescription Number</Label>
                  <p className="text-sm text-gray-600">{selectedPrescription.prescriptionNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPrescription.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <p className="text-sm text-gray-600">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Doctor</Label>
                  <p className="text-sm text-gray-600">{selectedPrescription.doctorName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Prescribed Date</Label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedPrescription.prescribedDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedPrescription.expiryDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <Label className="text-sm font-medium">Diagnosis</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Medicines */}
              <div>
                <Label className="text-sm font-medium">Medicines</Label>
                <div className="mt-2 space-y-3">
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Medicine</Label>
                          <p className="text-sm text-gray-600">{medicine.medicineName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Dosage</Label>
                          <p className="text-sm text-gray-600">{medicine.dosage}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Frequency</Label>
                          <p className="text-sm text-gray-600">{medicine.frequency}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Duration</Label>
                          <p className="text-sm text-gray-600">{medicine.duration}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Quantity</Label>
                          <p className="text-sm text-gray-600">{medicine.quantity}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Instructions</Label>
                          <p className="text-sm text-gray-600">{medicine.instructions}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedPrescription.notes}</p>
                </div>
              )}

              {/* Total Amount */}
              <div>
                <Label className="text-sm font-medium">Total Amount</Label>
                <p className="text-lg font-bold text-gray-900">K {selectedPrescription.totalAmount.toFixed(2)}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                {selectedPrescription.status === 'pending' && (
                  <Button onClick={() => {
                    handleDispensePrescription(selectedPrescription._id);
                    setShowDetails(false);
                  }}>
                    Dispense Prescription
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Prescription Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Prescription</DialogTitle>
            <DialogDescription>
              Enter prescription details for a new order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prescriptionNumber">Prescription Number</Label>
                <Input
                  id="prescriptionNumber"
                  value={formData.prescriptionNumber}
                  onChange={(e) => setFormData({...formData, prescriptionNumber: e.target.value})}
                  placeholder="Enter prescription number"
                />
              </div>
              <div>
                <Label htmlFor="prescriptionType">Prescription Type</Label>
                <Select value={formData.prescriptionType} onValueChange={(value: 'online' | 'physical') => setFormData({...formData, prescriptionType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  placeholder="Enter patient ID"
                />
              </div>
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
            </div>

            {/* Doctor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input
                  id="doctorName"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                  placeholder="Enter doctor name"
                />
              </div>
              <div>
                <Label htmlFor="doctorLicense">Doctor License</Label>
                <Input
                  id="doctorLicense"
                  value={formData.doctorLicense}
                  onChange={(e) => setFormData({...formData, doctorLicense: e.target.value})}
                  placeholder="Enter doctor license"
                />
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                placeholder="Enter diagnosis"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter additional notes"
                rows={2}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prescribedDate">Prescribed Date</Label>
                <Input
                  id="prescribedDate"
                  type="date"
                  value={formData.prescribedDate}
                  onChange={(e) => setFormData({...formData, prescribedDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                placeholder="Enter total amount"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPrescription}>
                Add Prescription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
