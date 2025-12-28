import React from 'react';
import { Screen, NavProps } from '../types';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';

export const ShopList: React.FC<NavProps> = ({ setScreen }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-10 flex flex-col gap-8 bg-background-dark min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-white/10 shadow-2xl"
      >
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" style={{ backgroundImage: 'linear-gradient(rgba(10, 10, 12, 0.6) 0%, rgba(10, 10, 12, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBluCvBC91CA2EyvRNcxjhO6YPNSwgahViIPZ0TrsJ4wkjoK7N6mxBJEhDzo4zRNgjR50zVRKgQfs89W-GfIpsC85BKtyZn_gG5EBZ9ZeIYJFMNa178NE2dCDc5b-FhQ1ckmDoxP8DvduMUkYmkFyjn_hFY0Mp_H80bhYNryfTUFGTGDqxQIJEgic51AJ9VztN7HFUj2gdEfs6TUlA-euWChtzz_ZANbQXL7JOc5JxME1JKRIEfCSYBfBxbJBqjljLw3_xs1wpPkN-P")' }}></div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-primary mb-4"
          >
            <span className="material-symbols-outlined text-[14px]">diamond</span> Curated Collection
          </motion.div>
          <h1 className="text-white text-4xl md:text-6xl font-display font-light leading-tight mb-4">
            Curated Tools for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200 font-bold">Your Journey</span>
          </h1>
          <p className="text-white/80 text-lg font-light max-w-xl mx-auto">Discover artifacts aligned with your intent, element, and spirit. Hand-picked for the modern mystic.</p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full lg:w-72 flex-shrink-0 space-y-8 p-6 rounded-2xl border border-white/5 bg-surface-dark/40 backdrop-blur-xl lg:sticky lg:top-24"
        >
          <div>
            <h3 className="text-white text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_list</span> Filters
            </h3>
            <p className="text-text-muted text-xs mt-1">Refine by spiritual properties</p>
          </div>
          <FilterSection title="Intent" icon="favorite" items={['Love & Relationships', 'Wealth & Career', 'Protection', 'Healing']} />
          <div className="h-px bg-white/5 w-full"></div>
          <FilterSection title="Elements" icon="local_fire_department" items={['Fire', 'Water', 'Air', 'Earth', 'Spirit']} />
          <div className="h-px bg-white/5 w-full"></div>
          <FilterSection title="Zodiac" icon="star" items={['Aries', 'Taurus', 'Gemini', 'Cancer']} />
        </motion.aside>

        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-6">
            <p className="text-text-muted text-sm"><span className="text-white font-bold">124</span> artifacts found</p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark/50 border border-white/10 rounded-full text-sm text-white hover:bg-white/5 transition-colors">
                <span>Sort: Newest</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <ShopItem
              variants={itemVariants}
              title="Obsidian Protection Bracelet"
              price="$45.00"
              element="Earth"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuA4DE-jq71h8_QHt2yenr9r7tyKtP8FrpOaR9K8X3OS1qN4pUf9pnqUCDaPJNPK_xzKYusszDPgS-86ya7sjUZGrqCRJ3NEed7CqrIRA24ZZ0xG2Cc2YgwXAw1-FrT7QvhVKQ1qW_7yg_QS9hLZRp4T9PEvxi4EAfpbgUIhVXIuPqyAon_etxghHkQri3_hKYWDq7iL-xc9PKjxbm10QlYh7dlicgnev1pDO00olj_uZAvE2dv-YpZ6IMX53yi7sjYIPdz4WjWdWTvE"
              badge="Bestseller"
              onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
            />
            <ShopItem
              variants={itemVariants}
              title="Rose Quartz Love Candle"
              price="$32.00"
              element="Fire"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuAvRmtApVlpulQQccjvUIgodevhDasrqJ9CCdWteJOp5qTN99NTy2LYFcEv-ILeVkHKqb_kHTIaTH_rHY_O7_HEwcPfkI6Pkmsmd1bfQGTVJcihWN3oULv842fg4FUebFudwLI0jhXLUv5iHwGmwMWo82s9zdsgWSePPCul0igiu3ABN1r8hqWhkxxm_wvdm0AWJNmN-CesbQZ0mVr2zgEwSrIALMaRUSM3xvqYqku_Lck6TUs30UgshMA2mazG7K7OQOB2WwgHVG0P"
              onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
            />
            <ShopItem
              variants={itemVariants}
              title="The Starseeker Tarot"
              price="$60.00"
              element="Spirit"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuCOfmNXXThcs-sxapcoNy42Jo6MxgrPsI2XKYU1-34mNBOxSowB0QxjWOxLrdJ4RGg4GFCWUFjxqXYKuYChYwI5Jtj35lpvLS5FMEjVmlifzja0PAna0nZ_DBXGBCAfkUBNRzSi8ojP4TpMVLuWcSSGat9ufEBD3tTI9IWvdYMM5qgv4gFbJfXdiMUE1XW_Cs0ICTCGKyacSV1N1Ki8WiHEeGeuHIFBWifqLy35_nQr_MY-7CtoWHFLmyYc4fPQecqguefb7qI3ZfRv"
              badge="New"
              onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
            />
            <ShopItem
              variants={itemVariants}
              title="Amethyst Cluster"
              price="$28.00"
              element="Air"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuC6tOFPCVNjvrunWCHIor_I7XMU1DOq0W7DVtVxUhVhk1HU-dDwwJgpdZal06FBhu2-kiUNo5T4eAj2OAtQ51AaGg8kzfH-g_BLYYFTCOiTwJbjFm5Jz2YkIEufFwtKp3rv0Ss0cqDDsoxNzlHs749FSZL6xt8PNQfVzfoTlx5R4mLqkFSOuTlJTeTrBnRWefuf_d50unlE1GkKVzA-3_UwO2xa3t0Jw8RxvIrtg7iqgrnbO6IPBFjJ4K3ynyK6f207fPUNN10XP5kn"
              onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
            />
            <ShopItem
              variants={itemVariants}
              title="Sage Smudge Kit"
              price="$18.00"
              element="Earth"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuA-AdY206hxlR83qlVxMD-Q88yN3cd2MKaVK5447XsfcDr1WszvDY3CwDu1c2yyQ2zPWWHv5rtel2iE2vSLNnH42aIT2-ZqH_KEnE2MmiPao1jKJYI0QK7etHDmoXd7a7YXb_t_RqH0uz-jyK536vxYCTc9DqW1sKaeF0DothIBtP0zHUBL1GdczVzVLr4pQpdRl5I35lGZ2BNqjIS7oA7e4XMZy16n4rahvZm0dy45wF3CEJlEQAxhekLXKJAsDSItcazxkcEkN19q"
              onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
            />
            <ShopItem
              variants={itemVariants}
              title="Golden Altar Cloth"
              price="$25.00"
              element="Metal"
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuAhY5G7Lu8i8SZ0j1jxgPwgZ-EDpJLlFyKeoZrEcN8TLorFjbYgVDjosWTf1ARtuVWbwn1997IhzVYzm4GrEIAT8bj-MJ9Ybg52R4T1ojI5Wk2jly6E27FEOEJucoXLYG0ilqI-y-QSMUtcROIFtzH3sMPHPu67KXcsUfUmKPABQUd3dET7SBSkSRT4MkLoIz8Ig96o9-KtM5X2IuzxYfKG70LZNT3oM6ys3p1ZlrMknI5xoS210T-ZzgBUSLFox6No40ID9S1Mbyoy"
              badge="Sale"
              onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({ title, icon, items }: any) => (
  <div className="space-y-4">
    <button className="flex items-center justify-between w-full group">
      <div className="flex items-center gap-3 text-white font-medium text-sm">
        <span className={`material-symbols-outlined text-primary text-[20px] ${items ? 'fill' : ''}`}>{icon}</span> {title}
      </div>
      <span className="material-symbols-outlined text-text-muted text-[20px] group-hover:text-white transition-colors">expand_more</span>
    </button>
    {items && (
      <div className="pl-8 space-y-3">
        {items.map((item: string) => (
          <label key={item} className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input type="checkbox" className="peer appearance-none h-4 w-4 border border-white/20 rounded bg-white/5 checked:bg-primary checked:border-primary transition-all cursor-pointer" defaultChecked={item.includes('Wealth')} />
              <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[12px] pointer-events-none">check</span>
            </div>
            <span className="text-text-muted text-sm group-hover:text-white transition-colors">{item}</span>
          </label>
        ))}
      </div>
    )}
  </div>
);

