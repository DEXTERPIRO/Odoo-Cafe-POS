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
          },
          organizationId: req.user.organizationId
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
    const ticket = await prisma.kdsTicket.findFirst({
      where: { id: req.params.id, order: { organizationId: req.user.organizationId } }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
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
    io.to(`kds-room-${req.user.organizationId}`).emit('ticket-updated', updated);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/tickets/:ticketId/items/:lineId/done', verifyToken, async (req, res) => {
  try {
    const ticket = await prisma.kdsTicket.findFirst({
      where: { id: req.params.ticketId, order: { organizationId: req.user.organizationId } }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const line = await prisma.orderLine.findFirst({
      where: { id: req.params.lineId, orderId: ticket.orderId }
    });
    if (!line) return res.status(404).json({ error: 'Order line not found' });

    const nextStatus = line.kdsStatus === 'DONE' ? 'PENDING' : 'DONE';
    
    const updatedLine = await prisma.orderLine.update({
      where: { id: req.params.lineId },
      data: { kdsStatus: nextStatus }
    });
    
    const io = req.app.get('io');
    io.to(`kds-room-${req.user.organizationId}`).emit('item-status-updated', {
      ticketId: req.params.ticketId,
      lineId: req.params.lineId,
      kdsStatus: nextStatus
    });
    res.json(updatedLine);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
