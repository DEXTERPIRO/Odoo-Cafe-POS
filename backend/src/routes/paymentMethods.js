const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', verifyToken, async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { organizationId: req.user.organizationId }
    });
    res.json(methods);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { isEnabled, upiId } = req.body;
    const existing = await prisma.paymentMethod.findFirst({
      where: { id: req.params.id, organizationId: req.user.organizationId }
    });
    if (!existing) return res.status(404).json({ error: 'Payment method not found' });

    const method = await prisma.paymentMethod.update({
      where: { id: req.params.id },
      data: { isEnabled, upiId }
    });
    res.json(method);
  } catch (e) { res.status(500).json({ error: 'Something went wrong' }); }
});

module.exports = router;
