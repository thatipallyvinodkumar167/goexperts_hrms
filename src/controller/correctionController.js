import {
  createCorrection,
  getPending,
  decideCorrection,
} from '../services/correctionService.js';
import { notifyHr, notifyUser } from '../utils/notification.js';

/*-------------------------------------------------
   1️⃣ Employee creates a correction request
-------------------------------------------------*/
export const createCorrectionRequest = async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    const { reason, fields, attachments } = req.body;
    if (!reason || !fields) {
      return res
        .status(400)
        .json({ success: false, message: '"reason" and "fields" are required' });
    }

    const request = await createCorrection({
      employeeId,
      reason,
      fields,
      attachments,
    });

    // fire real‑time notification to all HR users
    await notifyHr(request.id, employeeId, reason);

    res.status(201).json({
      success: true,
      requestId: request.id,
      status: request.status,
      message: 'Correction request submitted – HR will review it.',
    });
  } catch (err) {
    console.error("createCorrectionRequest error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/*-------------------------------------------------
   2️⃣ HR lists pending requests
-------------------------------------------------*/
export const listPendingRequests = async (req, res) => {
  try {
    const pending = await getPending();
    res.json({ success: true, requests: pending });
  } catch (err) {
    console.error("listPendingRequests error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/*-------------------------------------------------
   3️⃣ HR approves or rejects a request
-------------------------------------------------*/
export const decideCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, hrNote } = req.body; // action = APPROVE | REJECT

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid action – use APPROVE or REJECT' });
    }

    const updated = await decideCorrection({
      requestId,
      action,
      hrNote,
      hrId: null, 
    });

    // Notify the employee about the outcome
    const title = `Your correction request was ${updated.status.toLowerCase()}`;
    const body =
      action === 'APPROVE'
        ? 'HR approved – you may now edit the details.'
        : `HR rejected: ${hrNote || 'No comment provided.'}`;
    await notifyUser(updated.employeeId, title, body);

    res.json({
      success: true,
      status: updated.status,
      message: `Request ${updated.status.toLowerCase()}.`,
    });
  } catch (err) {
    console.error("decideCorrectionRequest error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
