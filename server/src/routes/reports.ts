import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '@/models/Report';
import { Content } from '@/models/Content';
import { protect } from '@/middleware/auth';

const router = Router();

// Submit a report (authenticated or anonymous)
router.post('/content/:contentId', async (req: any, res: any) => {
  try {
    const { contentId } = req.params;
    const { reason, details } = req.body;

    // Validate reason
    const validReasons = ['inappropriate', 'spam', 'harassment', 'illegal', 'copyright', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Valid reason is required',
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

    const reportedBy = req.user?._id?.toString() || 'anonymous';
    const reporterUsername = req.user?.username;

    // Check if user already reported this content
    const existingReport = await Report.findOne({
      contentId,
      reportedBy,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content',
      });
    }

    // Create report
    const report = await Report.create({
      _id: uuidv4(),
      contentId,
      reportedBy,
      reporterUsername,
      reason,
      details: details?.substring(0, 1000),
      status: 'pending',
      createdAt: new Date(),
    });

    // Check if content has multiple reports - auto-hide after 3 reports
    const reportCount = await Report.countDocuments({
      contentId,
      status: 'pending',
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
        id: report._id,
        reason: report.reason,
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
    const userId = req.user._id.toString();

    const reports = await Report.find({ reportedBy: userId })
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
