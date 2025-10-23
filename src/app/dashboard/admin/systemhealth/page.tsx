'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Database, 
  Users, 
  Building2, 
  CreditCard, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';

interface SystemHealthData {
  database: {
    status: string;
    connected: boolean;
    collections: {
      users: number;
      institutions: number;
      loans: number;
    };
    storage: {
      dataSize: number;
      indexSize: number;
      totalSize: number;
    };
  };
  metrics: {
    totalUsers: number;
    totalInstitutions: number;
    totalLoans: number;
    recentActivity: {
      users: number;
      institutions: number;
      loans: number;
    };
  };
  distributions: {
    loanStatus: Record<string, number>;
    institutionStatus: Record<string, number>;
    userRoles: Record<string, number>;
  };
  performance: {
    healthScore: number;
    uptime: {
      hours: number;
      minutes: number;
      total: number;
    };
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
  };
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }>;
}

export default function AdminSystemHealth() {
  const [systemData, setSystemData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/systemhealth');
      if (response.ok) {
        const data = await response.json();
        setSystemData(data);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch system health data');
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchSystemHealth();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemHealth]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !systemData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system health data...</span>
      </div>
    );
  }

  if (!systemData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load System Health</h3>
        <p className="text-muted-foreground mb-4">Unable to fetch system health data</p>
        <Button onClick={fetchSystemHealth}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Server className="h-8 w-8 text-primary" />
            System Health Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time system monitoring and database health status
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchSystemHealth}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                <span className={getHealthScoreColor(systemData.performance.healthScore)}>
                  {systemData.performance.healthScore}
                </span>
                <span className="text-muted-foreground text-lg">/100</span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Health Score</div>
                <div className="text-xs text-muted-foreground">
                  {systemData.performance.healthScore >= 90 ? 'Excellent' :
                   systemData.performance.healthScore >= 70 ? 'Good' :
                   systemData.performance.healthScore >= 50 ? 'Fair' : 'Poor'}
                </div>
              </div>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${getHealthScoreBgColor(systemData.performance.healthScore)}`}
                style={{ width: `${systemData.performance.healthScore}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {systemData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemData.alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getAlertBadgeColor(alert.type)}>
                        {alert.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <Badge className={systemData.database.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {systemData.database.connected ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Connected</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" />Disconnected</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Collections</span>
                <span className="text-sm text-muted-foreground">
                  {systemData.database.collections.users + systemData.database.collections.institutions + systemData.database.collections.loans} total
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Users</span>
                  <span>{systemData.database.collections.users}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Institutions</span>
                  <span>{systemData.database.collections.institutions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Loans</span>
                  <span>{systemData.database.collections.loans}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Size</span>
                <span className="text-sm font-medium">{formatBytes(systemData.database.storage.totalSize)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Data Size</span>
                  <span>{formatBytes(systemData.database.storage.dataSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Index Size</span>
                  <span>{formatBytes(systemData.database.storage.indexSize)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemData.metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +{systemData.metrics.recentActivity.users} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemData.metrics.totalInstitutions}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +{systemData.metrics.recentActivity.institutions} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemData.metrics.totalLoans}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +{systemData.metrics.recentActivity.loans} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemData.performance.uptime.hours}h {systemData.performance.uptime.minutes}m
            </div>
            <p className="text-xs text-muted-foreground">
              <Activity className="w-3 h-3 inline mr-1" />
              System running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>RSS Memory</span>
                <span>{formatBytes(systemData.performance.memoryUsage.rss)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Heap Total</span>
                <span>{formatBytes(systemData.performance.memoryUsage.heapTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Heap Used</span>
                <span>{formatBytes(systemData.performance.memoryUsage.heapUsed)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>External</span>
                <span>{formatBytes(systemData.performance.memoryUsage.external)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Node Version</span>
                <span>{systemData.performance.nodeVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform</span>
                <span className="capitalize">{systemData.performance.platform}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Process ID</span>
                <span>{process.pid}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Status Distribution</CardTitle>
            <CardDescription>Current loan status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(systemData.distributions.loanStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(count / systemData.metrics.totalLoans) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Institution Status</CardTitle>
            <CardDescription>Institution approval status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(systemData.distributions.institutionStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(count / systemData.metrics.totalInstitutions) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>User role distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(systemData.distributions.userRoles).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(count / systemData.metrics.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}