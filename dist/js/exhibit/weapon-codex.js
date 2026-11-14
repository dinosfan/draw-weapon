window.ExhibitWeaponCodex = {
  mount() {
    const { Types, Rarity } = Craft;
    const make = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const panel = make('section', 'guide-weapon-codex');
    const heading = make('h3', '', '시연 무기 ' + GameDemo.entries.length + '종');
    const list = make('div', 'guide-weapon-list');
    const pending = new Map();
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting) continue;
        observer.unobserve(target);
        pending.get(target)?.();
        pending.delete(target);
      }
    }, {root:document.getElementById('exhibit-guide-content'), rootMargin:'120px'}) : null;
    panel.append(heading, list);

    for (const entry of GameDemo.entries) {
      const card = make('details', 'guide-weapon-card');
      const summary = make('summary', 'guide-weapon-summary');
      const frame = make('span', 'guide-weapon-art');
      const title = make('span', 'guide-weapon-title');
      const badges = make('span', 'guide-weapon-types');
      const details = make('div', 'guide-weapon-details');
      const hint = make('span', 'guide-weapon-hint', '기술 보기');
      badges.innerHTML = Types.badges(entry.types);
      title.append(make('strong', '', entry.name), badges);
      summary.append(frame, title, hint);
      card.append(summary, details);
      list.append(card);
      let loading = false, loaded = false;

      async function showPack() {
        if (loading || loaded) return;
        loading = true;
        details.textContent = '무기 정보를 불러오는 중…';
        try {
          const { weapon } = await GameDemo.pack(entry.id);
          if (Craft.validArtwork(weapon.artwork)) {
            const artwork = make('img');
            artwork.src = weapon.artwork;
            artwork.alt = '';
            artwork.decoding = 'async';
            frame.replaceChildren(artwork);
          }
          if (Rarity.valid(weapon.rarity)) {
            const tier = Rarity.get(weapon.rarity);
            const rarity = make('span', 'type-badge', tier.label);
            rarity.style.setProperty('--type-color', GamePalette.tokens[tier.color]);
            rarity.style.setProperty('--type-ink', GamePalette.tokens[tier.color === 'ghost' ? 'surface' : 'ink']);
            badges.append(rarity);
          }
          const moves = make('ol', 'guide-weapon-moves');
          for (const move of weapon.moves) {
            const row = make('li');
            const label = make('div', 'guide-weapon-move-title');
            const type = make('span');
            type.innerHTML = Types.badge(move.element);
            row.style.setProperty('--type-color', Types.color(move.element));
            label.append(make('strong', '', move.name), type);
            row.append(label, make('p', '', move.description));
            moves.append(row);
          }
          details.replaceChildren(make('p', 'guide-weapon-reason', weapon.reason), moves);
          loaded = true;
        } catch {
          const retry = make('button', '', '무기 정보 다시 불러오기');
          retry.type = 'button';
          retry.addEventListener('click', showPack, { once: true });
          details.replaceChildren(retry);
        } finally { loading = false; }
      }
      card.addEventListener('toggle', () => { if (card.open) showPack(); });
      if (observer) {
        pending.set(card, showPack);
        observer.observe(card);
      } else showPack();
    }

    return panel;
  },
};
