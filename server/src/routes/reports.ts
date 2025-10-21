import { Router } from 'express';
import { Report } from '@/models/Report';
import { Content } from '@/models/Content';
import { protect } from '@/middleware/auth';
import { ReportType, ReportStatus } from '@/types';

const router = Router();

// Submit a report (authenticated only for now)
router.post('/content/:contentId', protect, async (req: any, res: any) => {
  try {
    const { contentId } = req.params;
    const { type, description } = req.body;

    // Validate report type
    if (!type || !Object.values(ReportType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid report type is required',
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    const reporterId = req.user._id;

    // Check if user already reported this content
    const existingReport = await Report.findOne({
      reporter: reporterId,
      reportedContent: contentId,
      contentType: 'media',
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content',
      });
    }

    // Create report
    const report = await Report.create({
      reporter: reporterId,
      reportedContent: contentId,
      contentType: 'media',
      type,
      description: description.substring(0, 500),
      status: ReportStatus.PENDING,
    });

    // Check if content has multiple reports - auto-hide after 3 reports
    const reportCount = await Report.countDocuments({
      reportedContent: contentId,
      status: ReportStatus.PENDING,
    });

    if (reportCount >= 3) {
      // Auto-hide content with multiple reports
      await Content.findByIdAndUpdate(contentId, {
        isHidden: true,
      });
      console.log(`🚨 Content ${contentId} auto-hidden after ${reportCount} reports`);
    }

    res.json({
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
      report: {
        id: report._id.toString(),
        type: report.type,
        status: report.status,
      },
    });
  } catch (error: any) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
    });
  }
});

// Get user's reports (authenticated only)
router.get('/my-reports', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error('Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
    });
  }
});

export default router;
