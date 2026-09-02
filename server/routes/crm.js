const express = require('express');
const router = express.Router();
const CrmDeal = require('../models/CrmDeal');
const CrmStage = require('../models/CrmStage');
const CrmActivity = require('../models/CrmActivity');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const DEFAULT_STAGES = [
  { name: 'New Lead', color: '#8A8177', order: 0, kind: 'open' },
  { name: 'First Email Sent', color: '#2AA9C4', order: 1, kind: 'open' },
  { name: 'Meeting Scheduled', color: '#8B5CF6', order: 2, kind: 'open' },
  { name: 'Meeting done', color: '#4C6FE7', order: 3, kind: 'open' },
  { name: 'Quotation sent', color: '#E8A23D', order: 4, kind: 'open' },
  { name: 'In negotiation', color: '#3B5BDB', order: 5, kind: 'open' },
  { name: 'Won', color: '#1F8A4C', order: 6, kind: 'won' },
  { name: 'Lost', color: '#D84A5B', order: 7, kind: 'lost' },
];

// Helper to ensure default stages exist
async function ensureDefaultStages() {
  const count = await CrmStage.countDocuments?.() || (await CrmStage.find()).length;
  if (count === 0) {
    await CrmStage.insertMany(DEFAULT_STAGES);
  }
}

