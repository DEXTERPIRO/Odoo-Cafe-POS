const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const tickets = await prisma.kdsTicket.findMany({
      where: {
        order: {
          status: {
            not: 'CANCELLED'
          }
        },
        NOT: {
          stage: 'COMPLETED',
          order: {
            status: 'PAID'
          }
        },
        OR: [
          { stage: { not: 'COMPLETED' } },
          {
            stage: 'COMPLETED',
            updatedAt: { gte: thirtyMinutesAgo }
          }
        ]
      },
      include: { order: { include: { lines: { include: { product: true } }, table: true, customers: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(tickets);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/tickets/:id/stage', verifyToken, async (req, res) => {
  try {
    const { stage } = req.body;
    const ticket = await prisma.kdsTicket.findUnique({ where: { id: req.params.id } });
    
    let nextStage = stage;
    if (!nextStage) {
      nextStage = ticket.stage === 'TO_COOK' ? 'PREPARING' : 'COMPLETED';
    }
    
    const updated = await prisma.kdsTicket.update({
      where: { id: req.params.id },
      data: { stage: nextStage },
      include: { order: { include: { lines: { include: { product: true } }, table: true, customers: true } } }
    });

    // Update order status:
    // If ticket is completed -> order status = READY
    // If ticket moves back (TO_COOK or PREPARING) -> order status = SENT_TO_KITCHEN
    let orderStatus = 'SENT_TO_KITCHEN';
    if (nextStage === 'COMPLETED') {
      orderStatus = 'READY';
    }
    
    await prisma.order.update({
      where: { id: updated.orderId },
      data: { status: orderStatus },
    });
    updated.order.status = orderStatus;

    const io = req.app.get('io');
    io.to('kds-room').emit('ticket-updated', updated);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/tickets/:ticketId/items/:lineId/done', verifyToken, async (req, res) => {
  try {
    const line = await prisma.orderLine.findUnique({ where: { id: req.params.lineId } });
    const nextStatus = line.kdsStatus === 'DONE' ? 'PENDING' : 'DONE';
    
    const updatedLine = await prisma.orderLine.update({
      where: { id: req.params.lineId },
      data: { kdsStatus: nextStatus }
    });
    
    const io = req.app.get('io');
    io.to('kds-room').emit('item-status-updated', {
      ticketId: req.params.ticketId,
      lineId: req.params.lineId,
      kdsStatus: nextStatus
    });
    res.json(updatedLine);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
