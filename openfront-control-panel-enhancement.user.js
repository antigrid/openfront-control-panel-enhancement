// ==UserScript==
// @name         OpenFront.io - Control Panel Enhancement
// @namespace    https://github.com/antigrid/openfront-control-panel-enhancement
// @version      0.0.2
// @description  Displays current and remaining troop percentages in the control panel
// @author       antigrid (Discord: webdev.js)
// @match        https://*.openfront.io/*
// @match        https://*.openfront.dev/*
// @icon         https://cdnjs.cloudflare.com/ajax/libs/twemoji/16.0.1/svg/1f39b.svg
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/antigrid/openfront-control-panel-enhancement
// @supportURL   https://github.com/antigrid/openfront-control-panel-enhancement/issues
// @updateURL    https://raw.githubusercontent.com/antigrid/openfront-control-panel-enhancement/main/openfront-control-panel-enhancement.user.js
// @downloadURL  https://raw.githubusercontent.com/antigrid/openfront-control-panel-enhancement/main/openfront-control-panel-enhancement.user.js
// ==/UserScript==

(function () {
  "use strict";

  const COLORS = {
    CRITICAL: "#f87171", // rgb(248,113,113) - Warm Red
    WARNING: "#fb923c",
    CAUTION: "#eab308", // rgb(234,179,8) - Sunflower
    GOOD: "#22c55e", // rgb(34,197,94) - Emerald
    EXCELLENT: "#22d3ee",
  };

  const THRESHOLDS = {
    LOW_CRITICAL: 9,
    LOW_WARNING: 18,
    LOW_CAUTION: 23,
    LOW_GOOD: 31,
    HIGH_GOOD: 54,
    HIGH_CAUTION: 64,
    HIGH_WARNING: 70,
    HIGH_CRITICAL: 82,
    REMAINING_CRITICAL: 15,
    REMAINING_WARNING: 23,
  };

  let cachedElements = {
    troopsValueContainer: null,
    attackSlider: null,
    currentPercentSpan: null,
    remainingPercentBadge: null,
  };

  function renderTroops(troops, fixedPoints) {
    let num = Number(troops) / 10;
    num = Math.max(num, 0);

    if (num >= 10_000_000) {
      const value = Math.floor(num / 100000) / 10;
      return value.toFixed(fixedPoints ?? 0) + "M";
    } else if (num >= 1_000_000) {
      const value = Math.floor(num / 10000) / 100;
      return value.toFixed(fixedPoints ?? 1) + "M";
    } else if (num >= 100000) {
      return Math.floor(num / 1000) + "K";
    } else if (num >= 10000) {
      const value = Math.floor(num / 100) / 10;
      return value.toFixed(fixedPoints ?? 0) + "K";
    } else if (num >= 1000) {
      const value = Math.floor(num / 10) / 100;
      return value.toFixed(fixedPoints ?? 1) + "K";
    } else {
      return Math.floor(num).toString();
    }
  }

  function getPercentageColor(percentage) {
    if (percentage < THRESHOLDS.LOW_CRITICAL || percentage > THRESHOLDS.HIGH_CRITICAL) {
      return COLORS.CRITICAL;
    }
    if (percentage < THRESHOLDS.LOW_WARNING || percentage > THRESHOLDS.HIGH_WARNING) {
      return COLORS.WARNING;
    }
    if (percentage < THRESHOLDS.LOW_CAUTION || percentage > THRESHOLDS.HIGH_CAUTION) {
      return COLORS.CAUTION;
    }
    if (percentage < THRESHOLDS.LOW_GOOD || percentage > THRESHOLDS.HIGH_GOOD) {
      return COLORS.GOOD;
    }
    return COLORS.EXCELLENT;
  }

  function getPanelRoot(panel) {
    return panel.renderRoot || panel.shadowRoot || panel;
  }

  function findDesktopTroopValueContainer(panel) {
    const root = getPanelRoot(panel);
    const soldierIcons = root.querySelectorAll('img[src*="SoldierIcon.svg"]');

    for (const icon of soldierIcons) {
      const bar = icon.closest('div[class*="bg-gray-900"][class*="overflow-hidden"][class*="relative"]');
      if (!bar) continue;

      const overlay = bar.querySelector('div[translate="no"][class*="text-xl"]');
      const currentValue = overlay?.firstElementChild;
      if (currentValue) return currentValue;
    }

    return null;
  }

  function findAttackSlider(panel) {
    const root = getPanelRoot(panel);
    const sliders = root.querySelectorAll('input[type="range"][min="1"][max="100"]');

    for (const slider of sliders) {
      const row = slider.parentElement;
      if (!row?.matches('.flex.items-center.gap-2, .flex.gap-2.items-center')) continue;

      const swordIcon = row.querySelector('img[src*="SwordIcon"]');
      const leftBadge = row.querySelector('div[class*="border-gray-600"][class*="cursor-pointer"]');
      if (swordIcon) return slider;
      if (leftBadge) return slider;
    }

    return null;
  }

  function getOrCreateSpan(className, parent, position = "append") {
    let span = parent.querySelector(`.${className}`);
    if (!span) {
      span = document.createElement("span");
      span.className = className;
      span.style.fontSize = "14px";
      span.style.fontWeight = "700";
      if (position === "prepend") {
        parent.insertBefore(span, parent.firstChild);
      } else {
        parent.appendChild(span);
      }
    }
    return span;
  }

  function getOrCreateRemainingBadge(parent) {
    let badge = parent.querySelector(".ofio-remaining-pct-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className =
        "ofio-remaining-pct-badge flex items-center gap-1 shrink-0 border border-gray-600 rounded-md p-1 text-sm font-bold";
      badge.style.minWidth = "60px";
      parent.appendChild(badge);
    }
    return badge;
  }

  function updateDisplay(panel) {
    const player = panel.game?.myPlayer?.();
    if (!player) return;

    const troops = panel._troops ?? player.troops();
    const maxTroops = panel._maxTroops ?? panel.game.config().maxTroops(player);
    const attackRatio = panel.uiState?.attackRatio ?? panel.attackRatio ?? 0.2;

    const currentPct = (troops / maxTroops) * 100;
    const remainingTroops = troops * (1 - attackRatio);
    const remainingPct = (remainingTroops / maxTroops) * 100;

    const root = getPanelRoot(panel);

    if (!cachedElements.troopsValueContainer || !root.contains(cachedElements.troopsValueContainer)) {
      cachedElements.troopsValueContainer = findDesktopTroopValueContainer(panel);
      cachedElements.currentPercentSpan = null;
    }

    if (cachedElements.troopsValueContainer) {
      cachedElements.currentPercentSpan = getOrCreateSpan(
        "ofio-current-pct",
        cachedElements.troopsValueContainer,
        "prepend",
      );
      cachedElements.currentPercentSpan.textContent = `${currentPct.toFixed(0)}% `;
      cachedElements.currentPercentSpan.style.color = getPercentageColor(currentPct);
      cachedElements.currentPercentSpan.style.marginRight = "auto";
      cachedElements.currentPercentSpan.style.marginLeft = "6px";
      cachedElements.currentPercentSpan.style.textShadow = "0 1px 1px rgba(0,0,0,0.8)";
    }

    if (!cachedElements.attackSlider || !root.contains(cachedElements.attackSlider)) {
      cachedElements.attackSlider = findAttackSlider(panel);
      cachedElements.remainingPercentBadge = null;
    }

    if (cachedElements.attackSlider) {
      const attackRow = cachedElements.attackSlider.parentElement;
      if (!attackRow) return;

      cachedElements.remainingPercentBadge = getOrCreateRemainingBadge(attackRow);
      cachedElements.remainingPercentBadge.textContent = `→ ${remainingPct.toFixed(0)}%`;
      cachedElements.remainingPercentBadge.title = `Remaining troops: ${renderTroops(remainingTroops)}`;
      cachedElements.remainingPercentBadge.style.color =
        remainingPct > 55 ? COLORS.GOOD : getPercentageColor(remainingPct);
    }
  }

  function patchControlPanel() {
    customElements.whenDefined("control-panel").then(() => {
      const panel = document.querySelector("control-panel");
      if (!panel) {
        const observer = new MutationObserver((_, obs) => {
          const el = document.querySelector("control-panel");
          if (el) {
            obs.disconnect();
            applyPatch(el);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }
      applyPatch(panel);
    });
  }

  function applyPatch(panel) {
    const proto = panel.constructor.prototype;
    if (proto._ofioPatched) return;

    const originalUpdated = proto.updated;
    proto.updated = function (changedProps) {
      if (originalUpdated) originalUpdated.call(this, changedProps);
      try {
        updateDisplay(this);
      } catch (_) {}
    };

    proto._ofioPatched = true;
  }

  patchControlPanel();
})();
