"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  AlertCircle,
  FileCheck,
  Calendar,
  Award,
  ExternalLink
} from 'lucide-react';
import { RegulatoryCompliance, RegulatoryStandard, ComplianceIssue } from '@/lib/reporting-types';

interface ComplianceStatusProps {
  compliance: RegulatoryCompliance;
}

export function ComplianceStatus({ compliance }: ComplianceStatusProps) {
  const getComplianceIcon = (status: RegulatoryStandard['complianceStatus']) => {
    switch (status) {
      case 'compliant':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'non_compliant':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'not_applicable':
        return { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-50' };
      default:
        return { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const getSeverityColor = (severity: ComplianceIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilAudit = () => {
    if (!compliance.nextAuditDate) return null;
    const today = new Date();
    const audit = new Date(compliance.nextAuditDate);
    const diffTime = audit.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilAudit = getDaysUntilAudit();

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className={`text-2xl font-bold ${getComplianceScoreColor(compliance.complianceScore)}`}>
                  {compliance.complianceScore}%
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={compliance.complianceScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliant Standards</p>
                <p className="text-2xl font-bold text-green-600">
                  {compliance.standards.filter(s => s.complianceStatus === 'compliant').length}
                  <span className="text-sm text-muted-foreground">
                    /{compliance.standards.length}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Audit</p>
                <p className="text-lg font-bold text-purple-600">
                  {daysUntilAudit !== null ? (
                    daysUntilAudit > 0 ? `${daysUntilAudit} days` : 'Overdue'
                  ) : (
                    'Not scheduled'
                  )}
                </p>
                {compliance.nextAuditDate && (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(compliance.nextAuditDate)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regulatory Standards Compliance
          </CardTitle>
          <CardDescription>
            Status of compliance with applicable regulations and standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {compliance.standards.map((standard, index) => {
              const statusInfo = getComplianceIcon(standard.complianceStatus);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`h-10 w-10 rounded-lg ${statusInfo.bg} flex items-center justify-center`}>
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{standard.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${statusInfo.color.replace('text-', 'text-')} ${statusInfo.bg.replace('bg-', 'bg-')}`}
                            >
                              {standard.complianceStatus.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {standard.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Authority: {standard.authority}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last checked: {formatDate(standard.lastChecked)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Requirements List */}
                    <div className="mt-4 pl-13">
                      <h4 className="text-sm font-medium mb-2">Key Requirements:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {standard.requirements.slice(0, 3).map((req, reqIndex) => (
                          <li key={reqIndex} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                        {standard.requirements.length > 3 && (
                          <li className="text-blue-600 cursor-pointer hover:underline">
                            +{standard.requirements.length - 3} more requirements
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Evidence */}
                    {standard.evidence.length > 0 && (
                      <div className="mt-4 pl-13">
                        <h4 className="text-sm font-medium mb-2">Supporting Evidence:</h4>
                        <div className="flex flex-wrap gap-2">
                          {standard.evidence.map((evidence, evidenceIndex) => (
                            <Badge key={evidenceIndex} variant="secondary" className="text-xs">
                              <FileCheck className="h-3 w-3 mr-1" />
                              {evidence}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Issues */}
      {compliance.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Compliance Issues
              <Badge variant="destructive" className="ml-2">
                {compliance.issues.filter(issue => issue.status === 'open').length} Open
              </Badge>
            </CardTitle>
            <CardDescription>
              Active compliance issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {compliance.issues.map((issue) => (
                <Card key={issue.id} className={`border-l-4 ${
                  issue.severity === 'critical' ? 'border-l-red-500' :
                  issue.severity === 'high' ? 'border-l-orange-500' :
                  issue.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {issue.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1">{issue.description}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Regulation: {issue.regulation}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Discovered: {formatDate(issue.discoveredDate)}</p>
                          <p>Due: {formatDate(issue.dueDate)}</p>
                          {issue.assignedTo && <p>Assigned to: {issue.assignedTo}</p>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Audit Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {compliance.lastAuditDate && (
                <div>
                  <p className="text-sm font-medium">Last Audit</p>
                  <p className="text-lg">{formatDate(compliance.lastAuditDate)}</p>
                </div>
              )}
              {compliance.nextAuditDate && (
                <div>
                  <p className="text-sm font-medium">Next Audit</p>
                  <p className="text-lg">{formatDate(compliance.nextAuditDate)}</p>
                  {daysUntilAudit !== null && (
                    <p className={`text-sm ${
                      daysUntilAudit <= 30 ? 'text-orange-600' : 
                      daysUntilAudit <= 7 ? 'text-red-600' : 
                      'text-green-600'
                    }`}>
                      {daysUntilAudit > 0 ? `${daysUntilAudit} days remaining` : 'Audit is overdue'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Regional Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Region</span>
                <Badge variant="outline" className="capitalize">
                  {compliance.region.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Applicable Standards</span>
                <Badge variant="secondary">
                  {compliance.standards.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compliance Score</span>
                <Badge className={getComplianceScoreColor(compliance.complianceScore).replace('text-', 'bg-').replace('600', '100 text-') + '-600'}>
                  {compliance.complianceScore}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}