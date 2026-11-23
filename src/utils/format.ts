import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PlatformComparisonPoint, PostItem, ReportItem } from '../types/index.ts';

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString('en-US');
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatDateShort(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generatePdfReport(params: {
  title: string;
  reportType: string;
  startDate: string;
  endDate: string;
  summaryMetrics: ReportItem['summaryMetrics'];
  platformComparison: PlatformComparisonPoint[];
  topPosts: PostItem[];
  workspaceOwner: string;
}): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Navy header band
  doc.setFillColor(11, 17, 32);
  doc.rect(0, 0, 595, 92, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Trendora Analytics Report', 40, 38);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(params.title, 40, 58);
  doc.text(
    `Period: ${formatDateShort(params.startDate)} – ${formatDateShort(params.endDate)}   |   Prepared for ${params.workspaceOwner}`,
    40,
    74
  );

  // Executive KPI Summary Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 40, 122);

  autoTable(doc, {
    startY: 132,
    head: [['Total Followers', 'Total Likes', 'Total Comments', 'Total Shares', 'Avg. Engagement', 'Posts']],
    body: [
      [
        formatNumber(params.summaryMetrics.totalFollowers),
        formatNumber(params.summaryMetrics.totalLikes),
        formatNumber(params.summaryMetrics.totalComments),
        formatNumber(params.summaryMetrics.totalShares),
        `${params.summaryMetrics.avgEngagementRate.toFixed(2)}%`,
        formatNumber(params.summaryMetrics.totalPosts),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
    styles: { fontSize: 10, halign: 'center', cellPadding: 8 },
  });

  const afterSummaryY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;

  // Platform Breakdown
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Platform Performance Breakdown', 40, afterSummaryY + 28);

  autoTable(doc, {
    startY: afterSummaryY + 38,
    head: [['Platform', 'Account', 'Status', 'Followers', 'Likes', 'Comments', 'Engagement']],
    body: params.platformComparison.map((p) => [
      p.label,
      p.accountName || 'Not configured',
      p.connectionStatus.toUpperCase(),
      formatNumber(p.followers),
      formatNumber(p.likes),
      formatNumber(p.comments),
      `${p.engagementRate.toFixed(2)}%`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 6 },
  });

  const afterPlatformsY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 360;

  if (params.topPosts.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performing Posts', 40, afterPlatformsY + 28);

    autoTable(doc, {
      startY: afterPlatformsY + 38,
      head: [['Title', 'Platform', 'Published', 'Likes', 'Comments', 'Shares', 'Eng. Rate']],
      body: params.topPosts.slice(0, 8).map((post) => [
        post.title.slice(0, 42) + (post.title.length > 42 ? '…' : ''),
        post.platform.toUpperCase(),
        formatDateShort(post.publishedAt),
        formatNumber(post.likes),
        formatNumber(post.comments),
        formatNumber(post.shares),
        `${post.engagementRate.toFixed(2)}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 6 },
    });
  }

  const safeSlug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`${safeSlug || 'trendora-report'}.pdf`);
}
