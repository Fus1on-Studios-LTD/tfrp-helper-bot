router.post('/globalrole/map/set', async (req, res) => {
  try {
    const { guildId, key, roleId } = req.body;

    if (!guildId || !key || !roleId) {
      throw new Error('guildId, key, and roleId are required');
    }

    const config = await prisma.guildConfig.findUnique({
      where: { guildId },
    });

    const roleMap = config?.roleMap || {};

    roleMap[key.toUpperCase()] = roleId;

    const updated = await prisma.guildConfig.upsert({
      where: { guildId },
      update: { roleMap },
      create: {
        guildId,
        roleMap,
      },
    });

    res.json({ ok: true, roleMap: updated.roleMap });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post('/globalrole/map/list', async (req, res) => {
  const { guildId } = req.body;

  const config = await prisma.guildConfig.findUnique({
    where: { guildId },
  });

  res.json({
    ok: true,
    roleMap: config?.roleMap || {},
  });
});