const ShopItem = ({ title, price, element, image, badge, onClick, variants }: any) => (
  <motion.div variants={variants} onClick={onClick}>
    <GlassCard hoverEffect interactive className="flex flex-col gap-3 group h-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-dark border border-white/5">
        {badge && <div className="absolute top-3 left-3 z-10"><span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-primary/30 uppercase tracking-widest shadow-lg">{badge}</span></div>}
        <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: `url("${image}")` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
          <GlowButton variant="primary" className="w-full text-xs py-2">Quick Add</GlowButton>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <div className="flex justify-between items-start">
          <h3 className="text-white font-bold text-base leading-tight group-hover:text-primary transition-colors">{title}</h3>
          <span className="text-primary font-bold">{price}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="material-symbols-outlined text-[14px] text-primary">auto_awesome</span> <span>{element} Element</span>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);

export const ProductDetail: React.FC<NavProps> = () => {
  return (
    <div className="flex h-full grow flex-col bg-background-dark min-h-screen">
      <div className="px-4 lg:px-20 xl:px-40 flex flex-1 justify-center py-10">
        <div className="flex flex-col max-w-[1200px] flex-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 px-4 py-2 text-sm mb-6"
          >
            <span className="text-text-muted hover:text-white cursor-pointer transition-colors">Shop</span>
            <span className="text-text-muted">/</span>
            <span className="text-text-muted hover:text-white cursor-pointer transition-colors">Candles</span>
            <span className="text-text-muted">/</span>
            <span className="text-white font-medium">The Mystic Oud Candle</span>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10 px-4 py-4">
            {/* Product Image Gallery */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden group shadow-2xl border border-white/5"
              >
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBBVcw7kCDLa8cjlN-Cpv6lAWzfEKIStgYXZZteeoIzSDzdGYs_4qE1K5BMv79WJjraNSNzy5Ve0xJ_6HPtAlsBEaAjFS7U0f6NUTXjKyZVOV665EBdL_YGpoGgqzCCOHOFX3u8lUx8KzrhSVuQ4X0Kz601UNyhTIJH_l0WTUT9ARN0BwH1Mbcyl3_osD7AcvrCABsSERr8ZXfANvM0tGO1Hp_Ko68cqEyz8hdGfmpcbKHyhUbzMBT6rhqhc0Gkem4K148akYmdosJ1")' }}></div>
                <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 hover:bg-black/60 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-white text-[20px]">play_circle</span>
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Preview Ritual</span>
                </div>
              </motion.div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-24 h-24 flex-shrink-0 rounded-lg border-2 ${i === 1 ? 'border-primary' : 'border-transparent'} overflow-hidden cursor-pointer`}>
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBVcw7kCDLa8cjlN-Cpv6lAWzfEKIStgYXZZteeoIzSDzdGYs_4qE1K5BMv79WJjraNSNzy5Ve0xJ_6HPtAlsBEaAjFS7U0f6NUTXjKyZVOV665EBdL_YGpoGgqzCCOHOFX3u8lUx8KzrhSVuQ4X0Kz601UNyhTIJH_l0WTUT9ARN0BwH1Mbcyl3_osD7AcvrCABsSERr8ZXfANvM0tGO1Hp_Ko68cqEyz8hdGfmpcbKHyhUbzMBT6rhqhc0Gkem4K148akYmdosJ1" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-6 lg:w-1/2 pt-2"
            >
              <div className="flex flex-col gap-4 text-left">
                <div>
                  <h1 className="text-white text-4xl md:text-5xl font-display font-light leading-tight tracking-[-0.02em]">The Mystic Oud</h1>
                  <p className="text-primary font-bold mt-2 text-lg">Sacred Grounding Series</p>
                </div>

                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                  <span className="text-white text-3xl font-bold">$45.00</span>
                  <div className="h-8 w-px bg-white/10"></div>
                  <div className="flex flex-col">
                    <div className="flex text-[#F4C025] text-[16px]">
                      <span className="material-symbols-outlined fill">star</span>
                      <span className="material-symbols-outlined fill">star</span>
                      <span className="material-symbols-outlined fill">star</span>
                      <span className="material-symbols-outlined fill">star</span>
                      <span className="material-symbols-outlined fill">star_half</span>
                    </div>
                    <span className="text-text-muted text-xs hover:text-white cursor-pointer transition-colors">Read 128 Reviews</span>
                  </div>
                </div>

                <GlassCard className="p-4 flex gap-4 items-start bg-primary/5 border-primary/20">
                  <div className="p-2 rounded-full bg-primary/20 text-primary animate-pulse"><span className="material-symbols-outlined">auto_awesome</span></div>
                  <div>
                    <h3 className="text-white text-sm font-bold mb-1 uppercase tracking-wider">Cosmic Match Detected</h3>
                    <p className="text-white/80 text-sm font-light leading-relaxed">Based on your birth chart, this artifact harmonizes with your current <strong>Saturn transit</strong> in the 4th house, providing necessary grounding energy.</p>
                  </div>
                </GlassCard>

                <p className="text-white/80 text-lg font-light leading-relaxed mt-2">
                  Hand-poured soy wax blended with rare Oud wood essence. Designed to ground wandering energies and establish a sacred perimeter for your daily practice. Each candle is infused with Reiki energy under the New Moon.
                </p>
              </div>

              <div className="flex flex-col gap-6 mt-6">
                <div className="flex gap-4">
                  <div className="h-14 w-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-between px-2">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-[18px]">remove</span></button>
                    <span className="text-white font-bold text-lg">1</span>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-[18px]">add</span></button>
                  </div>
                  <GlowButton variant="primary" icon="shopping_bag" className="flex-1 h-14 text-base">Add to Cart</GlowButton>
                  <button className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-primary hover:border-primary/50 transition-colors"><span className="material-symbols-outlined">favorite</span></button>
                </div>
                <p className="text-center text-xs text-white/40">Free shipping on orders over $100 • 30-day spirit guarantee</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-10 px-4 py-16 border-t border-white/5 mt-16"
          >
            <div className="flex flex-col gap-4 text-center items-center">
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Deep Dive</span>
              <h2 className="text-white tracking-tight text-3xl md:text-5xl font-display font-light leading-tight">The Experience</h2>
              <p className="text-text-muted text-lg font-light max-w-[600px]">Dive deeper into the spiritual significance and practical application of this artifact.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ExpCard icon="spa" title="The Vibe" desc="Smoky, grounding, and ancient. Reminiscent of temples at dusk." delay={0} />
              <ExpCard icon="local_fire_department" title="The Ritual" desc="Light during the new moon. Write your intention on the included parchment." delay={0.1} />
              <ExpCard icon="menu_book" title="The Wisdom" desc="Formulated with Oud, associated with the Root Chakra for grounding energy." delay={0.2} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ExpCard = ({ icon, title, desc, delay }: any) => (
  <GlassCard
    className="flex flex-col gap-6 p-8 items-center text-center hover:border-primary/30"
    intensity="low"
    hoverEffect
  >
    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_30px_rgba(244,192,37,0.1)]">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div className="flex flex-col gap-3">
      <h3 className="text-white text-xl font-bold font-display">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
    </div>
  </GlassCard>
);