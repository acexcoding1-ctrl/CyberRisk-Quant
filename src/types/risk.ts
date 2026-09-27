export type Currency = 'USD' | 'INR' | 'EUR';

export type RiskTier = 'Critical' | 'High' | 'Medium' | 'Low';

export type AssetCriticality = 
  | 'Tier 1 - Mission Critical'
  | 'Tier 2 - Business Operational'
  | 'Tier 3 - Supporting Service'
  | 'Tier 4 - Non-Critical';

export interface BusinessUnit {
  id: string;
  name: string;
  revenueContributionPct: number;
  assetCount: number;
  eal: number; // Expected Annual Loss in USD baseline
  var95: number;
  riskScore: number;
  head: string;
  threatActorsTracked: number;
}

export interface Asset {
  id: string;
  name: string;
  type: 'Kubernetes Cluster' | 'Relational DB' | 'Payment Gateway' | 'IAM Directory' | 'API Gateway' | 'Customer Portal' | 'Core Banking' | 'Data Lake';
  businessUnit: string;
  criticality: AssetCriticality;
  revenueAttributionDaily: number;
  downtimeCostPerHour: number;
  dataClassification: 'PCI-DSS / Financial' | 'PII & Customer Data' | 'Intellectual Property' | 'Internal Ops';
  eal: number;
  var95: number;
  controlStrengthPct: number;
  activeVulnerabilities: number;
  hostName: string;
  cloudProvider: 'AWS' | 'GCP' | 'Azure' | 'Hybrid On-Prem';
  status: 'Healthy' | 'At Risk' | 'Critical Attention';
}

export interface VulnerabilityFinding {
  id: string;
  cve: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cvss: number;
  epss: number; // Exploit Prediction Scoring System (0-1)
  affectedAssetId: string;
  assetName: string;
  businessUnit: string;
  discoveryDate: string;
  estimatedFinancialImpact: number;
  remediationCost: number;
  status: 'Open' | 'In Progress' | 'Mitigated';
  threatVector: 'Remote Code Execution' | 'Privilege Escalation' | 'Credential Stuffing' | 'SQL Injection' | 'API Authorization Bypass' | 'Ransomware Vector';
  recommendedAction: string;
  daysOpen: number;
}

export interface TelemetrySource {
  id: string;
  name: string;
  category: 'Vulnerability Management' | 'SIEM' | 'IAM' | 'EDR' | 'CSPM' | 'Threat Intelligence';
  status: 'Connected' | 'Syncing' | 'Degraded';
  eventsIngested24h: string;
  activeFindings: number;
  lastSync: string;
  integrationTool: string;
  healthScore: number;
}

export interface SecurityControl {
  id: string;
  name: string;
  category: 'Identity & Access' | 'Endpoint Defense' | 'Cloud Security' | 'Data Protection' | 'Application Security' | 'Detection & Response';
  effectivenessPct: number;
  coveragePct: number;
  costAnnual: number;
  riskReductionPotential: number;
  currentMaturity: number; // 1-5
  targetMaturity: number; // 1-5
  mappedFrameworks: string[];
}

export interface OptimizationInitiative {
  id: string;
  title: string;
  category: string;
  cost: number;
  expectedRiskReduction: number;
  rosiPct: number; // ((Risk Reduction - Cost) / Cost) * 100
  bcr: number; // Benefit-to-Cost Ratio
  difficulty: 'Low' | 'Medium' | 'High';
  timeWeeks: number;
  businessUnit: string;
  targetControls: string[];
  description: string;
  annualMaintenanceCost: number;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  standard: string;
  governingBody: string;
  maturityScore: number; // out of 5
  compliancePct: number;
  controlsTotal: number;
  controlsCompliant: number;
  controlsPartial: number;
  controlsGap: number;
  mappedEalExposure: number;
  categories: {
    name: string;
    score: number;
    total: number;
    status: 'Compliant' | 'Partial' | 'Non-Compliant';
    riskExposed: number;
  }[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  category: 'Control Improvement' | 'Threat Spike' | 'Operational Delay' | 'Architecture Shift';
  description: string;
  parameterMods: {
    mfaCoverageChange?: number;
    remediationDelayDays?: number;
    edrCoverageChange?: number;
    threatFrequencyMultiplier?: number;
    cloudGuardrailEnforcement?: boolean;
    ransomwarePrevalence?: number;
  };
  ealBaseline: number;
  ealSimulated: number;
  var95Baseline: number;
  var95Simulated: number;
  keyTakeaways: string[];
}

export interface QuantSummary {
  enterpriseRiskScore: number; // 0-100
  riskRating: 'Critical' | 'High' | 'Medium' | 'Low';
  totalEal: number;
  var95: number;
  var99: number;
  maxProbableLoss: number;
  totalAssets: number;
  totalVulnerabilities: number;
  averageControlEffectiveness: number;
  lossBreakdown: {
    businessInterruption: number;
    responseAndForensics: number;
    regulatoryFines: number;
    reputationalLoss: number;
  };
  trend6Month: {
    month: string;
    eal: number;
    riskScore: number;
    incidentCount: number;
  }[];
  lossExceedanceCurve: {
    exceedanceProbability: number; // 0 to 100%
    lossAmount: number;
  }[];
}
