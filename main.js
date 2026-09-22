const MODULE_ID = "lipatos-gm-hidden-npc-hp";

Hooks.once("ready", () => {
  // GM sees both damage and healing as normal.
  if (game.user.isGM) return;

  const iface = canvas?.interface;
  if (!iface || typeof iface.createScrollingText !== "function") {
    console.warn(`${MODULE_ID} | canvas.interface.createScrollingText not found`);
    return;
  }

  if (iface.__lipatosGmHiddenNpcHpPatchedV2) return;
  iface.__lipatosGmHiddenNpcHpPatchedV2 = true;

  const original = iface.createScrollingText.bind(iface);

  iface.createScrollingText = function(origin, content, options={}) {
    try {
      const text = String(content ?? "").trim();

      // In Foundry/D&D5e healing is shown as a positive delta: +14.
      // Damage is negative: -14.
      // Players may see damage, but NPC healing must remain hidden.
      const isHealingDelta = /^\+\s*\d+(?:[.,]\d+)?$/.test(text);

      if (isHealingDelta && origin && canvas?.tokens?.placeables?.length) {
        const x = Number(origin.x);
        const y = Number(origin.y);

        if (Number.isFinite(x) && Number.isFinite(y)) {
          const npcToken = canvas.tokens.placeables.find(token => {
            const actor = token.actor;
            if (!actor || actor.type !== "npc") return false;

            const cx = token.center?.x ?? (token.x + token.w / 2);
            const cy = token.center?.y ?? (token.y + token.h / 2);
            const radius = Math.max(
              token.w ?? 0,
              token.h ?? 0,
              canvas.grid?.size ?? 100
            ) * 0.9;

            return Math.hypot(x - cx, y - cy) <= radius;
          });

          if (npcToken) return;
        }
      }
    } catch (err) {
      console.warn(`${MODULE_ID} | suppression check failed`, err);
    }

    return original(origin, content, options);
  };

  console.log(`${MODULE_ID} | NPC damage visible; NPC healing hidden for players.`);
});
