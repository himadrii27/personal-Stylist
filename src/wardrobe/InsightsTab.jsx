import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, ShoppingBag, ExternalLink, Loader2, Wand2, Moon } from 'lucide-react';
import { colourReport, findGaps, wearStats, FIT } from './style';
import { categoryOf } from './store';
import { SectionHead, Thumb, serif } from './parts';
import { fmtDate, rupees } from './format';
import { searchCategoryProducts } from '../utils/productSearchService';

/* Insights: colour check · worth buying · what you actually wear. */

const ORDER = ['best', 'neutral', 'outside', 'avoid'];
const BUDGETS = ['₹2,000', '₹5,000', '₹10,000', '₹20,000+'];
const PLURAL = { top: 'tops', bottom: 'bottoms', dress: 'dresses', outerwear: 'outerwear', shoes: 'shoes', accessory: 'accessories' };

function ColourCheck({ items, urls, season, onOpenColours, onOpen }) {
  const r = useMemo(() => colourReport(items, season), [items, season]);
  if (!r) {
    return (
      <section className="wd-panel wd-panel--cta">
        <SectionHead label="Colour check" title="Which of your clothes suit you?">
          Find your colour season with a quick face scan, and we'll rate every piece you own.
        </SectionHead>
        <button className="wd-btn" onClick={onOpenColours}><Palette size={15} /> Find my colours</button>
      </section>
    );
  }
  const pct = Math.round((r.suits / Math.max(1, r.total)) * 100);
  return (
    <section className="wd-panel" aria-labelledby="wd-cc">
      <SectionHead label="Colour check" title={<span id="wd-cc"><em className="wd-big">{pct}%</em> of your wardrobe suits you</span>}>
        {r.suits} of {r.total} pieces are in your <strong>{season.name}</strong> best colours or neutrals.
      </SectionHead>
      <div className="wd-stack" role="img" aria-label={ORDER.map(k => `${FIT[k].label}: ${r.groups[k].length}`).join(', ')}>
        {ORDER.map(k => r.groups[k].length ? <span key={k} className={`wd-stack-seg wd-fit--${k}`} style={{ flexGrow: r.groups[k].length }} /> : null)}
      </div>
      <div className="wd-fitgroups">
        {ORDER.map(k => r.groups[k].length > 0 && (
          <div key={k} className="wd-fitgroup">
            <p className={`wd-fit wd-fit--${k}`}><i aria-hidden="true" />{FIT[k].label} · {r.groups[k].length}</p>
            <p className="wd-hint">{FIT[k].tip}</p>
            <div className="wd-thumbs">
              {r.groups[k].map(it => <button key={it.id} className="wd-thumb-btn" onClick={() => onOpen(it)} aria-label={it.name}><Thumb item={it} url={urls[it.id]} size={56} /></button>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GapCard({ gap, byId, urls, index }) {
  const [budget, setBudget] = useState(null);
  const [state, setState] = useState({ loading: false, products: null, error: null });
  const find = async (b) => {
    setBudget(b);
    setState({ loading: true, products: null, error: null });
    try { setState({ loading: false, products: await searchCategoryProducts(gap.staple.query, b), error: null }); }
    catch (e) { setState({ loading: false, products: null, error: e.message }); }
  };
  const pairs = gap.pairsWith.map(id => byId[id]).filter(Boolean);
  return (
    <motion.article className="wd-gap" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06 } }}>
      <div className="wd-gap-top">
        <span className="wd-gap-swatch" style={{ background: gap.staple.colour.hex }}><small>{categoryOf(gap.staple.category).label}</small></span>
        <div>
          <p className="wd-gap-rank">No. {index + 1}</p>
          <h3 style={{ fontFamily: serif }}>{gap.staple.name}</h3>
          <p className="wd-msg">{gap.fills ? `You don't own any ${PLURAL[gap.staple.category]} yet. ` : ''}Pairs with <strong>{pairs.length}</strong> of your pieces for <strong>{gap.count}</strong> new outfit{gap.count === 1 ? '' : 's'}.</p>
        </div>
      </div>
      <div className="wd-thumbs wd-thumbs--overlap" aria-label="Goes with">
        {pairs.slice(0, 8).map(p => <Thumb key={p.id} item={p} url={urls[p.id]} size={40} />)}
        {pairs.length > 8 && <span className="wd-thumb wd-thumb--more">+{pairs.length - 8}</span>}
      </div>
      <div className="wd-gap-shop">
        <span className="wd-tagrow-label"><ShoppingBag size={13} style={{ verticalAlign: '-2px' }} /> Find it under</span>
        <div className="wd-chips">
          {BUDGETS.map(b => <button key={b} className={`wd-chip wd-chip--sm${budget === b ? ' is-on' : ''}`} onClick={() => find(b)}>{b}</button>)}
        </div>
      </div>
      <AnimatePresence>
        {budget && (
          <motion.div className="wd-products" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {state.loading ? <p className="wd-hint"><Loader2 size={13} className="wd-spin" /> Finding {gap.staple.name.toLowerCase()}…</p>
              : state.error ? <p className="wd-hint is-warn">{state.error}</p>
              : !state.products?.length ? <p className="wd-hint">Nothing found in that range — try another.</p>
              : (
                <div className="wd-product-row">
                  {state.products.map((p, i) => (
                    <a key={i} className="wd-product" href={p.url || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(gap.staple.query)}`} target="_blank" rel="noopener noreferrer">
                      <span className="wd-product-img">{p.image ? <img src={p.image} alt="" loading="lazy" /> : <ShoppingBag size={18} />}</span>
                      <span className="wd-product-title">{p.title}</span>
                      <span className="wd-product-meta">{p.price}{p.store ? ` · ${p.store}` : ''} <ExternalLink size={11} /></span>
                    </a>
                  ))}
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function WorthBuying({ items, urls, season, gender, byId }) {
  const gaps = useMemo(() => findGaps(items, { season, gender }), [items, season, gender]);
  return (
    <section className="wd-panel" aria-labelledby="wd-wb">
      <SectionHead label="Worth buying" title={<span id="wd-wb">Buy less, wear more</span>}>
        {gaps.length ? 'The few pieces that would unlock the most new outfits from what you already own.' : 'Your wardrobe already covers the classics — nothing obvious missing.'}
      </SectionHead>
      <div className="wd-gaps">{gaps.map((g, i) => <GapCard key={g.staple.id} gap={g} index={i} byId={byId} urls={urls} />)}</div>
    </section>
  );
}

function WhatYouWear({ items, outfits, urls, onStyle, onOpen }) {
  const s = useMemo(() => wearStats(items, outfits), [items, outfits]);
  if (!s.total) {
    return (
      <section className="wd-panel">
        <SectionHead label="What you wear" title="Your wear log starts today">
          Tap “Wore it today” on a piece or an outfit. After a week or two you'll see your favourites, cost per wear, and what's been forgotten.
        </SectionHead>
      </section>
    );
  }
  return (
    <section className="wd-panel" aria-labelledby="wd-wyw">
      <SectionHead label="What you wear" title={<span id="wd-wyw"><em className="wd-big">{s.total}</em> wear{s.total === 1 ? '' : 's'} logged</span>}>
        Since {fmtDate(s.since)}{s.favouriteOutfit ? ` · favourite outfit: ${s.favouriteOutfit.name}` : ''}
      </SectionHead>
      <div className="wd-wear-grid">
        <div>
          <p className="wd-tagrow-label">Most worn</p>
          <ol className="wd-rank">
            {s.mostWorn.map(it => (
              <li key={it.id}><button className="wd-rank-row" onClick={() => onOpen(it)}><Thumb item={it} url={urls[it.id]} size={40} /><span>{it.name}</span><strong>{it.wears.length}×</strong></button></li>
            ))}
          </ol>
        </div>
        <div>
          <p className="wd-tagrow-label">Cost per wear</p>
          {s.withPrice.length ? (
            <ol className="wd-rank">
              {s.withPrice.slice(0, 4).map(({ item, wears, perWear }) => (
                <li key={item.id}><button className="wd-rank-row" onClick={() => onOpen(item)}><Thumb item={item} url={urls[item.id]} size={40} /><span>{item.name}<small>{wears} wear{wears === 1 ? '' : 's'}</small></span><strong>{rupees(perWear)}</strong></button></li>
              ))}
            </ol>
          ) : <p className="wd-hint">Add a price to a piece (open it from Pieces) to see what each wear really costs.</p>}
        </div>
      </div>
      {s.sleepers.length > 0 && (
        <div className="wd-sleepers">
          <p className="wd-tagrow-label"><Moon size={13} style={{ verticalAlign: '-2px' }} /> Not worn in 2 months</p>
          <div className="wd-sleeper-row">
            {s.sleepers.slice(0, 6).map(it => (
              <div key={it.id} className="wd-sleeper">
                <Thumb item={it} url={urls[it.id]} size={64} />
                <span>{it.name}</span>
                <button className="wd-link wd-link--icon" onClick={() => onStyle(it)}><Wand2 size={13} /> Style it</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function InsightsTab(props) {
  return (
    <div className="wd-tabpanel">
      <ColourCheck {...props} />
      <WorthBuying {...props} />
      <WhatYouWear {...props} />
    </div>
  );
}
