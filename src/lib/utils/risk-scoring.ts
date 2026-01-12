/**
 * Risk Scoring System for Borrowers
 *
 * Score ranges:
 * - 0-30: Low Risk (Green)
 * - 31-60: Medium Risk (Yellow)
 * - 61-100: High Risk (Red)
 */

export interface RiskFactors {
  // Covenant health (0-100, higher = worse)
  breachCount: number;
  warningCount: number;
  avgHeadroom: number | null; // percentage
  lowestHeadroom: number | null;

  // Credit profile
  creditRating: string | null;

  // Financial health
  leverageRatio: number | null;
  interestCoverage: number | null;

  // Trends
  headroomTrend: 'improving' | 'stable' | 'deteriorating' | 'unknown';
}

export interface RiskScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
}

const RATING_RISK_MAP: Record<string, number> = {
  'AAA': 0,
  'AA+': 5,
  'AA': 8,
  'AA-': 10,
  'A+': 12,
  'A': 15,
  'A-': 18,
  'BBB+': 22,
  'BBB': 28,
  'BBB-': 35,
  'BB+': 45,
  'BB': 52,
  'BB-': 60,
  'B+': 68,
  'B': 75,
  'B-': 82,
  'CCC+': 88,
  'CCC': 92,
  'CCC-': 95,
  'CC': 97,
  'C': 99,
  'D': 100,
};

export function calculateRiskScore(factors: RiskFactors): RiskScore {
  const riskFactors: RiskScore['factors'] = [];
  let totalScore = 0;
  let weightSum = 0;

  // Factor 1: Active breaches (weight: 30)
  const breachWeight = 30;
  if (factors.breachCount > 0) {
    const breachImpact = Math.min(factors.breachCount * 20, 100);
    totalScore += breachImpact * breachWeight;
    riskFactors.push({
      name: 'Covenant Breaches',
      impact: breachImpact,
      description: `${factors.breachCount} active breach${factors.breachCount > 1 ? 'es' : ''}`,
    });
  }
  weightSum += breachWeight;

  // Factor 2: Warning covenants (weight: 20)
  const warningWeight = 20;
  if (factors.warningCount > 0) {
    const warningImpact = Math.min(factors.warningCount * 15, 80);
    totalScore += warningImpact * warningWeight;
    riskFactors.push({
      name: 'Warning Covenants',
      impact: warningImpact,
      description: `${factors.warningCount} covenant${factors.warningCount > 1 ? 's' : ''} at warning level`,
    });
  }
  weightSum += warningWeight;

  // Factor 3: Headroom (weight: 20)
  const headroomWeight = 20;
  if (factors.lowestHeadroom !== null) {
    let headroomImpact = 0;
    if (factors.lowestHeadroom < 0) {
      headroomImpact = 100;
    } else if (factors.lowestHeadroom < 5) {
      headroomImpact = 80;
    } else if (factors.lowestHeadroom < 10) {
      headroomImpact = 60;
    } else if (factors.lowestHeadroom < 15) {
      headroomImpact = 40;
    } else if (factors.lowestHeadroom < 25) {
      headroomImpact = 20;
    } else {
      headroomImpact = 0;
    }
    totalScore += headroomImpact * headroomWeight;
    riskFactors.push({
      name: 'Headroom Cushion',
      impact: headroomImpact,
      description: `Lowest headroom: ${factors.lowestHeadroom.toFixed(1)}%`,
    });
  }
  weightSum += headroomWeight;

  // Factor 4: Credit rating (weight: 15)
  const ratingWeight = 15;
  if (factors.creditRating) {
    const ratingRisk = RATING_RISK_MAP[factors.creditRating.toUpperCase()] ?? 50;
    totalScore += ratingRisk * ratingWeight;
    riskFactors.push({
      name: 'Credit Rating',
      impact: ratingRisk,
      description: `Rating: ${factors.creditRating}`,
    });
  }
  weightSum += ratingWeight;

  // Factor 5: Trend (weight: 15)
  const trendWeight = 15;
  let trendImpact = 30; // default for unknown
  switch (factors.headroomTrend) {
    case 'improving':
      trendImpact = 0;
      break;
    case 'stable':
      trendImpact = 20;
      break;
    case 'deteriorating':
      trendImpact = 80;
      break;
  }
  totalScore += trendImpact * trendWeight;
  if (factors.headroomTrend !== 'unknown') {
    riskFactors.push({
      name: 'Performance Trend',
      impact: trendImpact,
      description: `Trend: ${factors.headroomTrend}`,
    });
  }
  weightSum += trendWeight;

  // Calculate final score
  const finalScore = Math.round(totalScore / weightSum);

  // Determine level
  let level: RiskScore['level'] = 'low';
  if (finalScore > 60) level = 'high';
  else if (finalScore > 30) level = 'medium';

  // Generate recommendations
  const recommendations: string[] = [];

  if (factors.breachCount > 0) {
    recommendations.push('Immediate attention required for covenant breaches');
    recommendations.push('Consider requesting waiver or amendment from borrower');
  }

  if (factors.warningCount > 0) {
    recommendations.push('Monitor warning covenants closely');
    recommendations.push('Schedule review meeting with borrower');
  }

  if (factors.lowestHeadroom !== null && factors.lowestHeadroom < 15) {
    recommendations.push('Low headroom - consider requesting updated financials');
  }

  if (factors.headroomTrend === 'deteriorating') {
    recommendations.push('Deteriorating trend - increase monitoring frequency');
    recommendations.push('Review borrower financial projections');
  }

  if (level === 'high') {
    recommendations.push('Consider placing on watchlist');
    recommendations.push('Review collateral and security position');
  }

  return {
    score: finalScore,
    level,
    factors: riskFactors.sort((a, b) => b.impact - a.impact),
    recommendations: recommendations.slice(0, 5),
  };
}

export function getRiskColor(level: RiskScore['level']): string {
  switch (level) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
  }
}

export function getRiskBadgeVariant(level: RiskScore['level']): 'default' | 'secondary' | 'destructive' {
  switch (level) {
    case 'low':
      return 'secondary';
    case 'medium':
      return 'default';
    case 'high':
      return 'destructive';
  }
}