// ---------------- STAGES ----------------
router.get('/stages', protect, async (req, res) => {
  try {
    await ensureDefaultStages();
    const stages = await CrmStage.find().sort({ order: 1 });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/stages', protect, async (req, res) => {
  try {
    const { name, color, kind } = req.body;
    if (!name) return res.status(400).json({ message: 'Stage name is required' });
    const count = (await CrmStage.find()).length;
    const stage = new CrmStage({
      name,
      color: color || '#8A8177',
      kind: kind || 'open',
      order: count
    });
    await stage.save();
    res.status(201).json(stage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/stages/reorder', protect, async (req, res) => {
  try {
    const { stages } = req.body;
    if (Array.isArray(stages)) {
      for (const s of stages) {
        if (s._id) {
          await CrmStage.findByIdAndUpdate(s._id, { order: s.order });
        }
      }
    }
    const updated = await CrmStage.find().sort({ order: 1 });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/stages/:id', protect, async (req, res) => {
  try {
    const stage = await CrmStage.findById(req.params.id);
    if (!stage) return res.status(404).json({ message: 'Stage not found' });
    if (req.body.name) stage.name = req.body.name;
    if (req.body.color) stage.color = req.body.color;
    if (req.body.kind) stage.kind = req.body.kind;
    await stage.save();
    res.json(stage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/stages/:id', protect, async (req, res) => {
  try {
    await CrmStage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stage removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- DEAL OWNERS ----------------
router.get('/deal-owners', protect, async (req, res) => {
  try {
    const users = await User.find().select('_id name email profilePicture designation');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- DEALS ----------------
router.get('/deals', protect, async (req, res) => {
  try {
    const { q, stage, owner, sort } = req.query;
    let query = {};
    if (stage) query.stage = stage;
    if (owner) query.owner = owner;

    let deals = await CrmDeal.find(query).populate('owner');

    if (q) {
      const qLower = q.toLowerCase();
      deals = deals.filter(d => 
        (d.name && d.name.toLowerCase().includes(qLower)) ||
        (d.company?.name && d.company.name.toLowerCase().includes(qLower)) ||
        (d.contact?.name && d.contact.name.toLowerCase().includes(qLower))
      );
    }

    if (sort) {
      const [field, dir] = sort.split(':');
      deals.sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';
        if (field === 'amount') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        }
        if (dir === 'desc') return valA < valB ? 1 : -1;
        return valA > valB ? 1 : -1;
      });
    }

    res.json(deals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/deals/:id', protect, async (req, res) => {
  try {
    const deals = await CrmDeal.find().sort({ createdAt: -1 });
    const deal = await CrmDeal.findById(req.params.id).populate('owner');
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    const idx = deals.findIndex(d => String(d._id) === String(req.params.id));
    const prevId = idx > 0 ? String(deals[idx - 1]._id) : null;
    const nextId = idx >= 0 && idx < deals.length - 1 ? String(deals[idx + 1]._id) : null;

    res.json({
      deal,
      prevId,
      nextId,
      index: idx >= 0 ? idx + 1 : 1,
      total: deals.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/deals', protect, async (req, res) => {
  try {
    const dealData = { ...req.body };
    if (!dealData.owner && req.user) {
      dealData.owner = req.user._id;
    }
    const deal = new CrmDeal(dealData);
    await deal.save();
    
    // Log activity
    const activity = new CrmActivity({
      dealId: deal._id,
      type: 'note',
      content: `Deal "${deal.name}" created`,
      createdBy: req.user?._id
    });
    await activity.save();

    const populated = await CrmDeal.findById(deal._id).populate('owner');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/deals/:id', protect, async (req, res) => {
  try {
    const deal = await CrmDeal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    Object.assign(deal, req.body);
    await deal.save();

    const populated = await CrmDeal.findById(deal._id).populate('owner');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/deals/:id/stage', protect, async (req, res) => {
  try {
    const { stage } = req.body;
    const deal = await CrmDeal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    const prevStage = deal.stage;
    deal.stage = stage;
    deal.stageHistory = deal.stageHistory || [];
    deal.stageHistory.push({
      from: prevStage,
      to: stage,
      changedBy: req.user?._id,
      changedAt: new Date()
    });

    if (stage === 'Won') {
      deal.isWon = true;
      deal.isLost = false;
    } else if (stage === 'Lost') {
      deal.isLost = true;
      deal.isWon = false;
    }

    await deal.save();

    // Log stage change activity
    const activity = new CrmActivity({
      dealId: deal._id,
      type: 'stage_change',
      stageData: { from: prevStage, to: stage },
      createdBy: req.user?._id
    });
    await activity.save();

    const populated = await CrmDeal.findById(deal._id).populate('owner');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/deals/:id/won', protect, async (req, res) => {
  try {
    const deal = await CrmDeal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    const prevStage = deal.stage;
    deal.stage = 'Won';
    deal.isWon = true;
    deal.isLost = false;
    await deal.save();

    const activity = new CrmActivity({
      dealId: deal._id,
      type: 'stage_change',
      stageData: { from: prevStage, to: 'Won' },
      content: 'Deal marked as WON 🎉',
      createdBy: req.user?._id
    });
    await activity.save();

    const populated = await CrmDeal.findById(deal._id).populate('owner');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/deals/:id/lost', protect, async (req, res) => {
  try {
    const { lostReason } = req.body;
    const deal = await CrmDeal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: 'Deal not found' });

    const prevStage = deal.stage;
    deal.stage = 'Lost';
    deal.isLost = true;
    deal.isWon = false;
    deal.lostReason = lostReason || '';
    await deal.save();

    const activity = new CrmActivity({
      dealId: deal._id,
      type: 'stage_change',
      stageData: { from: prevStage, to: 'Lost' },
      content: `Deal marked as LOST. Reason: ${lostReason || 'Not specified'}`,
      createdBy: req.user?._id
    });
    await activity.save();

    const populated = await CrmDeal.findById(deal._id).populate('owner');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/deals/:id', protect, async (req, res) => {
  try {
    await CrmDeal.findByIdAndDelete(req.params.id);
    await CrmActivity.deleteMany({ dealId: req.params.id });
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- ACTIVITIES ----------------
router.get('/deals/:id/activities', protect, async (req, res) => {
  try {
    const activities = await CrmActivity.find({ dealId: req.params.id })
      .populate('createdBy', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/deals/:id/activities', protect, async (req, res) => {
  try {
    const activity = new CrmActivity({
      ...req.body,
      dealId: req.params.id,
      createdBy: req.user?._id
    });
    await activity.save();

    // If it's a task, also update deal's nextTask
    if (activity.type === 'task') {
      await CrmDeal.findByIdAndUpdate(req.params.id, {
        nextTask: { taskData: activity.taskData, _id: activity._id }
      });
    }

    const populated = await CrmActivity.findById(activity._id).populate('createdBy', 'name profilePicture');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/activities/:activityId', protect, async (req, res) => {
  try {
    const activity = await CrmActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    Object.assign(activity, req.body);
    await activity.save();

    const populated = await CrmActivity.findById(activity._id).populate('createdBy', 'name profilePicture');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/deals/:id/activities/:activityId', protect, async (req, res) => {
  try {
    const activity = await CrmActivity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    Object.assign(activity, req.body);
    await activity.save();

    const populated = await CrmActivity.findById(activity._id).populate('createdBy', 'name profilePicture');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/activities/:activityId', protect, async (req, res) => {
  try {
    await CrmActivity.findByIdAndDelete(req.params.activityId);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/deals/:id/activities/:activityId', protect, async (req, res) => {
  try {
    await CrmActivity.findByIdAndDelete(req.params.activityId);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
